import { InvoiceRepository } from './invoices.repository';
import { PDFParser } from './pdf-parser/pdf-parser';
import { OCRParser } from './ocr-parser/ocr-parser';
import { ExtractionResult, ExtractedInvoiceData } from './invoices.types';
import { FileTypeDetector } from '../../shared/utils/file-type-detector';

interface ValidationResult {
  invoiceNumberValid: boolean;
  dateValid: boolean;
  vendorValid: boolean;
  gstnValid: boolean;
  totalValid: boolean;
  validFieldCount: number;
}

export class ExtractionService {
    private pdfParser: PDFParser;
    private ocrParser: OCRParser;

    constructor(private invoiceRepository: InvoiceRepository) {
        this.pdfParser = new PDFParser();
        this.ocrParser = new OCRParser();
    }

    /**
     * Validate extracted invoice data fields
     * Returns which fields are valid based on format validation
     */
    private validateExtractedData(data: ExtractedInvoiceData): ValidationResult {
      const validation: ValidationResult = {
        invoiceNumberValid: false,
        dateValid: false,
        vendorValid: false,
        gstnValid: false,
        totalValid: false,
        validFieldCount: 0
      };

      // Validate invoice number (not UNKNOWN and alphanumeric)
      if (data.invoiceNumber && data.invoiceNumber !== 'UNKNOWN' && /^[A-Z0-9\-]{3,}$/i.test(data.invoiceNumber)) {
        validation.invoiceNumberValid = true;
      }

      // Validate date (YYYY-MM-DD format and reasonable year)
      if (data.invoiceDate && /^\d{4}-\d{2}-\d{2}$/.test(data.invoiceDate)) {
        const year = parseInt(data.invoiceDate.split('-')[0]);
        if (year >= 2015 && year <= new Date().getFullYear()) {
          validation.dateValid = true;
        }
      }

      // Validate vendor name (not UNKNOWN and at least 3 chars)
      if (data.vendorName && data.vendorName !== 'UNKNOWN' && data.vendorName.length >= 3) {
        validation.vendorValid = true;
      }

      // Validate GSTIN (format: 2 digits + 5 letters + alphanumeric sequence)
      if (data.vendorGSTIN && data.vendorGSTIN !== 'UNKNOWN' && /^[0-9]{2}[A-Z]{5}[0-9A-Z]{9,10}$/i.test(data.vendorGSTIN)) {
        validation.gstnValid = true;
      }

      // Validate total amount (positive number)
      if (data.totalAmount && data.totalAmount > 0) {
        validation.totalValid = true;
      }

      // Count valid fields (GSTIN is critical, others contribute)
      validation.validFieldCount = Object.entries(validation)
        .filter(([key, value]) => key !== 'validFieldCount' && value === true)
        .length;

      return validation;
    }

    /**
     * Extract invoice data from uploaded file buffer
     * Auto-detects file type from filename
     * @param fileBuffer - File buffer from upload
     * @param fileName - Original filename
     * @returns Extraction result with saved invoice data
     */
    async extractFromBuffer(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult> {
        try {
            // Auto-detect file type from filename
            const fileType = FileTypeDetector.detectFileType(fileName);

            if (fileType === 'unknown') {
                return {
                    success: false,
                    error: `Unsupported file type. Supported formats: PDF, JPG, PNG, GIF, BMP, WEBP, TIFF`
                };
            }

            // Extract based on detected type
            if (fileType === 'pdf') {
                return this.extractPDFFromBuffer(fileBuffer, fileName);
            } else {
                return this.extractImageFromBuffer(fileBuffer, fileName);
            }
        } catch (error) {
            return {
                success: false,
                error: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Extract invoice data from PDF buffer and save to database
     * @param fileBuffer - PDF file buffer
     * @param fileName - Original filename
     * @returns Extraction result with saved invoice data
     */
    private async extractPDFFromBuffer(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult> {
        try {
            // Step 1: Parse PDF buffer
            const extractionResult = await this.pdfParser.extractFromBuffer(fileBuffer);
            
            if (!extractionResult.success || !extractionResult.data) {
                return extractionResult;
            }

            // Step 2: Validate extracted data
            const validation = this.validateExtractedData(extractionResult.data);
            
            // Step 3: Determine extraction status and failure reason
            let extractionStatus = 'COMPLETE';
            let failureReason = null;

            if (validation.validFieldCount === 0) {
                // Zero valid fields → unreadable/corrupted
                extractionStatus = 'FAILED';
                failureReason = 'CORRUPTED_FILE';
            } else if (!validation.gstnValid && validation.validFieldCount < 3) {
                // GSTIN missing or invalid AND other fields also missing
                extractionStatus = 'FAILED';
                failureReason = 'MISSING_REQUIRED_FIELDS';
            } else if (validation.gstnValid && validation.validFieldCount < 3) {
                // GSTIN present but other critical fields missing
                extractionStatus = 'NEEDS_CORRECTION';
                failureReason = 'MISSING_REQUIRED_FIELDS';
            }

            // Step 4: Save to database with status and failure reason
            const savedInvoice = await this.invoiceRepository.saveExtractedInvoice(
                extractionResult.data,
                extractionStatus,
                failureReason
            );
            
            return {
                success: extractionStatus === 'COMPLETE' ? true : false,
                data: savedInvoice,
                confidence: extractionResult.confidence,
                validationResults: validation
            };
        } catch (error) {
            return {
                success: false,
                error: `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Extract invoice data from image buffer and save to database
     * @param fileBuffer - Image file buffer
     * @param fileName - Original filename
     * @returns Extraction result with saved invoice data
     */
    private async extractImageFromBuffer(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult> {
        try {
            // Step 1: Parse image using OCR
            const extractionResult = await this.ocrParser.extractFromBuffer(fileBuffer);
            
            if (!extractionResult.success || !extractionResult.data) {
                return extractionResult;
            }

            // Step 2: Validate extracted data
            const validation = this.validateExtractedData(extractionResult.data);
            
            // Step 3: Determine extraction status and failure reason
            let extractionStatus = 'COMPLETE';
            let failureReason = null;

            if (validation.validFieldCount === 0) {
                // Zero valid fields → unreadable scan
                extractionStatus = 'FAILED';
                failureReason = 'UNREADABLE_SCAN';
            } else if (!validation.gstnValid && validation.validFieldCount < 3) {
                // GSTIN missing or invalid AND other fields also missing
                extractionStatus = 'FAILED';
                failureReason = 'MISSING_REQUIRED_FIELDS';
            } else if (validation.gstnValid && validation.validFieldCount < 3) {
                // GSTIN present but other critical fields missing
                extractionStatus = 'NEEDS_CORRECTION';
                failureReason = 'MISSING_REQUIRED_FIELDS';
            }

            // Step 4: Save to database with status and failure reason


            const savedInvoice = await this.invoiceRepository.saveExtractedInvoice(
                extractionResult.data,
                extractionStatus,
                failureReason
            );
            
            return {
                success: extractionStatus === 'COMPLETE' ? true : false,
                data: savedInvoice,
                confidence: extractionResult.confidence,
                validationResults: validation
            };
        } catch (error) {
            return {
                success: false,
                error: `Image extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}
