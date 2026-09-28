
import { ExtractedInvoiceData } from './invoices.types';
import { prisma } from '../../prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { logger } from '../../shared/utils/logger';

export class InvoiceRepository {

  async saveExtractedInvoice(
    invoiceData: ExtractedInvoiceData,
    userId: string,
    extractionStatus: 'COMPLETE' | 'NEEDS_CORRECTION' | 'FAILED' = 'COMPLETE',
  ): Promise<any> {
    try {


      const invoice = await prisma.invoice.create({
        data: {
          userId,
          gstin: invoiceData.gstin,
          buyerGstin: invoiceData.buyerGstin,
          tax: invoiceData.tax,
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
      logger.error({ err: error }, 'Failed to save invoice')
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
      logger.error({ err: error }, 'Failed to retrieve invoice')

      throw new AppError(`Failed to retrieve invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInvoices(userId: string) {
    try {
      return await prisma.invoice.findMany({ where: { userId: userId } })
    } catch (error) {
      logger.error({ err: error }, 'Failed to retrieve invoice')
      throw new AppError(`Failed to retrieve invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);

    }
  }

  async fetchSummary(invoiceId: string, userId: string) {
    try {
      return await prisma.invoice.findFirst({
        where: { id: invoiceId, userId },
        select: { summary: true, summaryStatus: true },
      });
    } catch (error) {
      logger.error({ err: error, invoiceId }, 'Failed to retrieve summary');
      throw new AppError('Failed to retrieve summary');
    }
  }


}