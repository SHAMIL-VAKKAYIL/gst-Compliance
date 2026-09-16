import express from 'express';
import { ValidationController } from './validation.controller';
import { ValidationService } from './validaton.service';
import { ValidationRepository } from './validation.repository';



const router = express.Router();

const validationRepo = new ValidationRepository();
const validationSvc = new ValidationService(validationRepo);
const validatationCtrl = new ValidationController(validationSvc);


router.post('/validate/:invoiceId', validatationCtrl.validateInvoice.bind(validatationCtrl));


// POST /api/invoice/v1/validate/:id


export default router;
