import { ExtractionResult, ExtractedInvoiceData, LineItem } from '../invoices.types';
import Tesseract from 'tesseract.js';

export class OCRParser {
  /**
   * Extract invoice data from image buffer (uploaded file)
   * @param fileBuffer - Image file buffer from upload
   * @returns Extracted invoice data
   */
  async extractFromBuffer(fileBuffer: Buffer): Promise<ExtractionResult> {
    try {
      if (!fileBuffer || fileBuffer.length === 0) {
        return {
          success: false,
          error: 'Empty image file buffer'
        };
      }

      console.log(`[OCRParser] Processing image buffer (${fileBuffer.length} bytes)`);

      // Extract text from image buffer using OCR
      const extractedText = await this.extractTextFromImage(fileBuffer);

      console.log(extractedText);


      // Parse extracted text to invoice data
      const invoiceData = this.parseOCRText(extractedText);

      return {
        success: true,
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
    // Helper regex patterns (more flexible for OCR variations)
    const invoiceNumberPattern = /invoice\s*(?:number|#|num)?\s*[:\s]*([A-Z0-9\-]+)/i;
    const datePattern = /date\s*[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i;
    const vendorPattern = /(?:bill\s*from|vendor|company)\s*[:\s]*([^\n]+)/i;
    
    // Improved GSTIN pattern: captures 15-16 chars with relaxed format for OCR noise
    // Standard GSTIN: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
    // But allows variations due to OCR: 2 digits + 5 letters + 4-5 digits + letters/numbers
    // const gstnPattern = /gstin?\s*[:\s]+([0-9]{2}[A-Z]{5}[0-9A-Z]{9,10})/i;
    const gstnPattern = /gstin\s*[:\s]+([0-9A-Z]+)/i;

    const totalPattern = /total\s*[:\s]*(?:rs\.?|₹)?\s*([\d,\.]+)/i;
    const taxPattern = /(?:tax|gst)\s*(?:\d+%)?\s*[:\s]*(?:rs\.?|₹)?\s*([\d,\.]+)/i;

    // Extract values using regex
    const invoiceNumberMatch = text.match(invoiceNumberPattern);
    const dateMatch = text.match(datePattern);
    const vendorMatch = text.match(vendorPattern);
    const gstnMatch = text.match(gstnPattern);
    const totalMatch = text.match(totalPattern);
    const taxMatch = text.match(taxPattern);

    // Parse line items
    const lineItems = this.parseLineItemsFromOCR(text);

    // Calculate subtotal
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

    // Format date to YYYY-MM-DD
    let invoiceDate = new Date().toISOString().split('T')[0];
    if (dateMatch) {
      const dateStr = dateMatch[1];
      invoiceDate = this.formatDate(dateStr);
    }

    return {
      invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1].trim() : 'UNKNOWN',
      vendorName: vendorMatch ? vendorMatch[1].trim() : 'UNKNOWN',
      vendorGSTIN: gstnMatch ? gstnMatch[1].trim() : 'UNKNOWN',
      invoiceDate: invoiceDate,
      invoiceAmount: subtotal,
      tax: taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0,
      totalAmount: totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : subtotal,
      lineItems: lineItems,
      description: `Extracted from image via OCR on ${new Date().toISOString()}`
    };
  }

  /**
   * Parse line items from OCR text (more flexible for variations)
   */
  private parseLineItemsFromOCR(text: string): LineItem[] {
    const lineItems: LineItem[] = [];

    // Pattern for various item formats:
    // Product Name    Qty    Price    Amount
    // or
    // 1. Product Name - Qty: X @ Price = Amount
    const itemPatterns = [
      // Format: Product    Qty    Price    Amount
      /([A-Za-z\s]+?)\s+(\d+)\s+([\d\.]+)\s+([\d,\.]+)/g,
      // Format: N. Product - Qty: X @ Price = Amount
      /\d+\.\s*([^\-]+)\s*-\s*qty\s*[:\s]*(\d+)\s*@\s*\$?([\d\.]+)\s*=\s*\$?([\d,\.]+)/gi
    ];

    for (const pattern of itemPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[2] && match[3] && match[4]) {
          lineItems.push({
            description: match[1].trim(),
            quantity: parseInt(match[2]),
            unitPrice: parseFloat(match[3]),
            amount: parseFloat(match[4].replace(/,/g, '')),
            taxRate: 0
          });
        }
      }
    }

    return lineItems;
  }

  /**
   * Convert various date formats to YYYY-MM-DD
   */
  private formatDate(dateStr: string): string {
    try {
      // Handle DD/MM/YYYY or DD-MM-YYYY
      const dmy = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/.exec(dateStr);
      if (dmy) {
        const day = dmy[1].padStart(2, '0');
        const month = dmy[2].padStart(2, '0');
        const year = dmy[3];
        return `${year}-${month}-${day}`;
      }

      // Handle YYYY-MM-DD or YYYY/MM/DD (already correct or close)
      const ymd = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/.exec(dateStr);
      if (ymd) {
        const year = ymd[1];
        const month = ymd[2].padStart(2, '0');
        const day = ymd[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      return new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }
}
