import { apiFetch } from './client'
import type { ExtractionResult } from '../types'

export async function extractInvoice(file: File): Promise<ExtractionResult> {
  const form = new FormData()
  form.append('file', file)

  return apiFetch<ExtractionResult>('/api/invoice/v1/extraction', {
    method: 'POST',
    data: form,
  })
}

export async function invoices() {
  return apiFetch('/api/invoice/v1/invoices')
}

export async function getInvoiceById(InvoiceId: string): Promise<any> {
  const response:any = await apiFetch(`/api/invoice/v1/${InvoiceId}`)
  return response.data
}

export async function checkGeneratedSummary(InvoiceId: string) {
  const response = await apiFetch(`/api/invoice/v1/summary/${InvoiceId}`)
  return response
}
