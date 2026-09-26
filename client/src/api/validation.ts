import { apiFetch } from './client'
import type { ExtractedInvoiceData, ValidationResponse } from '../types'

export async function validateInvoice(
  invoiceId: string,
  // invoice: {
  //   gstin: string
  //   invoiceNumber: string | null
  //   vendorName: string | null
  //   invoiceDate: string | null
  //   amount: number | null
  //   lineItems?: ExtractedInvoiceData['lineItems']
  // },
): Promise<ValidationResponse> {
  return apiFetch<ValidationResponse>(`/api/validation/v1/validate/${encodeURIComponent(invoiceId)}`, {
    method: 'POST',
    // data: invoice,
  })
}
