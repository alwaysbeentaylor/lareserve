const PDFDocument = require('pdfkit');

/**
 * PDF Generator Service using PDFKit
 * Generates professional PDF reports for guests without requiring a browser
 */

class PDFGenerator {
  constructor() {
    this.primaryColor = '#1a365d';
    this.accentColor = '#c9a227';
    this.textColor = '#2d3748';
    this.lightGray = '#718096';
  }

  // Generate PDF for a single guest
  async generateGuestReport({ guest, research, reservations, suggestions }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.addHeader(doc, 'Gastprofiel');
        this.addGuestInfo(doc, guest, research);

        if (research) {
          this.addResearchSection(doc, research);
        }

        if (reservations && reservations.length > 0) {
          this.addReservationsSection(doc, reservations);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate bulk PDF for multiple guests (import batch)
  async generateBulkReport(guests, batchId) {
    return this.generateDailyReport(guests, batchId);
  }

  // Generate daily arrival report
  async generateDailyReport(guests, date) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, `VIP Gastenoverzicht`);

        doc.fontSize(12)
          .fillColor(this.lightGray)
          .text(`Datum: ${date}`, 40, 90)
          .text(`Aantal gasten: ${guests.length}`, 40, 105);

        doc.moveDown(2);

        // Summary table
        this.addSummaryTable(doc, guests);

        // Individual guest profiles
        for (let i = 0; i < guests.length; i++) {
          const guest = guests[i];

          // Add page break if needed
          if (doc.y > 650) {
            doc.addPage();
          }

          this.addGuestCard(doc, guest, i + 1);
        }

        // Footer on last page
        doc.fontSize(8)
          .fillColor(this.lightGray)
          .text(
            `Gegenereerd op ${new Date().toLocaleDateString('nl-NL')} om ${new Date().toLocaleTimeString('nl-NL')}`,
            40,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc, title) {
    // Gold accent bar
    doc.rect(0, 0, doc.page.width, 8)
      .fill(this.accentColor);

    // Title
    doc.fontSize(24)
      .fillColor(this.primaryColor)
      .font('Helvetica-Bold')
      .text(title, 40, 30);

    // Subtitle
    doc.fontSize(10)
      .fillColor(this.lightGray)
      .font('Helvetica')
      .text('La Réserve - VIP Research Tool', 40, 60);
  }

  addGuestInfo(doc, guest, research) {
    const y = 130;

    doc.fontSize(16)
      .fillColor(this.primaryColor)
      .font('Helvetica-Bold')
      .text(guest.full_name || 'Onbekende gast', 40, y);

    let infoY = y + 25;

    if (research?.job_title) {
      doc.fontSize(11)
        .fillColor(this.textColor)
        .font('Helvetica')
        .text(research.job_title, 40, infoY);
      infoY += 18;
    }

    if (research?.research_company || guest.company) {
      doc.fontSize(10)
        .fillColor(this.lightGray)
        .text(research?.research_company || guest.company, 40, infoY);
      infoY += 18;
    }

    if (guest.country) {
      doc.fontSize(10)
        .fillColor(this.lightGray)
        .text(`📍 ${guest.country}`, 40, infoY);
      infoY += 18;
    }

    // VIP Score badge
    if (research?.vip_score) {
      const score = research.vip_score;
      const badgeColor = score >= 8 ? '#48bb78' : score >= 5 ? '#ecc94b' : '#fc8181';

      doc.rect(doc.page.width - 100, y, 60, 30)
        .fill(badgeColor);

      doc.fontSize(16)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text(`${score}/10`, doc.page.width - 95, y + 8);
    }

    doc.moveDown(2);
  }

  addResearchSection(doc, research) {
    const startY = doc.y + 20;

    doc.fontSize(14)
      .fillColor(this.primaryColor)
      .font('Helvetica-Bold')
      .text('Onderzoeksresultaten', 40, startY);

    let y = startY + 25;

    // Industry
    if (research.industry) {
      y = this.addInfoRow(doc, 'Industrie', research.industry, y);
    }

    // Influence level
    if (research.influence_level) {
      y = this.addInfoRow(doc, 'Invloedsniveau', research.influence_level, y);
    }

    // LinkedIn
    if (research.linkedin_url) {
      y = this.addInfoRow(doc, 'LinkedIn', research.linkedin_url, y);
    }

    // Notable info
    if (research.notable_info) {
      doc.fontSize(12)
        .fillColor(this.primaryColor)
        .font('Helvetica-Bold')
        .text('Opmerkelijke informatie:', 40, y + 10);

      doc.fontSize(10)
        .fillColor(this.textColor)
        .font('Helvetica')
        .text(research.notable_info, 40, y + 28, { width: 500 });
    }

    doc.moveDown(2);
  }

  addReservationsSection(doc, reservations) {
    if (doc.y > 600) doc.addPage();

    const startY = doc.y + 20;

    doc.fontSize(14)
      .fillColor(this.primaryColor)
      .font('Helvetica-Bold')
      .text('Reserveringsgeschiedenis', 40, startY);

    let y = startY + 25;

    for (const res of reservations.slice(0, 5)) {
      doc.fontSize(10)
        .fillColor(this.textColor)
        .font('Helvetica')
        .text(`${res.check_in_date} - ${res.check_out_date}`, 40, y);

      if (res.room_number) {
        doc.text(`Kamer: ${res.room_number}`, 200, y);
      }
      y += 18;
    }
  }

  addInfoRow(doc, label, value, y) {
    doc.fontSize(10)
      .fillColor(this.lightGray)
      .font('Helvetica-Bold')
      .text(`${label}:`, 40, y);

    doc.fontSize(10)
      .fillColor(this.textColor)
      .font('Helvetica')
      .text(value, 140, y, { width: 400 });

    return y + 18;
  }

  addSummaryTable(doc, guests) {
    const startY = doc.y;
    const colWidths = [30, 150, 120, 80, 70, 60];
    const headers = ['#', 'Naam', 'Functie', 'Bedrijf', 'Land', 'VIP'];

    // Header row
    doc.rect(40, startY, 515, 25)
      .fill(this.primaryColor);

    let x = 45;
    doc.fontSize(9)
      .fillColor('#ffffff')
      .font('Helvetica-Bold');

    headers.forEach((header, i) => {
      doc.text(header, x, startY + 8);
      x += colWidths[i];
    });

    // Data rows
    let y = startY + 25;
    const vipGuests = guests.filter(g => g.vip_score >= 7);
    const displayGuests = vipGuests.length > 0 ? vipGuests.slice(0, 10) : guests.slice(0, 10);

    displayGuests.forEach((guest, index) => {
      const isEven = index % 2 === 0;
      doc.rect(40, y, 515, 22)
        .fill(isEven ? '#f7fafc' : '#ffffff');

      x = 45;
      doc.fontSize(8)
        .fillColor(this.textColor)
        .font('Helvetica');

      const rowData = [
        (index + 1).toString(),
        (guest.full_name || '').substring(0, 25),
        (guest.job_title || '-').substring(0, 20),
        (guest.research_company || guest.company || '-').substring(0, 15),
        (guest.country || '-').substring(0, 12),
        guest.vip_score ? `${guest.vip_score}/10` : '-'
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x, y + 6);
        x += colWidths[i];
      });

      y += 22;
    });

