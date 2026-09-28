import { NextFunction, Request, Response } from "express";
import { ValidationService } from "./validaton.service";
import { InvoiceService } from "../invoices/invoices.service";
import { logger } from "../../shared/utils/logger";

export class ValidationController {

    constructor(private validationService: ValidationService,
        private invoiceService: InvoiceService) { }

    async validateInvoice(req: any, res: Response, next: NextFunction): Promise<any> {

        const invoiceId = Array.isArray(req.params.invoiceId)
            ? req.params.invoiceId[0]
            : req.params.invoiceId;

        const userId = req.user

        try {
            const invoice = await this.invoiceService.fetchInvoiceById(invoiceId, userId); // fetch via invoice module
            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            }
            const results = await this.validationService.runRules(invoice, invoiceId);

            res.status(200).json({
                invoiceId: invoiceId,
                validationResults: results
            });
            await this.validationService.generateAndSummary(invoiceId, invoice, results)
        } catch (error) {

            logger.error({err:error},'Error during invoice validation:');
            next(error);
        }
    }

    // async getReviewById(req: Request, res: Response, next: NextFunction): Promise<any> {
    //     const invoiceId = Array.isArray(req.params.invoiceId)
    //         ? req.params.invoiceId[0]
    //         : req.params.invoiceId;

    //     try {

    //         const result = await this.validationService.getReviewById(invoiceId);

    //         res.status(200).json({ data: result })
    //     } catch (error) {
    //         console.error('Error during invoice validation:', error);
    //         next(error);
    //     }
    // }
}