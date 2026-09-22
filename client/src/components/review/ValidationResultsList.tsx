import type { RuleResult } from '../../types'

interface ValidationResultsListProps {
  results?: RuleResult[]
  loading?: boolean
  error?: string | null
  onRun?: () => void
}

export function ValidationResultsList({
  results,
  loading,
  error,
  onRun,
}: ValidationResultsListProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>GST validation rules</h2>
        {onRun ? (
          <button type="button" className="btn btn-secondary" onClick={onRun} disabled={loading}>
            {loading ? 'Running…' : 'Run validation'}
          </button>
        ) : null}
      </div>
      {error ? (
        <div className="banner banner-warn">
          <p>{error}</p>
          <p className="muted small">
            Validation API may not be mounted yet. Endpoint:{' '}
            {/* <code>POST /api/invoice/v1/validate/:invoiceId</code> */}
          </p>
        </div>
      ) : null}
      {!results?.length && !error && !loading ? (
        <p className="muted">No rule results yet. Run validation after reviewing extracted fields.</p>
      ) : null}
      {results && results.length > 0 ? (
        <ul className="rule-list">
          {results.map((r) => (
            <li key={r.ruleCode} className={r.passed ? 'rule-pass' : 'rule-fail'}>
              <div className="rule-top">
                <strong>{r.ruleCode}</strong>
                <span className={`badge ${r.passed ? 'badge-ok' : 'badge-bad'}`}>
                  {r.passed ? 'Passed' : r.severity}
                </span>
              </div>
              <p>{r.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
