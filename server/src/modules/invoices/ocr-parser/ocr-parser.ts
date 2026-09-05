import { ExtractionResult, ExtractedInvoiceData } from '../invoices.types';
import { parseInvoiceText } from '../../../shared/utils/invoice-parser.utils';
import Tesseract from 'tesseract.js';

export class OCRParser {
  /**
   * Extract invoice data from image buffer (uploaded file)
   * @param fileBuffer - Image file buffer from upload
   * @returns Extracted invoice data
   */
  async extractFromBuffer(fileBuffer: Buffer): Promise<ExtractionResult> {
    return this.extractFromBuffers([fileBuffer]);
  }

  async extractFromBuffers(fileBuffers: Buffer[]): Promise<ExtractionResult> {
    try {
      if (fileBuffers.length === 0 || fileBuffers.some((fileBuffer) => !fileBuffer?.length)) {
        return {
          success: false,
          error: 'Empty image file buffer'
        };
      }

      const extractedPages = await Promise.all(
        fileBuffers.map((fileBuffer) => this.extractTextFromImage(fileBuffer))
      );
      const extractedText = extractedPages.join('\n');
      console.log(extractedText,'sdfsgdsgdg');
      

      console.log(`[OCRParser] Processed ${fileBuffers.length} image(s)`);

      const invoiceData = this.parseOCRText(extractedText);

      return {
        success: true,
        rawText: extractedText,
        data: invoiceData,
        confidence: 0.85 // OCR typically has lower confidence than PDF extraction
      };
    } catch (error) {
      return {
        success: false,
        error: `Image parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract text from image buffer using OCR
   * Implemented using tesseract.js library
   */
  private async extractTextFromImage(fileBuffer: Buffer): Promise<string> {
    try {
      console.log('[OCRParser] Extracting text from image buffer via OCR...');

      // Using tesseract.js library
      const { data: { text } } = await Tesseract.recognize(
        fileBuffer,
        'eng', // English language
        { logger: (m: any) => console.log('[Tesseract]', m) }
      );

      console.log(`[OCRParser] Extracted text length: ${text.length}`,text);

      return text;
    } catch (error) {
      // Fallback to sample text if OCR fails
      console.warn('OCR parsing failed, using sample data:', error instanceof Error ? error.message : 'Unknown error');
      return ``;
    }
  }

  /**
   * Parse OCR extracted text to structured invoice data
   * Handles variations in OCR output formatting
   */
  private parseOCRText(text: string): ExtractedInvoiceData {
    return parseInvoiceText(text, {
      invoiceNumber: /invoice\s*(?:number|#|num)?\s*[:\s]*([A-Z0-9\-]+)/i,
      date: /date\s*[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
      vendor: /(?:bill\s*from|vendor|company)\s*[:\s]*([^\n]+)/i,
      gstin: /gstin\s*[:\s]+([0-9A-Z]+)/i,
      total: /total\s*[:\s]*(?:rs\.?|₹)?\s*([\d,\.]+)/i,
      tax: /(?:tax|gst)\s*(?:\d+%)?\s*[:\s]*(?:rs\.?|₹)?\s*([\d,\.]+)/i
    });
  }
}
