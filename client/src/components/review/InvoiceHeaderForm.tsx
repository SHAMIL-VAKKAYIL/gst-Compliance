import type { ExtractedInvoiceData, ValidationMetrics } from '../../types'

interface InvoiceHeaderFormProps {
  value: ExtractedInvoiceData
  onChange: (next: ExtractedInvoiceData) => void
  fieldValidation?: ValidationMetrics
}

export function InvoiceHeaderForm({ value, onChange, fieldValidation }: InvoiceHeaderFormProps) {
  function patch<K extends keyof ExtractedInvoiceData>(key: K, v: ExtractedInvoiceData[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <section className="panel">
      <h2>Invoice details</h2>
      <div className="form-grid">
        <label className={fieldClass(fieldValidation?.gstnValid)}>
          GSTIN
          <input value={value.gstin} onChange={(e) => patch('gstin', e.target.value)} />
        </label>
        <label className={fieldClass(fieldValidation?.invoiceNumberValid)}>
          Invoice number
          <input
            value={value.invoiceNumber}
            onChange={(e) => patch('invoiceNumber', e.target.value)}
          />
        </label>
        <label className={fieldClass(fieldValidation?.vendorValid)}>
          Vendor
          <input value={value.vendorName} onChange={(e) => patch('vendorName', e.target.value)} />
        </label>
        <label className={fieldClass(fieldValidation?.dateValid)}>
          Invoice date
          <input
            type="date"
            value={value.invoiceDate ?? ''}
            onChange={(e) => patch('invoiceDate', e.target.value || null)}
          />
        </label>
        <label>
          Invoice amount
          <input
            type="number"
            step="0.01"
            value={Number.isFinite(value.invoiceAmount) ? value.invoiceAmount : 0}
            onChange={(e) => patch('invoiceAmount', Number(e.target.value))}
          />
        </label>
        <label>
          Tax
          <input
            type="number"
            step="0.01"
            value={Number.isFinite(value.tax) ? value.tax : 0}
            onChange={(e) => patch('tax', Number(e.target.value))}
          />
        </label>
        <label className={fieldClass(fieldValidation?.totalValid)}>
          Total amount
          <input
            type="number"
            step="0.01"
            value={Number.isFinite(value.totalAmount) ? value.totalAmount : 0}
            onChange={(e) => patch('totalAmount', Number(e.target.value))}
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
