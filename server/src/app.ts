import express from 'express';
import invoiceRouter from './modules/invoices/invoices.routes';

const app = express();

app.use(express.json());

app.use('/api/invoice/v1', invoiceRouter);


app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

export default app;