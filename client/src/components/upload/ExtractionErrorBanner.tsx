interface ExtractionErrorBannerProps {
  error: string
  failureReason?: string | null
  extractionStatus?: string | null
}

export function ExtractionErrorBanner({
  error,
  failureReason,
  extractionStatus,
}: ExtractionErrorBannerProps) {
  return (
    <div className="banner banner-error" role="alert">
      <strong>Extraction failed</strong>
      <p>{error}</p>
      {(failureReason || extractionStatus) && (
        <p className="muted small">
          {extractionStatus ? `Status: ${extractionStatus}` : null}
          {extractionStatus && failureReason ? ' · ' : null}
          {failureReason ? `Reason: ${failureReason}` : null}
        </p>
      )}
    </div>
  )
}
