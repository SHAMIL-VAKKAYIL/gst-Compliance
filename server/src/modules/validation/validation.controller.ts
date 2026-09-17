import { NextFunction, Request, Response } from "express";
import { ValidationService } from "./validaton.service";

export class ValidationController {

    constructor(private validationService: ValidationService) { }

    async validateInvoice(req: Request, res: Response, next: NextFunction): Promise<any> {

        const invoiceId = Array.isArray(req.params.invoiceId)
            ? req.params.invoiceId[0]
            : req.params.invoiceId;

        const invoice = req.body;

        try {
            const results = await this.validationService.runRules(invoice, invoiceId);

            res.status(200).json({
                invoiceId: invoiceId,
                validationResults: results
            });
        } catch (error) {

            console.error('Error during invoice validation:', error);
            next(error);
        }
    }

    async getReviewById(req: Request, res: Response, next: NextFunction): Promise<any> {
        const invoiceId = Array.isArray(req.params.invoiceId)
            ? req.params.invoiceId[0]
            : req.params.invoiceId;

        try {

            const result = await this.validationService.getReviewById(invoiceId);

            res.status(200).json({data:result})
        } catch (error) {
            console.error('Error during invoice validation:', error);
            next(error);
        }
    }
}