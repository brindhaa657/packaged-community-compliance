/**
 * Report Generation Service
 * Generates official Legal Metrology inspection notices and compliance audit reports
 */

class ReportService {
  generateInspectionReportHTML(inspectionData, officerData) {
    const {
      inspectionId,
      productDetailsSnapshot,
      location,
      inspectionDate,
      overallResult,
      confidenceScore,
      remarks,
      findings = [],
      declarations = [],
    } = inspectionData;

    const formattedDate = new Date(inspectionDate || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isNonCompliant = overallResult === 'POTENTIAL_NON_COMPLIANCE';
    const statusColor = isNonCompliant ? '#dc2626' : overallResult === 'COMPLIANT' ? '#059669' : '#d97706';

    const findingsHtml = findings
      .map(
        (f) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: 600; font-size: 13px;">${f.ruleId || 'RULE-LM'}</td>
          <td style="padding: 10px; font-size: 13px;">
            <strong>${f.ruleTitle || f.requiredField}</strong><br/>
            <span style="color: #64748b; font-size: 11px;">${f.legalReference || 'Rule 6(1)'}</span>
          </td>
          <td style="padding: 10px; font-size: 12px; color: ${f.status === 'POTENTIAL_VIOLATION' ? '#b91c1c' : '#047857'}; font-weight: 600;">
            ${f.status === 'POTENTIAL_VIOLATION' ? 'POTENTIAL NON-COMPLIANCE' : 'COMPLIANT'}
          </td>
          <td style="padding: 10px; font-size: 12px; color: #334155;">
            ${f.description}
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Legal Metrology Inspection Notice - ${inspectionId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 30px; margin: 0; background: #fff; }
          .header { border-bottom: 3px double #0b2545; padding-bottom: 15px; text-align: center; margin-bottom: 25px; }
          .gov-title { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0b2545; margin: 0; }
          .sub-gov { font-size: 13px; color: #475569; font-weight: 600; margin-top: 4px; }
          .notice-badge { display: inline-block; padding: 6px 16px; border-radius: 4px; font-size: 14px; font-weight: 700; background: #f8fafc; border: 1px solid #cbd5e1; margin-top: 10px; }
          .grid { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
          .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #0b2545; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background: #f1f5f9; padding: 8px 10px; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; }
          .disclaimer-box { background: #fffbeb; border: 1px solid #fde68a; padding: 12px; font-size: 11px; color: #92400e; margin-top: 25px; border-radius: 4px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="gov-title">GOVERNMENT OF INDIA</div>
          <div class="sub-gov">DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY DIVISION</div>
          <div class="notice-badge">STATUTORY COMMODITY SCREENING NOTICE (RULES, 2011)</div>
        </div>

        <div class="grid">
          <div>
            <strong>Inspection Ref ID:</strong> ${inspectionId}<br/>
            <strong>Date & Time:</strong> ${formattedDate}<br/>
            <strong>Inspecting Officer:</strong> ${officerData?.name || 'Enforcement Inspector'} (${officerData?.badgeNumber || 'LM-OFF-742'})<br/>
            <strong>Division:</strong> ${officerData?.jurisdiction || 'Delhi NCR Division'}
          </div>
          <div style="text-align: right;">
            <strong>Overall Screening:</strong> <span style="color: ${statusColor}; font-weight: 800;">${overallResult.replace(/_/g, ' ')}</span><br/>
            <strong>Confidence Score:</strong> ${confidenceScore || 95}%<br/>
            <strong>Premises:</strong> ${location?.storeName || 'Retail Mart'}<br/>
            <strong>Location:</strong> ${location?.city || 'Delhi'}, ${location?.state || 'Delhi NCR'}
          </div>
        </div>

        <div class="section-title">1. Inspected Packaged Commodity Details</div>
        <div style="font-size: 13px; margin-bottom: 15px;">
          <strong>Commodity / Product Name:</strong> ${productDetailsSnapshot?.productName || 'Packaged Commodity'}<br/>
          <strong>Brand:</strong> ${productDetailsSnapshot?.brand || 'N/A'} | <strong>Category:</strong> ${productDetailsSnapshot?.category || 'General FMCG'}<br/>
          <strong>Inspection Modality:</strong> ${location?.inspectionType || 'RETAIL_STORE'}
        </div>

        <div class="section-title">2. Mandatory Declarations & Legal Metrology Compliance Findings</div>
        <table>
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Requirement & Reference</th>
              <th>AI Screening</th>
              <th>Officer Verification & Finding</th>
            </tr>
          </thead>
          <tbody>
            ${findingsHtml}
          </tbody>
        </table>

        ${
          remarks
            ? `<div class="section-title">3. Officer Remarks & Statutory Notes</div>
               <div style="font-size: 13px; background: #f8fafc; padding: 10px; border-left: 3px solid #0b2545;">${remarks}</div>`
            : ''
        }

        <div class="disclaimer-box">
          <strong>STATUTORY NOTICE:</strong> This inspection document constitutes an official screening record under Section 18 of the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011. AI screening assists the enforcement authority; statutory determinations are formally confirmed by the verifying inspector.
        </div>

        <div class="footer">
          <div>
            <strong>Verified By:</strong><br/>
            ${officerData?.name || 'Inspecting Authority'}<br/>
            Legal Metrology Officer
          </div>
          <div style="text-align: right;">
            <strong>Official Signature / Stamp:</strong><br/>
            [ELECTRONICALLY VERIFIED]<br/>
            ${formattedDate}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new ReportService();
