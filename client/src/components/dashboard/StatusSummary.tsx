interface StatusSummaryProps {
  counts: Record<string, number>
  total: number
}

export function StatusSummary({ counts, total }: StatusSummaryProps) {
  return (
    <section className="status-summary">
      <div className="stat">
        <span className="stat-value">{total}</span>
        <span className="stat-label">In session</span>
      </div>
      <div className="stat stat-ok">
        <span className="stat-value">{counts.COMPLETE ?? 0}</span>
        <span className="stat-label">Complete</span>
      </div>
      <div className="stat stat-warn">
        <span className="stat-value">{counts.NEEDS_CORRECTION ?? 0}</span>
        <span className="stat-label">Needs correction</span>
      </div>
      <div className="stat stat-bad">
        <span className="stat-value">{counts.FAILED ?? 0}</span>
        <span className="stat-label">Failed</span>
      </div>
    </section>
  )
}