    if (guests.length > 10) {
      doc.fontSize(9)
        .fillColor(this.lightGray)
        .text(`... en ${guests.length - 10} meer gasten`, 40, y + 5);
    }

    doc.y = y + 30;
  }

  addGuestCard(doc, guest, index) {
    const startY = doc.y + 10;
    const cardHeight = 100;

    // Card background
    doc.rect(40, startY, 515, cardHeight)
      .fill('#f8f9fa')
      .stroke('#e2e8f0');

    // VIP Score indicator
    const score = guest.vip_score || 0;
    const scoreColor = score >= 8 ? '#48bb78' : score >= 5 ? '#ecc94b' : '#e53e3e';
    doc.rect(40, startY, 5, cardHeight)
      .fill(scoreColor);

    // Guest name and number
    doc.fontSize(12)
      .fillColor(this.primaryColor)
      .font('Helvetica-Bold')
      .text(`${index}. ${guest.full_name || 'Onbekende gast'}`, 55, startY + 10);

    // VIP badge
    doc.fontSize(10)
      .fillColor(scoreColor)
      .font('Helvetica-Bold')
      .text(`VIP: ${score}/10`, 480, startY + 10);

    // Job title & company
    const subtitle = [guest.job_title, guest.research_company || guest.company]
      .filter(Boolean)
      .join(' bij ');

    if (subtitle) {
      doc.fontSize(10)
        .fillColor(this.textColor)
        .font('Helvetica')
        .text(subtitle.substring(0, 70), 55, startY + 28);
    }

    // Country and industry
    const details = [guest.country, guest.industry].filter(Boolean).join(' • ');
    if (details) {
      doc.fontSize(9)
        .fillColor(this.lightGray)
        .text(details, 55, startY + 45);
    }

    // Notable info (truncated)
    if (guest.notable_info) {
      const truncated = guest.notable_info.substring(0, 150) +
        (guest.notable_info.length > 150 ? '...' : '');
      doc.fontSize(8)
        .fillColor(this.textColor)
        .text(truncated, 55, startY + 62, { width: 480 });
    }

    doc.y = startY + cardHeight + 5;
  }
}

module.exports = new PDFGenerator();
