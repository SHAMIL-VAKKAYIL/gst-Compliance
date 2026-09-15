import type { ExtractionStatus, StoredInvoice } from '../types'

const STORAGE_KEY = 'gst_local_invoices'

function readAll(): StoredInvoice[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredInvoice[]
  } catch {
    return []
  }
}

function writeAll(invoices: StoredInvoice[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
}

export function listInvoices(): StoredInvoice[] {
  return readAll().sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )
}

export function getInvoice(localId: string): StoredInvoice | undefined {
  return readAll().find((inv) => inv.localId === localId)
}

export function saveInvoice(invoice: StoredInvoice): StoredInvoice {
  const all = readAll().filter((inv) => inv.localId !== invoice.localId)
  all.unshift(invoice)
  writeAll(all.slice(0, 50))
  return invoice
}

export function updateInvoice(
  localId: string,
  patch: Partial<StoredInvoice>,
): StoredInvoice | undefined {
  const all = readAll()
  const idx = all.findIndex((inv) => inv.localId === localId)
  if (idx === -1) return undefined
  const updated = { ...all[idx], ...patch }
  all[idx] = updated
  writeAll(all)
  return updated
}

export function statusCounts(invoices: StoredInvoice[]): Record<string, number> {
  const counts: Record<string, number> = {
    COMPLETE: 0,
    NEEDS_CORRECTION: 0,
    FAILED: 0,
    UNKNOWN: 0,
  }
  for (const inv of invoices) {
    const key = (inv.extractionStatus ?? 'UNKNOWN') as ExtractionStatus | 'UNKNOWN'
    if (key && key in counts) counts[key] += 1
    else counts.UNKNOWN += 1
  }
  return counts
}

export function createLocalId(): string {
  return crypto.randomUUID()
}
