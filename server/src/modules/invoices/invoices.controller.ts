import { ExtractionService } from "./extraction.service";
import { ExtractionResult } from './invoices.types';

export class InvoicesController {
    // General invoice operations
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
    async extractInvoiceData(req: any, res: any) {
        try {
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
                fileName
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
}