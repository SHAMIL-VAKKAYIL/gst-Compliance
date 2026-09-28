import { prisma } from '../../prisma/client';
import { AppError } from '../../shared/errors/app-error';
import { logger } from '../../shared/utils/logger';
import { RuleResult } from './validation.types';

export class ValidationRepository {




  async saveResults(invoiceId: string, runAt: Date, results: RuleResult[]) {
    await prisma.$transaction([
      prisma.validationResult.deleteMany({ where: { invoiceId } }),
      prisma.validationResult.createMany({
        data: results.map((r) => ({
          invoiceId,
          runAt,
          ruleCode: r.ruleCode,
          passed: r.passed,
          severity: r.severity,
          message: r.message,
        })),
      }),
    ]);
  }
  // async getReviewById(InvoiceId: string) {

  //   const review = await prisma.validationResult.findFirst({ where: { invoiceId: InvoiceId } })

  //   if (!review) {
  //     throw new AppError('no review found on this invoice')
  //   }
  //   return review
  // }



  async updateSummaryStatus(id: string, summary: string, status: 'PENDING' | 'COMPLETE' | 'FAILED') {
    try {
      return await prisma.invoice.update({
        where: { id: id },
        data: { summary, summaryStatus: status },
      })
    }
    catch (error) {
      logger.error({ err: error }, 'Failed to store summary');

      throw new AppError('failed to store summary')
    }
  }


  async getLatestResults(invoiceId: string) {
    const latest = await prisma.validationResult.findFirst({
      where: { invoiceId },
      orderBy: { runAt: 'desc' },
      select: { runAt: true }
    });

    if (!latest) return [];

    return prisma.validationResult.findMany({
      where: { invoiceId, runAt: latest.runAt }
    });
  }
}