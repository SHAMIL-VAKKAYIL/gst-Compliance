import type { ValidationMetrics } from '../../types'

interface FieldValidityBadgesProps {
  metrics?: ValidationMetrics
}

const LABELS: { key: keyof Omit<ValidationMetrics, 'validFieldCount'>; label: string }[] = [
  { key: 'gstnValid', label: 'GSTIN' },
  { key: 'invoiceNumberValid', label: 'Invoice #' },
  { key: 'vendorValid', label: 'Vendor' },
  { key: 'dateValid', label: 'Date' },
  { key: 'totalValid', label: 'Total' },
]

export function FieldValidityBadges({ metrics }: FieldValidityBadgesProps) {
  if (!metrics) return null

  return (
    <section className="panel">
      <h2>Field checks</h2>
      <p className="muted small">{metrics.validFieldCount} / 5 fields look valid</p>
      <div className="badge-row">
        {LABELS.map(({ key, label }) => (
          <span key={key} className={`badge ${metrics[key] ? 'badge-ok' : 'badge-bad'}`}>
            {label}: {metrics[key] ? 'OK' : 'Check'}
          </span>
        ))}
      </div>
    </section>
  )
}
