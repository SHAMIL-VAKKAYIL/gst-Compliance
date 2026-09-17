import { Rule, RuleResult, InvoiceForValidation } from '../validation.types';

const TOLERANCE = 1.00;

export const perLineTaxCalculationRule: Rule = {
  code: 'per_line_tax_calculation_correct',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    const errors: string[] = [];

    for (const item of invoice.lineItems ?? []) {
        console.log(item);
        
      if (item.taxableValue == null || item.taxRate == null) continue; // can't check, skip

      const expectedTax = (Number(item.taxableValue) * Number(item.taxRate)) / 100;
      const actualTax =
        Number(item.igstAmount ?? 0) + Number(item.cgstAmount ?? 0) + Number(item.sgstAmount ?? 0);
      const diff = Math.abs(expectedTax - actualTax);

      if (diff > TOLERANCE) {
        errors.push(
          `"${item.description ?? 'unnamed item'}": expected tax ~${expectedTax.toFixed(2)}, found ${actualTax.toFixed(2)}`
        );
      }
    }

    const passed = errors.length === 0;
    return {
      ruleCode: this.code,
      passed,
      severity: 'ERROR',
      message: passed ? 'All line-item tax calculations correct' : errors.join('; ')
    };
  }
};