import { Buffer } from 'node:buffer';
import { ExtractionResult } from '../invoices.types';
import { PDFParse } from 'pdf-parse';

export class PDFParser {
  /**
   * Extract invoice data from PDF buffer (uploaded file)
   * @param fileBuffer - PDF file buffer from upload
   * @returns Extracted invoice data
   */
  async extractFromBuffer(fileBuffer: Buffer): Promise<ExtractionResult> {
    try {
      if (!fileBuffer || fileBuffer.length === 0) {
        return {
          success: false,
          error: 'Empty PDF file buffer'
        };
      }

      console.log(`[PDFParser] Processing PDF buffer (${fileBuffer.length} bytes)`);

      const rawText = await this.extractPDFText(fileBuffer);

      console.log(rawText,'sdfsgdsgdg');
      return {
        success: true,
        rawText: rawText,
        confidence: 0.95 // PDF extraction usually has high confidence
      };
    } catch (error) {
      return {
        success: false,
        error: `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract raw text from PDF buffer
   * Implemented using pdf-parse library
   */
  private async extractPDFText(fileBuffer: Buffer): Promise<string> {
    try {
      console.log('[PDFParser] Extracting text from PDF buffer...');

      // Using pdf-parse library with class-based API
      const parser = new PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      await parser.destroy();

      // Extract text from all pages
      return result.text;
    } catch (error) {
      // Fallback to sample text if parsing fails
      console.warn('PDF parsing failed, using sample data:', error instanceof Error ? error.message : 'Unknown error');


      return ``;
    }
  }

}
