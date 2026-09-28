import { buyerGstinFormatRule, sellerGstinFormatRule } from './rules/gstin-format.rule';
import { buyerGstinChecksumRule, sellerGstinChecksumRule } from './rules/gstin-checksum.rule';
import { RuleResult, InvoiceForValidation, SummaryResult } from './validation.types';
import { ValidationRepository } from './validation.repository';
import { lineItemsSumRule } from './rules/line-items-sum.rule';
import { perLineTaxCalculationRule } from './rules/per-line-tax.rule';
import { LLMService } from '../llm-module/llm.service';
import { AppError } from '../../shared/errors/app-error';
import { validateFutureDate } from './rules/future-date-check';
import { hsnRateValidationRule } from './rules/hsn-code-validation';
import { stateConsistencyRule } from './rules/state-consistency.rule';
import { logger } from '../../shared/utils/logger';

export class ValidationService {
  constructor(
    private validationRepository: ValidationRepository,
    private LLMService: LLMService
  ) { }

  async runRules(invoice: InvoiceForValidation, invoiceId: string): Promise<RuleResult[]> {
    try {

      logger.info({ invoiceId }, 'validation started');

      const runAt = new Date();
      const results: RuleResult[] = [];

      // Format checks — independent, always run
      const sellerFormatResult = sellerGstinFormatRule.evaluate(invoice);
      const buyerFormatResult = buyerGstinFormatRule.evaluate(invoice);
      results.push(sellerFormatResult);
      results.push(buyerFormatResult);


      if (sellerFormatResult.passed) {
        results.push(sellerGstinChecksumRule.evaluate(invoice));
      }
      if (buyerFormatResult.passed) {
        results.push(buyerGstinChecksumRule.evaluate(invoice));
      }

      results.push(lineItemsSumRule.evaluate(invoice));
      results.push(perLineTaxCalculationRule.evaluate(invoice));
      results.push(hsnRateValidationRule.evaluate(invoice));
      results.push(validateFutureDate.evaluate(invoice));
      results.push(stateConsistencyRule.evaluate(invoice));

      await this.validationRepository.saveResults(invoiceId, runAt, results);

      logger.info(
        { invoiceId, total: results.length, failed: results.filter(r => !r.passed).length },
        'validation finished'
      );
      return results;
    } catch (error) {
      logger.error({ err: error }, 'rule checking failed')
      throw new AppError('rule checking failed');

    }
  }

  async generateAndSummary(id: string, invoice: InvoiceForValidation, results: RuleResult[]) {
    try {
      const summary = await this.LLMService.descriptionGenerate(id, invoice, results)

      if (!summary) {
        throw new AppError('summary generation returned no result');
      }

      const data: SummaryResult = summary
      await this.validationRepository.updateSummaryStatus(data.invoiceId, data.summary, 'COMPLETE')


    } catch (error) {
      logger.error({ err: error, invoiceId: id }, 'summary generation failed');
      throw new AppError('summary generation failed')
    }
  }

  // async getReviewById(InvoiceId: string) {

  //   const reviewResult = await this.validationRepository.getReviewById(InvoiceId)
  //   return reviewResult;
  // }
}