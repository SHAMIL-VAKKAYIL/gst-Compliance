import { apiFetch } from './client'
import type { ValidationResponse } from '../types'

export async function validateInvoice(
  invoiceId: string,
): Promise<ValidationResponse> {
  return apiFetch<ValidationResponse>(`/api/validation/v1/validate/${encodeURIComponent(invoiceId)}`, {
    method: 'POST',
    // data: invoice,
  })
}
