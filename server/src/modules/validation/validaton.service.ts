import { gstinFormatRule } from './rules/gstin-format.rule';
import { gstinChecksumRule } from './rules/gstin-checksum.rule';
import { Rule, RuleResult, InvoiceForValidation, SummaryResult } from './validation.types';
import { ValidationRepository } from './validation.repository';
import { lineItemsSumRule } from './rules/line-items-sum.rule';
import { perLineTaxCalculationRule } from './rules/per-line-tax.rule';
import { LLMService } from '../llm-module/llm.service';
import { AppError } from '../../shared/errors/app-error';

export class ValidationService {
  constructor(
    private validationRepository: ValidationRepository,
    private LLMService: LLMService
  ) { }

  async runRules(invoice: InvoiceForValidation, invoiceId: string): Promise<RuleResult[]> {
    const runAt = new Date();
    const results: RuleResult[] = [];

    const formatResult = gstinFormatRule.evaluate(invoice);
    results.push(formatResult);

    // Only run checksum if format already passed — checksum math is meaningless
    // on a string that's already the wrong shape
    if (formatResult.passed) {
      results.push(gstinChecksumRule.evaluate(invoice));
      results.push(lineItemsSumRule.evaluate(invoice));
      results.push(perLineTaxCalculationRule.evaluate(invoice));
    }

    await this.validationRepository.saveResults(invoiceId, runAt, results);
    return results;
  }

  async generateAndSummary(id: string, invoice: InvoiceForValidation, results: RuleResult[]) {
    try {
      const summary = await this.LLMService.descriptionGenerate(id, invoice, results)

      if (!summary) {
        throw new AppError('summary generation failed')
      }

      const data: SummaryResult = summary
      await this.validationRepository.updateSummaryStatus(data.invoiceId, data.summary, 'COMPLETE')


    } catch (error) {
      throw new AppError('summary generation failed')
    }
  }

  async getReviewById(InvoiceId: string) {

    const reviewResult = await this.validationRepository.getReviewById(InvoiceId)
    return reviewResult;
  }
}