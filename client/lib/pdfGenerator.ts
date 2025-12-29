import { ScanResult } from "@/hooks/useScanHistory";

export function generatePdfHtml(scan: ScanResult): string {
  const medicinesHtml = scan.medicines
    ?.map((medicine, idx) => {
      const recommendation = scan.recommendations?.[idx];
      
      const statusBadge = medicine.verificationStatus === "verified" 
        ? '<span class="status verified">Verified</span>'
        : medicine.verificationStatus === "suggested"
        ? '<span class="status suggested">Suggested</span>'
        : '<span class="status not-found">Not Found</span>';
      
      const compositionHtml = medicine.composition || medicine.activeIngredient
        ? `<div class="composition">
            <strong>Composition:</strong> ${medicine.composition || medicine.activeIngredient}
          </div>`
        : "";

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
            <div class="medicine-name">
              <h3>${medicine.name}</h3>
              ${medicine.nameArabic ? `<span class="arabic-name">${medicine.nameArabic}</span>` : ""}
            </div>
            <div class="medicine-badges">
              ${statusBadge}
              <span class="confidence ${
                medicine.confidence >= 80 ? "high" : medicine.confidence >= 60 ? "medium" : "low"
              }">
                ${medicine.confidence}%
              </span>
            </div>
          </div>
          ${compositionHtml}
          ${recommendation?.dosing ? `<div class="dosing"><strong>Dosing:</strong> ${recommendation.dosing}</div>` : ""}
          ${interactionsHtml}
          ${contraindicationsHtml}
          ${recommendationsHtml}
        </div>
      `;
    })
    .join("") || "";

  const prescriptionImageHtml = scan.imageUri
    ? `<div class="prescription-section">
        <h3>Original Prescription</h3>
        <div class="prescription-image-container">
          <img src="${scan.imageUri}" alt="Prescription" class="prescription-image" />
        </div>
      </div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Prescription Analysis Report</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          color: #1E293B;
          font-size: 11px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #2563EB;
        }
        .header h1 {
          color: #2563EB;
          font-size: 24px;
          margin-bottom: 4px;
        }
        .header .subtitle {
          font-size: 14px;
          color: #64748B;
        }
        .header .date {
          color: #94A3B8;
          font-size: 11px;
          margin-top: 4px;
        }
        .main-content {
          display: flex;
          gap: 20px;
        }
        .left-column {
          width: 35%;
          flex-shrink: 0;
        }
        .right-column {
          flex: 1;
        }
        .prescription-section {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 15px;
        }
        .prescription-section h3 {
          font-size: 12px;
          color: #475569;
          margin-bottom: 10px;
        }
        .prescription-image-container {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 8px;
        }
        .prescription-image {
          width: 100%;
          height: auto;
          max-height: 400px;
          object-fit: contain;
          border-radius: 4px;
        }
        .summary-box {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }
        .summary-box .value {
          font-size: 28px;
          font-weight: bold;
          color: #2563EB;
        }
        .summary-box .label {
          color: #64748B;
          font-size: 11px;
        }
        .section-title {
          font-size: 14px;
          margin-bottom: 12px;
          color: #1E293B;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 6px;
        }
        .medicine-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          page-break-inside: avoid;
        }
        .medicine-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .medicine-name h3 {
          font-size: 13px;
          color: #1E293B;
          margin-bottom: 2px;
        }
        .arabic-name {
          font-size: 11px;
          color: #64748B;
        }
        .medicine-badges {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .status {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status.verified { background: #D1FAE5; color: #059669; }
        .status.suggested { background: #FEF3C7; color: #D97706; }
        .status.not-found { background: #FEE2E2; color: #DC2626; }
        .confidence {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          color: white;
        }
        .confidence.high { background: #059669; }
        .confidence.medium { background: #F59E0B; }
        .confidence.low { background: #DC2626; }
        .composition {
          background: #EFF6FF;
          padding: 8px;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 10px;
        }
        .dosing {
          background: white;
          padding: 8px;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 10px;
          border: 1px solid #E2E8F0;
        }
        .warning-section, .info-section {
          padding: 8px;
          border-radius: 6px;
          margin-top: 8px;
          font-size: 10px;
        }
        .warning-section.danger {
          background: #FEE2E2;
          border-left: 3px solid #DC2626;
        }
        .warning-section.warning {
          background: #FEF3C7;
          border-left: 3px solid #F59E0B;
        }
        .info-section {
          background: #ECFDF5;
          border-left: 3px solid #059669;
        }
        .warning-section h4, .info-section h4 {
          font-size: 10px;
          margin-bottom: 4px;
        }
        .warning-section.danger h4 { color: #DC2626; }
        .warning-section.warning h4 { color: #D97706; }
        .info-section h4 { color: #059669; }
        ul {
          padding-left: 16px;
          font-size: 10px;
        }
        li {
          margin-bottom: 2px;
        }
        .disclaimer {
          margin-top: 20px;
          padding: 12px;
          background: #FEF3C7;
          border-radius: 6px;
          font-size: 9px;
          color: #92400E;
          text-align: center;
        }
        .footer {
          margin-top: 15px;
          text-align: center;
          color: #94A3B8;
          font-size: 9px;
          padding-top: 10px;
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
      
      <div class="main-content">
        <div class="left-column">
          ${prescriptionImageHtml}
          <div class="summary-box">
            <div class="value">${scan.medicinesCount}</div>
            <div class="label">Medicines Found</div>
            <div style="margin-top: 8px; font-size: 10px; color: #64748B;">
              Scanned: ${new Date(scan.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div class="right-column">
          <h2 class="section-title">Analysis Results</h2>
          ${medicinesHtml}
        </div>
      </div>
      
      <div class="disclaimer">
        <strong>Medical Disclaimer:</strong> This AI-generated report is for informational purposes only. 
        Always consult a qualified healthcare professional before making any medical decisions. 
        Do not start, stop, or change medications without professional medical advice.
      </div>
      
      <div class="footer">
        <p>Powered by MedScan Egypt - AI Prescription Assistant | Report ID: ${scan.id}</p>
      </div>
    </body>
    </html>
  `;
}
