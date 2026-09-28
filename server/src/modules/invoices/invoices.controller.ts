import { ExtractionService } from "./extraction.service";
import { InvoiceService } from "./invoices.service";
import { ExtractionResult } from './invoices.types';

export class InvoicesController {
    // General invoice operations
    constructor(
        private extractionService: ExtractionService,
        private invoiceService: InvoiceService
    ) { }

    async fetchInvoiceById(req: any, res: any, next: any) {
        try {
            const invoiceId = req.params.invoiceId;
            const userId = req.user?.userId;


            if (!userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            const invoice = await this.invoiceService.fetchInvoiceById(invoiceId, userId);

            if (!invoice) {
                return res.status(404).json({ success: false, error: 'Invoice not found' });
            }
            return res.status(200).json({ success: true, data: invoice });
        } catch (error) {
            next(error); // Pass the error to the next middleware (error handler)
        }
    }
    async fetchInvoices(req: any, res: any, next: any) {
        try {
            const userId = req.user?.userId
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }
            const invoice = await this.invoiceService.fetchInvoices(userId);

            return res.status(200).json({ success: true, data: invoice });

        } catch (error) {
            next(error)
        }

    }

    async fetchSummaryById(req: any, res: any, next: any) {
        const userId = req.user?.userId
        const invoiceId = req.params.invoiceId;
        try {
            if (!userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }
            const summary = await this.invoiceService.fetchSummary(invoiceId, userId);

            return res.status(200).json(summary);

        } catch (error) {
            next(error)

        }
    }
}

export class ExtractionController {
    constructor(
        private extractionService: ExtractionService
    ) { }

    /**
     * Extract invoice data from uploaded file
     * POST /api/invoices/extraction
     * Content-Type: multipart/form-data
     * Body: { file: File }
     */
    async extractInvoiceData(req: any, res: any, next: any) {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            // Check if file is uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const file = req.file;
            const fileName = file.originalname;
            const fileBuffer = file.buffer;

            // Call service to extract data from buffer
            const result: ExtractionResult = await this.extractionService.extractFromBuffer(
                fileBuffer,
                fileName,
                req.user.userId
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            next(error); // Pass the error to the next middleware (error handler)
        }
    }
}