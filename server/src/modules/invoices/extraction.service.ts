import { InvoiceRepository } from './invoices.repository';
import { PDFParser } from './pdf-parser/pdf-parser';
import { OCRParser } from './ocr-parser/ocr-parser';
import { ExtractionResult, ExtractedInvoiceData, LineItem } from './invoices.types';
import { FileTypeDetector } from '../../shared/utils/file-type-detector';
import { LLMService } from '../llm-module/llm.service';
import { toNumber } from '../../shared/utils/number';

interface ValidationResult {
    invoiceNumberValid: boolean;
    dateValid: boolean;
    vendorValid: boolean;
    gstnValid: boolean;
    buyerGstnValid: boolean;
    totalValid: boolean;
    validFieldCount: number;
}

const MINIMUM_MEANINGFUL_LENGTH = 50;

export class ExtractionService {
    private pdfParser: PDFParser;
    private ocrParser: OCRParser;

    constructor(
        private invoiceRepository: InvoiceRepository,
        private LLMService: LLMService
    ) {
        this.pdfParser = new PDFParser();
        this.ocrParser = new OCRParser();
    }
    calculateTotalTax(lineItems: LineItem[] | undefined): number {
        if (!lineItems || lineItems.length === 0) return 0;

        return lineItems.reduce((total, item) => {
            const igst = toNumber(item.igstAmount) ?? 0;
            const cgst = toNumber(item.cgstAmount) ?? 0;
            const sgst = toNumber(item.sgstAmount) ?? 0;
            return total + igst + cgst + sgst;
        }, 0);
    }

    async extractFromBuffer(fileBuffer: Buffer, fileName: string, userId: string): Promise<ExtractionResult> {
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
            const initialResult = await parser.extractFromBuffer(fileBuffer);

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

            if (!initialResult.success) {
                // Parser itself threw / couldn't open the file at all — this IS the corrupted_file case
                return {
                    success: false,
                    extractionStatus: 'FAILED',
                    failureReason: 'CORRUPTED_FILE',
                    error: initialResult.error
                };
            }

            return this.processExtraction(initialResult, userId);
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


    private validateExtractedData(data: ExtractedInvoiceData): ValidationResult {
        const validation: ValidationResult = {
            invoiceNumberValid: false,
            dateValid: false,
            vendorValid: false,
            gstnValid: false,
            buyerGstnValid: false,
            totalValid: false,
            validFieldCount: 0
        };


        if (data.invoiceNumber && data.invoiceNumber !== 'UNKNOWN' && data.invoiceNumber.trim().length >= 3) {
            validation.invoiceNumberValid = true;
        }

        if (data.invoiceDate) {
            const dateParts = data.invoiceDate.split('-');
            const year = Number(dateParts[0]);
            if (year >= 2015 && year <= new Date().getFullYear()) {
                validation.dateValid = true;
            }
        }

        if (data.vendorName && data.vendorName !== 'UNKNOWN' && data.vendorName.length >= 3) {
            validation.vendorValid = true;
        }

        console.log(data.gstin, 'o');

        if (data.gstin && data.gstin !== 'UNKNOWN') {
            console.log(data.gstin, 'i');

            validation.gstnValid = true;
        }
        if (data.buyerGstin && data.buyerGstin !== 'UNKNOWN') {
            validation.buyerGstnValid = true;
        }

        if (data.totalAmount && data.totalAmount > 0) {
            validation.totalValid = true;
        }

        validation.validFieldCount = Object.entries(validation)
            .filter(([key, value]) => key !== 'validFieldCount' && value === true)
            .length;

        return validation;
    }


    private async processExtraction(extractionResult: ExtractionResult, userId?: string): Promise<ExtractionResult> {
        const llmResult = await this.LLMService.extractAll(extractionResult.rawText || '');

        if (!llmResult) {
            return {
                success: false,
                extractionStatus: 'FAILED',
                failureReason: 'UNREADABLE_SCAN',
                error: 'Unable to extract invoice data from the document'
            };
        }
        console.log(llmResult, 'llm');

        const extractedData: ExtractedInvoiceData = {
            invoiceNumber: llmResult.invoiceNumber ?? 'UNKNOWN',
            vendorName: llmResult.vendorName ?? 'UNKNOWN',
            gstin: llmResult.gstin ?? 'UNKNOWN',
            buyerGstin: llmResult.buyerGstin,
            invoiceDate: llmResult.invoiceDate,
            invoiceAmount: llmResult.amount ?? 0,
            tax: this.calculateTotalTax(llmResult.lineItems),
            totalAmount: llmResult.amount ?? 0,
            lineItems: llmResult.lineItems
        };
        console.log(extractedData, 'extracted after llm');

        const validation = this.validateExtractedData(extractedData);
        extractionResult.data = extractedData;

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
        } else if (!validation.dateValid) {
            extractionStatus = 'FAILED';
            failureReason = 'MISSING_REQUIRED_FIELDS';
            shouldSave = false;
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
            userId ?? 'unknown-user',
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

