import express, { Router } from 'express';
import multer from 'multer';
import { ExtractionController } from './invoices.controller';
import { ExtractionService } from './extraction.service';
import { InvoiceRepository } from './invoices.repository';
import { LLMExtractionService } from '../llm-module/llm.service';

const router: Router = express.Router();


const upload = multer({
  
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF and image files
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/tiff'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      console.log('fefe');

      cb(null, true);
    } else {
      console.log('fefesdaa');

      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Initialize dependencies
const invoiceRepository = new InvoiceRepository();
const llmExtractionService = new LLMExtractionService();
const extractionSvc = new ExtractionService(invoiceRepository, llmExtractionService);
const extractionCtrl = new ExtractionController(extractionSvc);

// Routes
// POST /api/invoices/extraction - Extract data from uploaded file

router.post('/extraction', upload.single('file'), extractionCtrl.extractInvoiceData.bind(extractionCtrl));

export default router;