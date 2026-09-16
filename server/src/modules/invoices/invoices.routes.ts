import express, { Router } from 'express';
import multer from 'multer';
import { ExtractionController, InvoicesController } from './invoices.controller';
import { ExtractionService } from './extraction.service';
import { InvoiceRepository } from './invoices.repository';
import { InvoiceService } from './invoices.service';
import { LLMExtractionService } from '../llm-module/llm.service';
import { requireAuth } from '../../shared/middleware/auth';

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
const invoicesCtrl = new InvoicesController(extractionSvc, new InvoiceService(invoiceRepository));

// Routes

router.post('/extraction', requireAuth, upload.single('file'), extractionCtrl.extractInvoiceData.bind(extractionCtrl));

router.get('/invoices', requireAuth, invoicesCtrl.fetchInvoices.bind(invoicesCtrl))
router.get('/:invoiceId', requireAuth, invoicesCtrl.fetchInvoiceById.bind(invoicesCtrl));

export default router;