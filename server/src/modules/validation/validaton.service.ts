import { gstinFormatRule } from './rules/gstin-format.rule';
import { gstinChecksumRule } from './rules/gstin-checksum.rule';
import { Rule, RuleResult, InvoiceForValidation } from './validation.types';
import { ValidationRepository } from './validation.repository';

export class ValidationService {
  constructor(private validationRepository: ValidationRepository) {}

  async runRules(invoice: InvoiceForValidation, invoiceId: string): Promise<RuleResult[]> {
    const runAt = new Date();
    const results: RuleResult[] = [];

    const formatResult = gstinFormatRule.evaluate(invoice);
    results.push(formatResult);

    // Only run checksum if format already passed — checksum math is meaningless
    // on a string that's already the wrong shape
    if (formatResult.passed) {
      results.push(gstinChecksumRule.evaluate(invoice));
    }

    await this.validationRepository.saveResults(invoiceId, runAt, results);
    return results;
  }
}