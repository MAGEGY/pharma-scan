import { ScanResult } from "@/hooks/useScanHistory";

export function generatePdfHtml(scan: ScanResult): string {
  const medicinesHtml = scan.medicines
    ?.map((medicine, idx) => {
      const recommendation = scan.recommendations?.[idx];
      
      const interactionsHtml = recommendation?.interactions?.length
        ? `<div class="warning-section danger">
            <h4>Drug Interactions</h4>
            <ul>${recommendation.interactions.map((i) => `<li>${i}</li>`).join("")}</ul>
          </div>`
        : "";

      const contraindicationsHtml = recommendation?.contraindications?.length
        ? `<div class="warning-section warning">
            <h4>Contraindications</h4>
            <ul>${recommendation.contraindications.map((c) => `<li>${c}</li>`).join("")}</ul>
          </div>`
        : "";

      const recommendationsHtml = recommendation?.recommendations?.length
        ? `<div class="info-section">
            <h4>Recommendations</h4>
            <ul>${recommendation.recommendations.map((r) => `<li>${r}</li>`).join("")}</ul>
          </div>`
        : "";

      return `
        <div class="medicine-card">
          <div class="medicine-header">
            <h3>${medicine.name}${medicine.nameArabic ? ` (${medicine.nameArabic})` : ""}</h3>
            <span class="confidence ${
              medicine.confidence >= 80 ? "high" : medicine.confidence >= 60 ? "medium" : "low"
            }">
              ${medicine.confidence}% confidence
            </span>
          </div>
          ${recommendation?.dosing ? `<div class="dosing"><strong>Dosing:</strong> ${recommendation.dosing}</div>` : ""}
          ${interactionsHtml}
          ${contraindicationsHtml}
          ${recommendationsHtml}
        </div>
      `;
    })
    .join("") || "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Prescription Analysis Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #1E293B;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563EB;
        }
        .header h1 {
          color: #2563EB;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header .date {
          color: #64748B;
          font-size: 14px;
        }
        .summary {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 40px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .value {
          font-size: 32px;
          font-weight: bold;
          color: #2563EB;
        }
        .summary-item .label {
          color: #64748B;
          font-size: 14px;
        }
        .section-title {
          font-size: 20px;
          margin-bottom: 20px;
          color: #1E293B;
        }
        .medicine-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .medicine-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .medicine-header h3 {
          font-size: 18px;
          color: #1E293B;
        }
        .confidence {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .confidence.high { background: #059669; color: white; }
        .confidence.medium { background: #F59E0B; color: white; }
        .confidence.low { background: #DC2626; color: white; }
        .dosing {
          background: white;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .warning-section, .info-section {
          padding: 12px;
          border-radius: 8px;
          margin-top: 12px;
        }
        .warning-section.danger {
          background: #FEE2E2;
          border-left: 4px solid #DC2626;
        }
        .warning-section.warning {
          background: #FEF3C7;
          border-left: 4px solid #F59E0B;
        }
        .info-section {
          background: #ECFDF5;
          border-left: 4px solid #059669;
        }
        .warning-section h4, .info-section h4 {
          font-size: 14px;
          margin-bottom: 8px;
        }
        .warning-section.danger h4 { color: #DC2626; }
        .warning-section.warning h4 { color: #F59E0B; }
        .info-section h4 { color: #059669; }
        ul {
          padding-left: 20px;
          font-size: 14px;
        }
        li {
          margin-bottom: 4px;
        }
        .disclaimer {
          margin-top: 40px;
          padding: 20px;
          background: #FEF3C7;
          border-radius: 8px;
          font-size: 12px;
          color: #92400E;
          text-align: center;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #64748B;
          font-size: 12px;
          padding-top: 20px;
          border-top: 1px solid #E2E8F0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MedScan Egypt</h1>
        <div class="subtitle">Prescription Analysis Report</div>
        <div class="date">Generated on ${new Date().toLocaleString()}</div>
      </div>
      
      <div class="summary">
        <div class="summary-item">
          <div class="value">${scan.medicinesCount}</div>
          <div class="label">Medicines Found</div>
        </div>
        <div class="summary-item">
          <div class="value">${new Date(scan.createdAt).toLocaleDateString()}</div>
          <div class="label">Scan Date</div>
        </div>
      </div>
      
      <h2 class="section-title">Recognized Medicines & Recommendations</h2>
      ${medicinesHtml}
      
      <div class="disclaimer">
        <strong>Disclaimer:</strong> This report is generated by AI analysis and is for informational purposes only. 
        Always consult with a qualified healthcare professional before making any medical decisions. 
        Do not start, stop, or change medications without professional medical advice.
      </div>
      
      <div class="footer">
        <p>Powered by MedScan Egypt - Your AI Prescription Assistant</p>
        <p>Report ID: ${scan.id}</p>
      </div>
    </body>
    </html>
  `;
}
