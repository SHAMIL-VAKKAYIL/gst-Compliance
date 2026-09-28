import express from 'express';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validaton.service';
import { ValidationRepository } from './validation.repository';
import { LLMService } from '../llm-module/llm.service';
import { InvoiceService } from '../invoices/invoices.service';
import { InvoiceRepository } from '../invoices/invoices.repository'; // import this too
import { requireAuth } from '../../shared/middleware/auth';



const router = express.Router();

const llmSvc = new LLMService()
const invoiceRepo = new InvoiceRepository();

const invoiceSvc = new InvoiceService(invoiceRepo)
const validationRepo = new ValidationRepository();
const validationSvc = new ValidationService(validationRepo, llmSvc);
const validatationCtrl = new ValidationController(validationSvc, invoiceSvc);


router.post('/validate/:invoiceId', requireAuth, validatationCtrl.validateInvoice.bind(validatationCtrl));

// router.get('/review/:invoiceId', requireAuth, validatationCtrl.getReviewById.bind(validatationCtrl))


export default router;
