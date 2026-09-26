import type { ExtractedInvoiceData, ValidationMetrics } from '../../types'

interface InvoiceHeaderFormProps {
  value: ExtractedInvoiceData
  onChange?: (next: ExtractedInvoiceData) => void
  fieldValidation?: ValidationMetrics
  readOnly: boolean
}

export function InvoiceHeaderForm({ value, onChange, fieldValidation, readOnly }: InvoiceHeaderFormProps) {
  function patch<K extends keyof ExtractedInvoiceData>(key: K, v: ExtractedInvoiceData[K]) {
    onChange?.({ ...value, [key]: v })
  }
  console.log(value.invoiceDate);


  function formatDate(isoString: string | null | undefined): string {
    if (!isoString) return '—'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <section className="panel">
      <h2>Invoice details</h2>
      <div className="form-grid">
        <label className={fieldClass(fieldValidation?.gstnValid)}>
          GSTIN
          <input value={value.gstin} onChange={(e) => patch('gstin', e.target.value)} />
        </label>
        {value.buyerGstin && (<label>
          Buyer GSTIN
          <input value={value.buyerGstin} onChange={(e) => patch('gstin', e.target.value)} />
        </label>)}
        <label className={fieldClass(fieldValidation?.invoiceNumberValid)}>
          Invoice number
          <input
            readOnly={readOnly}
            value={value.invoiceNumber}
            onChange={(e) => patch('invoiceNumber', e.target.value)}
          />
        </label>
        <label className={fieldClass(fieldValidation?.vendorValid)}>
          Vendor

          <input readOnly={readOnly} value={value.vendorName} onChange={(e) => patch('vendorName', e.target.value)} />
        </label>
        <label className={fieldClass(fieldValidation?.dateValid)}>
          Invoice date
          <input
            type="text"
            readOnly={readOnly}

            value={formatDate(value.invoiceDate)}
          // onChange={(e) => patch('invoiceDate', e.target.value || null)}
          />
        </label>
        <label>
          Tax
          <input
            type="number"
            readOnly={readOnly}

            step="0.01"
            value={Number.isFinite(value.tax) ? value.tax : 0}
            onChange={(e) => patch('tax', Number(e.target.value))}
          />
        </label>
        <label className={fieldClass(fieldValidation?.totalValid)}>
          Total amount
          <input
            type="number"
            readOnly={readOnly}

            step="0.01"
            value={value.amount ? value.amount : 0}
          // onChange={(e) => patch('amount', Number(e.target.value))}
          />
        </label>
      </div>
    </section>
  )
}

function fieldClass(valid?: boolean): string | undefined {
  if (valid === undefined) return undefined
  return valid ? 'field-ok' : 'field-bad'
}
