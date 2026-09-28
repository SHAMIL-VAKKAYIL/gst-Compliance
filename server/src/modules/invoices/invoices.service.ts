import { AppError } from "../../shared/errors/app-error";
import { logger } from "../../shared/utils/logger";
import { InvoiceRepository } from "./invoices.repository";



export class InvoiceService {
    constructor(
        private invoiceRepository: InvoiceRepository,
    ) { }

    async fetchInvoiceById(invoiceId: string, userId: string) {
        try {
            return await this.invoiceRepository.getInvoiceById(invoiceId, userId);
        } catch (error) {
            logger.error({ err: error }, 'Failed to retrieve invoice');
            throw new AppError('Failed to retrieve invoice');
        }
    }
    async fetchInvoices(userId: string) {
        try {
            return await this.invoiceRepository.getInvoices(userId);
        } catch (error) {
            logger.error({ err: error }, 'Failed to retrieve invoices');

            throw new AppError('Failed to retrieve invoice');
        }
    }
    async fetchSummary(invoiceId: string, userId: string) {
        try {
            return await this.invoiceRepository.fetchSummary(invoiceId, userId)
        } catch (error) {
            logger.error({err:error},'Failed to retrieve summary');
            
            throw new AppError('Failed to retrieve summary');

        }
    }
}