const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

/**
 * PDF Generator Service
 * Generates professional PDF reports for guests
 * Uses @sparticuz/chromium for serverless compatibility
 */

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
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
      margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
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
          font-size: 10px;
          line-height: 1.4;
          color: #1a1a1a;
          background: #fff;
        }
        
        .header {
          text-align: center;
          padding-bottom: 15px;
          margin-bottom: 15px;
          border-bottom: 2px solid #B8860B;
        }
        
        .header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          letter-spacing: 2px;
        }
        
        .header .subtitle {
          color: #B8860B;
          font-size: 11px;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .header .date {
          color: #666;
          font-size: 10px;
          margin-top: 6px;
        }
        
        .guest-card {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 10px;
          page-break-inside: avoid;
        }
        
        .guest-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .guest-name {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .vip-badge {
          background: linear-gradient(135deg, #B8860B, #DAA520);
          color: white;
          padding: 3px 10px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 10px;
        }
        
        .vip-score {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .vip-score .score {
          font-size: 18px;
          font-weight: 700;
          color: #B8860B;
        }
        
        .vip-score .label {
          font-size: 9px;
          color: #666;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 8px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 1px;
        }
        
        .info-value {
          font-size: 10px;
          color: #1a1a1a;
        }
        
        .section {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        
        .section-title {
          font-size: 10px;
          font-weight: 600;
          color: #B8860B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        
        .notable-info {
          background: #fff;
          border-left: 2px solid #B8860B;
          padding: 6px 10px;
          font-size: 9px;
          color: #444;
        }
        
        .link {
          color: #B8860B;
          text-decoration: none;
        }
        
        .footer {
          text-align: center;
          padding-top: 15px;
          margin-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #666;
          font-size: 8px;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .stat-box {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #B8860B;
        }
        
        .stat-label {
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .page-break {
          page-break-after: always;
        }

        .profile-photo {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #B8860B;
          margin-right: 10px;
        }

        .profile-photo-small {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #B8860B;
          margin-right: 8px;
        }

        .header-content {
          display: flex;
          align-items: center;
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
                ${guest.company ? `<div style="color: #666; margin-top: 3px; font-size: 10px;">${guest.company}</div>` : ''}
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
              <table style="width: 100%; font-size: 9px;">
                <thead>
                  <tr style="text-align: left; color: #666;">
                    <th style="padding: 4px 0;">Check-in</th>
                    <th style="padding: 4px 0;">Check-out</th>
                    <th style="padding: 4px 0;">Kamer</th>
                  </tr>
                </thead>
                <tbody>
                  ${reservations.slice(0, 5).map(r => `
                    <tr>
                      <td style="padding: 2px 0;">${r.check_in_date || '-'}</td>
                      <td style="padding: 2px 0;">${r.check_out_date || '-'}</td>
                      <td style="padding: 2px 0;">${r.room_number || '-'}</td>
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

        ${guests.map((guest, index) => `
          <div class="guest-card" ${index > 0 && index % 5 === 0 ? 'style="page-break-before: always;"' : ''}>
            <div class="guest-header">
              <div class="header-content">
                ${guest.profile_photo_url ? `<img src="${guest.profile_photo_url}" class="profile-photo-small">` : ''}
                <div>
                  <div class="guest-name" style="font-size: 12px;">${guest.full_name}</div>
                  ${guest.company || guest.research_company ?
        `<div style="color: #666; font-size: 9px;">${guest.research_company || guest.company}</div>` : ''}
                </div>
              </div>
              ${guest.vip_score ? `
                <div class="vip-badge">${guest.vip_score}/10</div>
              ` : '<div style="color: #999; font-size: 9px;">Niet onderzocht</div>'}
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
              <div class="info-item">
                <span class="info-label">Invloed</span>
                <span class="info-value">${guest.influence_level || '-'}</span>
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
                  <div class="notable-info" style="font-size: 9px; margin-top: 6px;">
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

        ${guests.map((guest, index) => `
          <div class="guest-card" ${index > 0 && index % 5 === 0 ? 'style="page-break-before: always;"' : ''}>
            <div class="guest-header">
              <div class="header-content">
                ${guest.profile_photo_url ? `<img src="${guest.profile_photo_url}" class="profile-photo-small">` : ''}
                <div>
                  <div class="guest-name" style="font-size: 12px;">${guest.full_name}</div>
                  <div style="color: #666; font-size: 9px;">
                    Kamer ${guest.room_number || 'TBD'} | 
                    ${guest.check_in_date} - ${guest.check_out_date}
                  </div>
                </div>
              </div>
              ${guest.vip_score >= 7 ? `
                <div class="vip-badge">VIP ${guest.vip_score}/10</div>
              ` : guest.vip_score ? `
                <div style="color: #666; font-size: 10px;">Score: ${guest.vip_score}/10</div>
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
                  <div class="notable-info" style="font-size: 9px; margin-top: 6px;">
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
