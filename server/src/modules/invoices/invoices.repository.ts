
import { ExtractedInvoiceData } from './invoices.types';
import { prisma } from '../../prisma/client';

export class InvoiceRepository {

  async saveExtractedInvoice(
    invoiceData: ExtractedInvoiceData,
    extractionStatus: 'COMPLETE' | 'NEEDS_CORRECTION' | 'FAILED' = 'COMPLETE',
  ): Promise<any> {
    try {

      const invoice = await prisma.invoice.create({
        data: {
          userId: 'user-id-placeholder', // Replace with actual user ID if available
          gstin: invoiceData.gstin,
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceDate: new Date(invoiceData.invoiceDate || ''),
          vendorName: invoiceData.vendorName,
          amount: invoiceData.totalAmount,
          extractionStatus: extractionStatus,
          summaryStatus: 'PENDING',
        }
      });
      return {
        id: 'generated-id',
        ...invoiceData,
        extractionStatus,
      };
    } catch (error) {
      throw new Error(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve invoice by ID
   * @param invoiceId - Invoice ID
   * @returns Invoice data
   */
  async getInvoiceById(invoiceId: string): Promise<any> {
    try {

      console.log(`Fetching invoice with ID: ${invoiceId}`);
      return null;
    } catch (error) {
      throw new Error(`Failed to retrieve invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  async updateInvoice(invoiceId: string, updateData: Partial<ExtractedInvoiceData>): Promise<any> {
    // update only for amount
    try {
      console.log(`Updating invoice ${invoiceId}:`, updateData);
      return { id: invoiceId, ...updateData };
    } catch (error) {
      throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}