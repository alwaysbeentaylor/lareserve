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

  // Generate PDF for a single guest
  async generateGuestReport({ guest, research, reservations, suggestions }) {
    const html = this.buildGuestReportHTML(guest, research, reservations, suggestions);
    return this.generatePDF(html);
  }

  // Generate bulk PDF for multiple guests (import batch)
  async generateBulkReport(guests, batchId) {
    const html = this.buildBulkReportHTML(guests, batchId);
    return this.generatePDF(html);
  }

  // Generate daily arrival report
  async generateDailyReport(guests, date) {
    const html = this.buildDailyReportHTML(guests, date);
    return this.generatePDF(html);
  }

  async generatePDF(html) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });
    await page.close();
    return pdf;
  }

  getStyles() {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #2d3748;
          line-height: 1.6;
          background: #fff;
        }
        
        .header {
          background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
          color: white;
          padding: 30px 40px;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 150px;
          background: linear-gradient(135deg, transparent 0%, rgba(201, 162, 39, 0.3) 100%);
        }
        
        .header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .header .subtitle {
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .gold-bar {
          height: 4px;
          background: linear-gradient(90deg, #c9a227, #d4af37, #c9a227);
        }
        
        .content { padding: 30px 40px; }
        
        .summary-box {
          background: #f7fafc;
          border-left: 4px solid #c9a227;
          padding: 20px;
          margin-bottom: 30px;
          border-radius: 0 8px 8px 0;
        }
        
        .summary-box h3 {
          font-family: 'Playfair Display', serif;
          color: #1a365d;
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1a365d;
        }
        
        .stat-label {
          font-size: 11px;
          color: #718096;
          text-transform: uppercase;
        }
        
        .guest-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 20px;
          overflow: hidden;
          page-break-inside: avoid;
        }
        
        .guest-card-header {
          display: flex;
          align-items: center;
          padding: 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .guest-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a365d, #2c5282);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .guest-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .guest-info h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #1a365d;
          margin-bottom: 4px;
        }
        
        .guest-info .title {
          font-size: 13px;
          color: #4a5568;
        }
        
        .guest-info .meta {
          font-size: 11px;
          color: #718096;
          margin-top: 4px;
        }
        
        .vip-score {
          margin-left: auto;
          text-align: center;
        }
        
        .vip-score .score {
          font-size: 24px;
          font-weight: 700;
        }
        
        .vip-score .label {
          font-size: 10px;
          color: #718096;
          text-transform: uppercase;
        }
        
        .vip-high { color: #48bb78; }
        .vip-medium { color: #ecc94b; }
        .vip-low { color: #fc8181; }
        
        .guest-card-body { padding: 20px; }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .info-item {
          font-size: 12px;
        }
        
        .info-label {
          color: #718096;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .info-value {
          color: #2d3748;
        }
        
        .notable-info {
          background: #fffbeb;
          border-left: 3px solid #c9a227;
          padding: 12px 15px;
          margin-top: 15px;
          border-radius: 0 8px 8px 0;
          font-size: 12px;
        }
        
        .social-links {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        
        .social-link {
          display: inline-block;
          padding: 4px 10px;
          background: #edf2f7;
          border-radius: 4px;
          font-size: 10px;
          color: #4a5568;
          text-decoration: none;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 30px;
        }
        
        .table th {
          background: #1a365d;
          color: white;
          padding: 12px 10px;
          text-align: left;
          font-weight: 500;
        }
        
        .table td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .table tr:nth-child(even) { background: #f7fafc; }
        
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 10px;
          color: #a0aec0;
          border-top: 1px solid #e2e8f0;
        }
        
        .page-break { page-break-before: always; }
      </style>
    `;
  }

  buildGuestReportHTML(guest, research, reservations, suggestions) {
    const vipScore = research?.vip_score || 0;
    const vipClass = vipScore >= 8 ? 'vip-high' : vipScore >= 5 ? 'vip-medium' : 'vip-low';
    const initials = (guest.full_name || 'G').split(' ').map(n => n[0]).join('').substring(0, 2);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getStyles()}
      </head>
      <body>
        <div class="header">
          <h1>${guest.full_name || 'Onbekende Gast'}</h1>
          <div class="subtitle">VIP Gastprofiel</div>
        </div>
        <div class="gold-bar"></div>
        
        <div class="content">
          <div class="guest-card">
            <div class="guest-card-header">
              <div class="guest-avatar">
                ${research?.profile_photo_url
        ? `<img src="${research.profile_photo_url}" alt="${guest.full_name}">`
        : initials}
              </div>
              <div class="guest-info">
                <h3>${guest.full_name}</h3>
                <div class="title">${research?.job_title || guest.company || '-'}</div>
                <div class="meta">${guest.country || ''} ${guest.email ? `• ${guest.email}` : ''}</div>
              </div>
              <div class="vip-score">
                <div class="score ${vipClass}">${vipScore}/10</div>
                <div class="label">VIP Score</div>
              </div>
            </div>
            <div class="guest-card-body">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Industrie</div>
                  <div class="info-value">${research?.industry || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Invloedsniveau</div>
                  <div class="info-value">${research?.influence_level || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Bedrijf</div>
                  <div class="info-value">${research?.research_company || guest.company || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Verblijven</div>
                  <div class="info-value">${guest.total_stays || 1}x</div>
                </div>
              </div>
              ${research?.notable_info ? `
                <div class="notable-info">
                  <strong>Opmerkelijke informatie:</strong><br>
                  ${research.notable_info}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="footer">
          Gegenereerd door VIP Guest Research Tool op ${new Date().toLocaleDateString('nl-NL')}
        </div>
      </body>
      </html>
    `;
  }

  buildBulkReportHTML(guests, batchId) {
    return this.buildDailyReportHTML(guests, batchId);
  }

  buildDailyReportHTML(guests, date) {
    const vipGuests = guests.filter(g => g.vip_score >= 7);
    const highVip = guests.filter(g => g.vip_score >= 8).length;
    const medVip = guests.filter(g => g.vip_score >= 5 && g.vip_score < 8).length;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getStyles()}
      </head>
      <body>
        <div class="header">
          <h1>VIP Gastenoverzicht</h1>
          <div class="subtitle">La Réserve • ${date}</div>
        </div>
        <div class="gold-bar"></div>
        
        <div class="content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${guests.length}</div>
              <div class="stat-label">Totaal Gasten</div>
            </div>
            <div class="stat-card">
              <div class="stat-value vip-high">${highVip}</div>
              <div class="stat-label">High VIP (8+)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value vip-medium">${medVip}</div>
              <div class="stat-label">Medium VIP</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${vipGuests.length}</div>
              <div class="stat-label">Aandacht nodig</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Naam</th>
                <th>Functie</th>
                <th>Bedrijf</th>
                <th>Land</th>
                <th>VIP</th>
              </tr>
            </thead>
            <tbody>
              ${guests.map((g, i) => {
      const vipClass = g.vip_score >= 8 ? 'vip-high' : g.vip_score >= 5 ? 'vip-medium' : 'vip-low';
      return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${g.full_name || '-'}</strong></td>
                    <td>${(g.job_title || '-').substring(0, 30)}</td>
                    <td>${(g.research_company || g.company || '-').substring(0, 25)}</td>
                    <td>${g.country || '-'}</td>
                    <td class="${vipClass}"><strong>${g.vip_score || '-'}/10</strong></td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>

          ${guests.slice(0, 20).map((guest, index) => {
      const initials = (guest.full_name || 'G').split(' ').map(n => n[0]).join('').substring(0, 2);
      const vipScore = guest.vip_score || 0;
      const vipClass = vipScore >= 8 ? 'vip-high' : vipScore >= 5 ? 'vip-medium' : 'vip-low';

      let fullReport = null;
      try {
        fullReport = typeof guest.full_report === 'string' ? JSON.parse(guest.full_report) : guest.full_report;
      } catch (e) { }

      const summary = fullReport?.managementSummary || guest.notable_info || '';

      return `
              <div class="guest-card" ${index > 0 && index % 3 === 0 ? 'style="page-break-before: always;"' : ''}>
                <div class="guest-card-header">
                  <div class="guest-avatar">
                    ${guest.profile_photo_url
          ? `<img src="${guest.profile_photo_url}" alt="${guest.full_name}">`
          : initials}
                  </div>
                  <div class="guest-info">
                    <h3>${guest.full_name || 'Onbekende Gast'}</h3>
                    <div class="title">${guest.job_title || '-'} ${guest.research_company || guest.company ? `bij ${guest.research_company || guest.company}` : ''}</div>
                    <div class="meta">${guest.country || ''} ${guest.industry ? `• ${guest.industry}` : ''}</div>
                  </div>
                  <div class="vip-score">
                    <div class="score ${vipClass}">${vipScore}/10</div>
                    <div class="label">VIP Score</div>
                  </div>
                </div>
                ${summary ? `
                  <div class="guest-card-body">
                    <div class="notable-info">
                      ${summary.substring(0, 300)}${summary.length > 300 ? '...' : ''}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
    }).join('')}
        </div>
        
        <div class="footer">
          Gegenereerd door VIP Guest Research Tool op ${new Date().toLocaleDateString('nl-NL')} om ${new Date().toLocaleTimeString('nl-NL')}
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PDFGenerator();
