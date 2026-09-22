import { useState } from "react"


interface ComplianceSummaryCardProps {
  summary: string | null
  checking?: boolean
  onCheckSummary?: () => void
}





export function ComplianceSummaryCard({ summary, checking, onCheckSummary }: ComplianceSummaryCardProps) {


  return (
    <section className="panel">
      <h2>Compliance summary</h2>
      {summary ? (
        <p className="summary-text">{summary}</p>
      ) : (
        <div className="summary-empty">
          <p className="muted">Compliance summary not generated yet.</p>
          <button
            className="btn btn-secondary"
            onClick={onCheckSummary}
            disabled={checking}
          >
            {checking ? 'Checking…' : 'Check summary'}
          </button>
        </div>
      )}
    </section>
  )
}
