import { Buffer } from 'node:buffer';
import { ExtractionResult, ExtractedInvoiceData, LineItem } from '../invoices.types';
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

      // Extract text from PDF buffer
      const rawText = await this.extractPDFText(fileBuffer);
      // console.log('text -invoice', rawText);

      // Parse extracted text to invoice data
      const invoiceData = this.parsePDFText(rawText);
      // console.log('pattern -invoice', invoiceData);

      return {
        success: true,
        data: invoiceData,
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

  /**
   * Parse extracted PDF text to structured invoice data
   */
  private parsePDFText(text: string): ExtractedInvoiceData {
    // Helper regex patterns
    const invoiceNumberPattern = /invoice\s*#?\s*([A-Z0-9\-]+)/i;
    // const datePattern = /date\s*[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i;
    const datePattern = /date\s*[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;
    const vendorPattern = /vendor\s*[:\s]+([^\n]+)/i;
    // const gstnPattern = /gstin\s*[:\s]+([0-9A-Z]+)/i;
    const gstnPattern = /gstin?\s*[:\s]+([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i;
    // const totalPattern = /total\s*[:\s]*\$?([\d,\.]+)/i;
    const totalPattern = /total[^\n]*?([\d,]+\.\d{2})\s*$/im;
    const taxPattern = /tax\s*[:\s]*\$?([\d,\.]+)/i;

    // Extract values using regex
    const invoiceNumberMatch = text.match(invoiceNumberPattern);
    const dateMatch = text.match(datePattern);
    const vendorMatch = text.match(vendorPattern);
    const gstnMatch = text.match(gstnPattern);
    const totalMatch = text.match(totalPattern);
    const taxMatch = text.match(taxPattern);

    // Parse line items (basic implementation)
    const lineItems = this.parseLineItems(text);

    // Calculate subtotal
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1].trim() : 'UNKNOWN',
      vendorName: vendorMatch ? vendorMatch[1].trim() : 'UNKNOWN',
      vendorGSTIN: gstnMatch ? gstnMatch[1].trim() : 'UNKNOWN',
      invoiceDate: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0],
      invoiceAmount: subtotal,
      tax: taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0,
      totalAmount: totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : subtotal,
      lineItems: lineItems,
      description: `Extracted from PDF on ${new Date().toISOString()}`
    };
  }

  /**
   * Parse line items from invoice text
   */
  private parseLineItems(text: string): LineItem[] {
    const lineItems: LineItem[] = [];

    // Basic pattern: number. product - qty: X @ price = amount
    const itemPattern = /\d+\.\s*([^\-]+)\s*-\s*qty\s*[:\s]*(\d+)\s*@\s*\$?([\d\.]+)\s*=\s*\$?([\d\.]+)/gi;

    let match;
    while ((match = itemPattern.exec(text)) !== null) {
      lineItems.push({
        description: match[1].trim(),
        quantity: parseInt(match[2]),
        unitPrice: parseFloat(match[3]),
        amount: parseFloat(match[4]),
        taxRate: 0
      });
    }

    return lineItems;
  }
}
