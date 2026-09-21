import { AppError } from "../../shared/errors/app-error";
import { InvoiceRepository } from "./invoices.repository";



export class InvoiceService {
    constructor(
        private invoiceRepository: InvoiceRepository,
    ) { }

    async fetchInvoiceById(invoiceId: string, userId: string) {
        try {
            return await this.invoiceRepository.getInvoiceById(invoiceId, userId);
        } catch (error) {
            console.log(error);

            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Failed to retrieve invoice');
        }
    }
    async fetchInvoices(userId: string) {
        try {
            return await this.invoiceRepository.getInvoices(userId);
        } catch (error) {
            throw new AppError('Failed to retrieve invoice');
        }
    }
    async fetchSummary(invoiceId:string) {
        try {
                return await this.invoiceRepository.fetchSummary(invoiceId)
        } catch (error) {
            throw new AppError('Failed to retrieve summary');
            
        }
    }
}