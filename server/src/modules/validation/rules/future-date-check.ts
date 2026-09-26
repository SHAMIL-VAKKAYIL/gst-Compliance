import { Rule, RuleResult, InvoiceForValidation } from '../validation.types';

function isDateValid(date: any): boolean {
    const parsedDate = date instanceof Date ? date : new Date(date);

    if (isNaN(parsedDate.getTime())) return false;

    const today = new Date();
    const todayUTCEndOfDay = Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
        23, 59, 59, 999
    );

    return parsedDate.getTime() <= todayUTCEndOfDay;
}

export const validateFutureDate: Rule = {
    code: "future_date_check",
    evaluate(invoice: InvoiceForValidation): RuleResult {
        const passed = isDateValid(invoice.invoiceDate);
        return {
            ruleCode: this.code,
            passed,
            severity: 'ERROR',
            message: passed
                ? 'date is valid'
                : `Invoice date ${invoice.invoiceDate} is in the future`
        };
    }
}