import { InvoiceRepository } from './invoices.repository';
import { PDFParser } from './pdf-parser/pdf-parser';
import { OCRParser } from './ocr-parser/ocr-parser';
import { ExtractionResult, ExtractedInvoiceData } from './invoices.types';
import { FileTypeDetector } from '../../shared/utils/file-type-detector';
import { LLMExtractionService } from '../llm-module/llm.service';

interface ValidationResult {
    invoiceNumberValid: boolean;
    dateValid: boolean;
    vendorValid: boolean;
    gstnValid: boolean;
    totalValid: boolean;
    validFieldCount: number;
}

const MINIMUM_MEANINGFUL_LENGTH = 50;

export class ExtractionService {
    private pdfParser: PDFParser;
    private ocrParser: OCRParser;

    constructor(
        private invoiceRepository: InvoiceRepository,
        private llmExtractionService: LLMExtractionService
    ) {
        this.pdfParser = new PDFParser();
        this.ocrParser = new OCRParser();
    }

    private validateExtractedData(data: ExtractedInvoiceData): ValidationResult {
        const validation: ValidationResult = {
            invoiceNumberValid: false,
            dateValid: false,
            vendorValid: false,
            gstnValid: false,
            totalValid: false,
            validFieldCount: 0
        };


        if (data.invoiceNumber && data.invoiceNumber !== 'UNKNOWN' && /^[A-Z0-9][A-Z0-9\- ]{1,}[A-Z0-9]$/i.test(data.invoiceNumber.trim())) {
            validation.invoiceNumberValid = true;
        }

        if (data.invoiceDate && /^\d{4}-\d{2}-\d{2}$/.test(data.invoiceDate)) {
            const year = parseInt(data.invoiceDate.split('-')[0]);
            if (year >= 2015 && year <= new Date().getFullYear()) {
                validation.dateValid = true;
            }
        }

        if (data.vendorName && data.vendorName !== 'UNKNOWN' && data.vendorName.length >= 3) {
            validation.vendorValid = true;
        }

        if (data.gstin && data.gstin !== 'UNKNOWN' && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(data.gstin)) {
            validation.gstnValid = true;
        }

        if (data.totalAmount && data.totalAmount > 0) {
            validation.totalValid = true;
        }

        validation.validFieldCount = Object.entries(validation)
            .filter(([key, value]) => key !== 'validFieldCount' && value === true)
            .length;

        return validation;
    }

    async extractFromBuffer(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult> {
        try {
            const fileType = FileTypeDetector.detectFileType(fileName);

            if (fileType === 'unknown') {
                return {
                    success: false,
                    extractionStatus: 'FAILED',
                    error: `Unsupported file type. Supported formats: PDF, JPG, PNG, GIF, BMP, WEBP, TIFF`
                };
            }

            const parser = fileType === 'pdf' ? this.pdfParser : this.ocrParser;
            let initialResult = await parser.extractFromBuffer(fileBuffer);
            console.log('sdfsdf', initialResult);

            if (
                fileType === 'pdf' &&
                (!initialResult.rawText || initialResult.rawText.trim().length < MINIMUM_MEANINGFUL_LENGTH)
            ) {
                console.log('fallaback');
                return {
                    success: false,
                    extractionStatus: 'FAILED',
                    failureReason: 'UNREADABLE_SCAN',
                    error: 'This PDF appears to be a scanned document with no extractable text. Please upload it as a photo (JPG or PNG) instead.'
                };
                // const fallbackResult = await this.extractViaOCRFallback(fileBuffer);
                // if (!fallbackResult.success || !fallbackResult.data) {
                //     return fallbackResult;
                // }

                // initialResult = fallbackResult;
            }

            if (!initialResult.success || !initialResult.data) {
                // Parser itself threw / couldn't open the file at all — this IS the corrupted_file case
                return {
                    success: false,
                    extractionStatus: 'FAILED',
                    failureReason: 'CORRUPTED_FILE',
                    error: initialResult.error
                };
            }

            return this.processExtraction(initialResult);
        } catch (error) {
            console.error('[ExtractionService] OCR fallback failed:', error);
            return {
                success: false,
                extractionStatus: 'FAILED',
                failureReason: 'CORRUPTED_FILE',
                error: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    private async processExtraction(extractionResult: ExtractionResult): Promise<ExtractionResult> {
        let validation = this.validateExtractedData(extractionResult.data!);

        console.log(validation, 'validation');

        // LLM fallback: only invoked if regex failed to nail GSTIN or amount specifically,

        if (!validation.gstnValid || !validation.totalValid) {

            const llmResult = await this.llmExtractionService.extractFields(extractionResult.rawText || '');


            if (llmResult) {

                const merged: ExtractedInvoiceData = {
                    ...extractionResult.data!,
                    gstin: validation.gstnValid ? extractionResult.data!.gstin : llmResult.gstin ?? extractionResult.data!.gstin,
                    totalAmount: validation.totalValid ? extractionResult.data!.totalAmount : llmResult.amount !== null ? llmResult.amount : extractionResult.data!.totalAmount,
                    invoiceDate: validation.dateValid ? extractionResult.data!.invoiceDate : llmResult.invoiceDate ?? extractionResult.data!.invoiceDate,
                    vendorName: validation.vendorValid ? extractionResult.data!.vendorName : llmResult.vendorName ?? extractionResult.data!.vendorName,
                    invoiceNumber: validation.invoiceNumberValid ? extractionResult.data!.invoiceNumber : llmResult.invoiceNumber ?? extractionResult.data!.invoiceNumber,
                };
                extractionResult.data = merged;
                validation = this.validateExtractedData(merged); 

            }
        }

        let extractionStatus: 'COMPLETE' | 'FAILED' | 'NEEDS_CORRECTION';

        let failureReason: string | null = null;

        let shouldSave = true;

        console.log('final validation results:', validation);


        if (validation.validFieldCount === 0) {
            extractionStatus = 'FAILED';
            failureReason = 'UNREADABLE_SCAN';
            shouldSave = false;
        } else if (!validation.gstnValid) {
            extractionStatus = 'FAILED';
            failureReason = 'MISSING_REQUIRED_FIELDS';
            shouldSave = false;
        } else if (!validation.totalValid) {
            extractionStatus = 'NEEDS_CORRECTION';
            shouldSave = true;
        } else {
            extractionStatus = 'COMPLETE';
            shouldSave = true;
        }

        if (!shouldSave) {
            return {
                success: false,
                extractionStatus,
                failureReason,
                error: `Extraction failed: ${failureReason}`
            };
        }

        const savedInvoice = await this.invoiceRepository.saveExtractedInvoice(
            extractionResult.data!,
            extractionStatus,
        );

        return {
            success: true,
            extractionStatus: 'COMPLETE',
            data: savedInvoice,
            confidence: extractionResult.confidence,
            validationResults: validation
        };
    }
}