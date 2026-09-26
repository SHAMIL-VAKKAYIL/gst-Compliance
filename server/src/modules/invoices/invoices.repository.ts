
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
          buyerGstin: invoiceData.buyerGstin,
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : null,
          vendorName: invoiceData.vendorName,
          amount: invoiceData.totalAmount,
          extractionStatus: extractionStatus,
          summaryStatus: 'PENDING',
          lineItems: {
            create: (invoiceData.lineItems ?? []).map((item) => ({
              description: item.description,
              hsnCode: item.hsnCode,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxableValue: item.taxableValue,
              taxRate: item.taxRate,
              igstAmount: item.igstAmount,
              cgstAmount: item.cgstAmount,
              sgstAmount: item.sgstAmount,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          lineItems: true, // return the created line items in the same response, useful for confirming immediately
        },
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
      return await prisma.invoice.findMany({ where: { userId: userId } })
    } catch (error) {
      throw new AppError(`Failed to retrieve invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);

    }
  }

  async fetchSummary(invoiceId: string) {
    try {
      return await prisma.invoice.findFirst({
        where: { id: invoiceId }, select: {
          summary: true,
          summaryStatus: true
        }
      })
    } catch (error) {
      throw new AppError(`Failed to retrieve summary: ${error instanceof Error ? error.message : 'Unknown error'}`);

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