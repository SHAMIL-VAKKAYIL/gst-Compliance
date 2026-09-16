
import { ExtractedInvoiceData } from './invoices.types';
import { prisma } from '../../prisma/client';
import { AppError } from '../../shared/errors/app-error';

export class InvoiceRepository {

  async saveExtractedInvoice(
    invoiceData: ExtractedInvoiceData,
    userId: string,
    extractionStatus: 'COMPLETE' | 'NEEDS_CORRECTION' | 'FAILED' = 'COMPLETE',
  ): Promise<any> {
    try {
      console.log(userId, '3432423');

      const invoice = await prisma.invoice.create({
        data: {
          userId,
          gstin: invoiceData.gstin,
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : null,
          vendorName: invoiceData.vendorName,
          amount: invoiceData.totalAmount,
          extractionStatus: extractionStatus,
          summaryStatus: 'PENDING',
        }
      });
      return {
        id: invoice.id,
        ...invoiceData,
        extractionStatus,
      };
    } catch (error) {
      throw new AppError(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ! Retrieve invoice by ID

  async getInvoiceById(invoiceId: string, userId: string): Promise<any> {
    try {
      return await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          userId,
        },
        include: {
          lineItems: true,
          validationResults: {
            orderBy: { runAt: 'desc' },
          },
        },
      });
    } catch (error) {
      throw new AppError(`Failed to retrieve invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInvoices(userId: string) {
    try {
      return await prisma.invoice.findMany({where :{userId:userId}})
    } catch (error) {
      throw new AppError(`Failed to retrieve invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);

    }
  }


  async updateInvoice(invoiceId: string, updateData: Partial<ExtractedInvoiceData>): Promise<any> {
    // update only for amount
    try {
      console.log(`Updating invoice ${invoiceId}:`, updateData);
      return { id: invoiceId, ...updateData };
    } catch (error) {
      throw new AppError(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}