const puppeteer = require('puppeteer');

/**
 * PDF Generator Service
 * Generates professional PDF reports for guests
 */

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF for a single guest
   */
  async generateGuestReport({ guest, research, reservations, suggestions }) {
    const html = this.buildGuestReportHTML(guest, research, reservations, suggestions);
    return this.generatePDF(html);
  }

  /**
   * Generate bulk PDF for multiple guests (import batch)
   */
  async generateBulkReport(guests, batchId) {
    const html = this.buildBulkReportHTML(guests, batchId);
    return this.generatePDF(html);
  }

  /**
   * Generate daily arrival report
   */
  async generateDailyReport(guests, date) {
    const html = this.buildDailyReportHTML(guests, date);
    return this.generatePDF(html);
  }

  async generatePDF(html) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true
    });

    await page.close();
    return pdfBuffer;
  }

  getStyles() {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          line-height: 1.5;
          color: #1a1a1a;
          background: #fff;
        }
        
        .header {
          text-align: center;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 2px solid #B8860B;
        }
        
        .header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 600;
          color: #1a1a1a;
          letter-spacing: 2px;
        }
        
        .header .subtitle {
          color: #B8860B;
          font-size: 12px;
          margin-top: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .header .date {
          color: #666;
          font-size: 11px;
          margin-top: 10px;
        }
        
        .guest-card {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .guest-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        
        .guest-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .vip-badge {
          background: linear-gradient(135deg, #B8860B, #DAA520);
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 12px;
        }
        
        .vip-score {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .vip-score .score {
          font-size: 24px;
          font-weight: 700;
          color: #B8860B;
        }
        
        .vip-score .label {
          font-size: 10px;
          color: #666;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        
        .info-value {
          font-size: 12px;
          color: #1a1a1a;
        }
        
        .section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: 600;
          color: #B8860B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        
        .notable-info {
          background: #fff;
          border-left: 3px solid #B8860B;
          padding: 10px 15px;
          font-size: 11px;
          color: #444;
        }
        
        .link {
          color: #B8860B;
          text-decoration: none;
        }
        
        .footer {
          text-align: center;
          padding-top: 20px;
          margin-top: 30px;
          border-top: 1px solid #e5e7eb;
          color: #666;
          font-size: 9px;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .stat-box {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #B8860B;
        }
        
        .stat-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .page-break {
          page-break-after: always;
        }

        .profile-photo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #B8860B;
          margin-right: 15px;
        }

        .profile-photo-small {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #B8860B;
          margin-right: 10px;
        }

        .header-content {
          display: flex;
          align-items: center;
        }

        /* Management Summary Table Styles */
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 10px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .summary-table th {
          background: #f8f9fa;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #B8860B;
        }
        
        .summary-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }
        
        .summary-table tr:last-child td {
          border-bottom: none;
        }
        
        .summary-table tr:hover {
          background: #fffcf5;
        }

        .jump-link {
          color: #1a1a1a;
          text-decoration: none;
          font-weight: 600;
        }
        
        .jump-link:hover {
          color: #B8860B;
          text-decoration: underline;
        }

        .badge-score {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 10px;
          text-align: center;
          min-width: 40px;
        }

        .score-gold { background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; }
        .score-silver { background: #F3F4F6; color: #374151; border: 1px solid #9CA3AF; }
        .score-bronze { background: #FFF7ED; color: #9A3412; border: 1px solid #EA580C; }

        .returning-icon {
          color: #B8860B;
          font-size: 12px;
          margin-left: 5px;
        }

        .social-link-small {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: #0077B5;
          color: white;
          border-radius: 4px;
          text-decoration: none;
          font-size: 10px;
          font-weight: bold;
        }

        .one-line-summary {
          font-style: italic;
          color: #666;
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
    `;
  }

  buildGuestReportHTML(guest, research, reservations, suggestions) {
    const vipScore = research?.vip_score || 5;
    const influenceLevel = research?.influence_level || 'Gemiddeld';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getStyles()}
      </head>
      <body>
        <div class="header">
          <h1>VIP GASTPROFIEL</h1>
          <div class="subtitle">Vertrouwelijk Onderzoeksrapport</div>
          <div class="date">Gegenereerd op ${new Date().toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="guest-card">
          <div class="guest-header">
            <div class="header-content">
              ${research?.profile_photo_url ? `<img src="${research.profile_photo_url}" class="profile-photo">` : ''}
              <div>
                <div class="guest-name">${guest.full_name}</div>
                ${guest.company ? `<div style="color: #666; margin-top: 5px;">${guest.company}</div>` : ''}
              </div>
            </div>
            <div class="vip-score">
              <span class="score">${vipScore}</span>
              <span class="label">/10<br>${influenceLevel}</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">E-mail</span>
              <span class="info-value">${guest.email || 'Niet beschikbaar'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Telefoon</span>
              <span class="info-value">${guest.phone || 'Niet beschikbaar'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Land</span>
              <span class="info-value">${guest.country || 'Niet beschikbaar'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Totaal Verblijven</span>
              <span class="info-value">${guest.total_stays || 1}</span>
            </div>
          </div>

          ${research ? `
            <div class="section">
              <div class="section-title">Professionele Achtergrond</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Functie</span>
                  <span class="info-value">${research.job_title || 'Niet gevonden'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Bedrijf</span>
                  <span class="info-value">${research.company_name || guest.company || 'Niet gevonden'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Industrie</span>
                  <span class="info-value">${research.industry || 'Niet gevonden'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">LinkedIn</span>
                  <span class="info-value">${research.linkedin_url ?
          `<a class="link" href="${research.linkedin_url}">Bekijk Profiel</a>` :
          'Niet gevonden'}</span>
                </div>
              </div>
            </div>

            ${(() => {
          let fullReport = null;
          try {
            fullReport = typeof research.full_report === 'string'
              ? JSON.parse(research.full_report)
              : research.full_report;
          } catch (e) { }

          if (!fullReport) return research.notable_info ? `
                  <div class="section">
                    <div class="section-title">Opmerkelijke Informatie</div>
                    <div class="notable-info">${research.notable_info}</div>
                  </div>
                ` : '';

          return `
                  <div class="section">
                    <div class="section-title">Executive Summary</div>
                    <div class="notable-info" style="border-left-color: #B8860B; background: #fffaf0;">
                      ${fullReport.executive_summary}
                    </div>
                  </div>

                  <div class="section">
                    <div class="section-title">Gedetailleerde Analyse</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Carrièrepad</span>
                        <span class="info-value">${fullReport.professional_background?.career_trajectory || '-'}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Expertise</span>
                        <span class="info-value">${fullReport.professional_background?.industry_expertise || '-'}</span>
                      </div>
                    </div>
                    <div style="margin-top: 10px;">
                      <span class="info-label">Bedrijfsanalyse</span>
                      <div class="info-value">${fullReport.company_analysis?.company_description || '-'}</div>
                      <div style="font-size: 10px; color: #666; margin-top: 3px;">
                        Marktpositie: ${fullReport.company_analysis?.company_position || '-'}
                      </div>
                    </div>
                  </div>

                  <div class="section" style="background: #fdfaf0; padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <div class="section-title">Service Aanbevelingen</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div>
                        <div class="info-label">Prioriteit & Aandacht</div>
                        <div class="info-value"><strong>${fullReport.service_recommendations?.priority_level}</strong></div>
                        <div style="font-size: 10px; margin-top: 5px;">${fullReport.service_recommendations?.special_attention}</div>
                      </div>
                      <div>
                        <div class="info-label">Interesses & Stijl</div>
                        <div style="font-size: 10px;">${fullReport.service_recommendations?.potential_interests}</div>
                        <div style="font-size: 10px; margin-top: 5px;">Communicatie: ${fullReport.service_recommendations?.communication_style}</div>
                      </div>
                    </div>
                  </div>

                  <div class="section">
                    <div class="section-title">VIP Indicatoren</div>
                    <div style="font-size: 10px; color: #444;">
                      <p>• ${fullReport.vip_indicators?.wealth_signals}</p>
                      <p>• ${fullReport.vip_indicators?.influence_factors}</p>
                      <p>• ${fullReport.vip_indicators?.status_markers}</p>
                    </div>
                  </div>
                `;
        })()}
          ` : `
            <div class="section">
              <div class="section-title">Onderzoek Status</div>
              <p style="color: #666;">Onderzoek nog niet uitgevoerd voor deze gast.</p>
            </div>
          `}

          ${reservations && reservations.length > 0 ? `
            <div class="section">
              <div class="section-title">Recente Reserveringen</div>
              <table style="width: 100%; font-size: 10px;">
                <thead>
                  <tr style="text-align: left; color: #666;">
                    <th style="padding: 5px 0;">Check-in</th>
                    <th style="padding: 5px 0;">Check-out</th>
                    <th style="padding: 5px 0;">Kamer</th>
                  </tr>
                </thead>
                <tbody>
                  ${reservations.slice(0, 5).map(r => `
                    <tr>
                      <td style="padding: 3px 0;">${r.check_in_date || '-'}</td>
                      <td style="padding: 3px 0;">${r.check_out_date || '-'}</td>
                      <td style="padding: 3px 0;">${r.room_number || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          Dit rapport is automatisch gegenereerd door het VIP Guest Research Tool.
          Alleen bestemd voor intern gebruik.
        </div>
      </body>
      </html>
    `;
  }

  buildBulkReportHTML(guests, batchId) {
    const totalGuests = guests.length;
    const vipCount = guests.filter(g => g.vip_score >= 7).length;
    const researchedCount = guests.filter(g => g.vip_score).length;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getStyles()}
      </head>
      <body>
        <div class="header">
          <h1>VIP OVERZICHTSRAPPORT</h1>
          <div class="subtitle">Import Batch Samenvatting</div>
          <div class="date">Gegenereerd op ${new Date().toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>

        <div class="summary-stats">
          <div class="stat-box">
            <div class="stat-value">${totalGuests}</div>
            <div class="stat-label">Totaal Gasten</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${vipCount}</div>
            <div class="stat-label">VIP Gasten</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${researchedCount}</div>
            <div class="stat-label">Onderzocht</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${totalGuests - researchedCount}</div>
            <div class="stat-label">In Afwachting</div>
          </div>
        </div>

        ${this.buildManagementSummaryTable(guests)}

        <div class="page-break"></div>

        ${guests.map((guest, index) => `
          <div id="guest-${guest.id}" class="guest-card">
            <div class="guest-header">
              <div class="header-content">
                ${guest.profile_photo_url ? `<img src="${guest.profile_photo_url}" class="profile-photo-small">` : ''}
                <div>
                  <div class="guest-name">${guest.full_name}</div>
                  ${guest.company || guest.research_company ?
        `<div style="color: #666; margin-top: 3px;">${guest.research_company || guest.company}</div>` : ''}
                </div>
              </div>
              ${guest.vip_score ? `
                <div class="vip-badge">${guest.vip_score}/10 - ${guest.influence_level || 'Score'}</div>
              ` : '<div style="color: #999; font-size: 10px;">Niet onderzocht</div>'}
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Functie</span>
                <span class="info-value">${guest.job_title || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Land</span>
                <span class="info-value">${guest.country || '-'}</span>
              </div>
            </div>
            ${(() => {
        let summary = guest.notable_info || '';
        if (guest.full_report) {
          try {
            const fr = typeof guest.full_report === 'string' ? JSON.parse(guest.full_report) : guest.full_report;
            if (fr && fr.executive_summary) summary = fr.executive_summary;
          } catch (e) { }
        }
        return summary ? `
                  <div class="notable-info" style="font-size: 10px; margin-top: 10px;">
                    ${summary.substring(0, 300)}${summary.length > 300 ? '...' : ''}
                  </div>
                ` : '';
      })()}
          </div>
        `).join('')}

        <div class="footer">
          Dit rapport is automatisch gegenereerd door het VIP Guest Research Tool.
          Batch ID: ${batchId}
        </div>
      </body>
      </html>
    `;
  }

  buildManagementSummaryTable(guests) {
    return `
      <div class="section-title">Management Overzicht (Snelmenu)</div>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Gast Naam</th>
            <th>Kamer</th>
            <th>VIP</th>
            <th>Functie & Bedrijf</th>
            <th>Highlights</th>
            <th>Social</th>
          </tr>
        </thead>
        <tbody>
          ${guests.map(guest => {
      const score = guest.vip_score || 0;
      let scoreClass = 'score-silver';
      if (score >= 8) scoreClass = 'score-gold';
      else if (score < 5 && score > 0) scoreClass = 'score-bronze';

      let shortSummary = '';
      if (guest.full_report) {
        try {
          const fr = typeof guest.full_report === 'string' ? JSON.parse(guest.full_report) : guest.full_report;
          if (fr && fr.executive_summary) {
            shortSummary = fr.executive_summary.split('.')[0] + '.';
          }
        } catch (e) { }
      }
      if (!shortSummary && guest.notable_info) {
        shortSummary = guest.notable_info.substring(0, 60) + '...';
      }

      return `
              <tr>
                <td>
                  <a href="#guest-${guest.id}" class="jump-link">${guest.full_name}</a>
                  ${guest.total_stays > 1 ? '<span class="returning-icon" title="Terugkerende gast">🔄</span>' : ''}
                </td>
                <td><strong>${guest.room_number || 'TBD'}</strong></td>
                <td><span class="badge-score ${scoreClass}">${score || '-'}</span></td>
                <td>
                  <div style="font-weight:500;">${guest.job_title || '-'}</div>
                  <div style="color: #666; font-size: 9px;">${guest.research_company || guest.company || '-'}</div>
                </td>
                <td><div class="one-line-summary">${shortSummary || '-'}</div></td>
                <td>
                  ${guest.linkedin_url ? `<a href="${guest.linkedin_url}" class="social-link-small">in</a>` : '-'}
                </td>
              </tr>
            `;
    }).join('')}
        </tbody>
      </table>
    `;
  }

  buildDailyReportHTML(guests, date) {
    const formattedDate = new Date(date).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getStyles()}
      </head>
      <body>
        <div class="header">
          <h1>DAGRAPPORT ARRIVALS</h1>
          <div class="subtitle">${formattedDate}</div>
          <div class="date">Gegenereerd om ${new Date().toLocaleTimeString('nl-NL')}</div>
        </div>

        <div class="summary-stats">
          <div class="stat-box">
            <div class="stat-value">${guests.length}</div>
            <div class="stat-label">Arrivals Vandaag</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${guests.filter(g => g.vip_score >= 7).length}</div>
            <div class="stat-label">VIP Gasten</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${guests.filter(g => g.total_stays > 1).length}</div>
            <div class="stat-label">Returning</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${guests.filter(g => !g.vip_score).length}</div>
            <div class="stat-label">Niet Onderzocht</div>
          </div>
        </div>

        ${this.buildManagementSummaryTable(guests)}

        <div class="page-break"></div>

        ${guests.map((guest, index) => `
          <div id="guest-${guest.id}" class="guest-card">
            <div class="guest-header">
              <div class="header-content">
                ${guest.profile_photo_url ? `<img src="${guest.profile_photo_url}" class="profile-photo-small">` : ''}
                <div>
                  <div class="guest-name">${guest.full_name}</div>
                  <div style="color: #666; font-size: 10px; margin-top: 3px;">
                    Kamer ${guest.room_number || 'TBD'} | 
                    ${guest.check_in_date} - ${guest.check_out_date}
                  </div>
                </div>
              </div>
              ${guest.vip_score >= 7 ? `
                <div class="vip-badge">VIP ${guest.vip_score}/10</div>
              ` : guest.vip_score ? `
                <div style="color: #666; font-size: 11px;">Score: ${guest.vip_score}/10</div>
              ` : ''}
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Functie</span>
                <span class="info-value">${guest.job_title || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Bedrijf</span>
                <span class="info-value">${guest.research_company || guest.company || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Land</span>
                <span class="info-value">${guest.country || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Verblijven</span>
                <span class="info-value">${guest.total_stays || 1}x</span>
              </div>
            </div>
            ${(() => {
        let summary = guest.notable_info || '';
        if (guest.full_report) {
          try {
            const fr = typeof guest.full_report === 'string' ? JSON.parse(guest.full_report) : guest.full_report;
            if (fr && fr.executive_summary) summary = fr.executive_summary;
          } catch (e) { }
        }
        return summary ? `
                  <div class="notable-info" style="font-size: 10px; margin-top: 10px;">
                    ${summary.substring(0, 300)}${summary.length > 300 ? '...' : ''}
                  </div>
                ` : '';
      })()}
          </div>
        `).join('')}

        <div class="footer">
          Dit rapport is automatisch gegenereerd door het VIP Guest Research Tool.
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PDFGenerator();
