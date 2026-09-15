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
