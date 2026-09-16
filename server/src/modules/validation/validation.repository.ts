import { prisma } from '../../prisma/client';
import { RuleResult } from './validation.types';

export class ValidationRepository {
  async saveResults(invoiceId: string, runAt: Date, results: RuleResult[]) {
    await prisma.validationResult.createMany({
      data: results.map(r => ({
        invoiceId,
        runAt,
        ruleCode: r.ruleCode,
        passed: r.passed,
        severity: r.severity,
        message: r.message
      }))
    });
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