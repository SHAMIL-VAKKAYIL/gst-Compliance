interface ComplianceSummaryCardProps {
  summary?: string | null
}

export function ComplianceSummaryCard({ summary }: ComplianceSummaryCardProps) {
  return (
    <section className="panel">
      <h2>Compliance summary</h2>
      {summary ? (
        <p className="summary-text">{summary}</p>
      ) : (
        <p className="muted">
          LLM compliance summaries are not available yet. This card will show plain-English findings
          once a summary API is wired.
        </p>
      )}
    </section>
  )
}
