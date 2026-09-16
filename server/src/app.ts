import express from 'express';
import cors from 'cors';
import invoiceRouter from './modules/invoices/invoices.routes';
import authRouter from './modules/auth/auth.routes';
import validateRouter from './modules/validation/validation.routes'
import { AppError } from './shared/errors/app-error';

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

app.use('/api/auth/v1', authRouter);
app.use('/api/invoice/v1', invoiceRouter);
app.use('/api/validation/v1',validateRouter );

app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message, error: err.message });
    }

    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error', error: 'Internal Server Error' });
});

export default app;