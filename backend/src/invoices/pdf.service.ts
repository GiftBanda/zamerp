import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tenant = invoice.tenant;
      const customer = invoice.customer;

      // ── Color palette ──────────────────────────────
      const PRIMARY = '#1a56db';
      const DARK = '#111827';
      const GRAY = '#6b7280';
      const LIGHT_GRAY = '#f3f4f6';
      const GREEN = '#059669';
      const RED = '#dc2626';

      const pageWidth = doc.page.width - 100; // accounting for margins

      // ── HEADER ─────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 140).fill(PRIMARY);

      // Company name
      doc.fillColor('white').font('Helvetica-Bold').fontSize(24)
        .text(tenant?.name || 'Company Name', 50, 30, { width: 350 });

      // ZRA badge
      doc.rect(doc.page.width - 170, 20, 120, 30).fill('#059669');
      doc.fillColor('white').font('Helvetica-Bold').fontSize(10)
        .text('ZRA COMPLIANT', doc.page.width - 168, 29, { width: 116, align: 'center' });

      // Company details
      doc.font('Helvetica').fontSize(9).fillColor('#dbeafe');
      if (tenant?.address) doc.text(tenant.address, 50, 62);
      if (tenant?.phone) doc.text(`Tel: ${tenant.phone}`, 50, 74);
      if (tenant?.email) doc.text(`Email: ${tenant.email}`, 50, 86);
      if (tenant?.tpin) doc.text(`TPIN: ${tenant.tpin}`, 50, 98);
      if (tenant?.vrn) doc.text(`VRN: ${tenant.vrn}`, 50, 110);

      // ── INVOICE TITLE ──────────────────────────────
      doc.rect(0, 140, doc.page.width, 60).fill(LIGHT_GRAY);
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(28)
        .text('TAX INVOICE', 50, 152);
      doc.fillColor(GRAY).font('Helvetica').fontSize(11)
        .text(invoice.invoiceNumber, 50, 183);

      // ── ZRA INFO BOX ───────────────────────────────
      doc.rect(doc.page.width - 220, 148, 170, 44).fill('white').stroke('#e5e7eb');
      doc.fillColor(GRAY).font('Helvetica').fontSize(7)
        .text('ZRA FISCAL INVOICE NO.', doc.page.width - 215, 152);
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9)
        .text(invoice.zraInvoiceNumber || 'N/A', doc.page.width - 215, 162);
      doc.fillColor(GRAY).font('Helvetica').fontSize(7)
        .text('VERIFICATION CODE', doc.page.width - 215, 174);
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(9)
        .text(invoice.zraVerificationCode || 'N/A', doc.page.width - 215, 184);

      let y = 220;

      // ── BILL TO / INVOICE DETAILS ──────────────────
      // Bill To
      doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(8)
        .text('BILL TO', 50, y);
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(12)
        .text(customer?.name || '', 50, y + 12);
      doc.font('Helvetica').fontSize(9).fillColor(GRAY);
      if (customer?.address) doc.text(customer.address, 50, y + 28);
      if (customer?.phone) doc.text(customer.phone, 50, y + 40);
      if (customer?.email) doc.text(customer.email, 50, y + 52);
      if (customer?.tpin) {
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9)
          .text(`Customer TPIN: ${customer.tpin}`, 50, y + 64);
      }

      // Invoice details column
      const detailX = 380;
      const detailW = pageWidth - detailX + 50;

      const addDetail = (label: string, value: string, dy: number, valueColor = DARK) => {
        doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(label, detailX, y + dy);
        doc.fillColor(valueColor).font('Helvetica-Bold').fontSize(9)
          .text(value, detailX + 80, y + dy, { width: detailW - 80 });
      };

      addDetail('Invoice No:', invoice.invoiceNumber, 0);
      addDetail('Issue Date:', formatDate(invoice.issueDate), 16);
      if (invoice.dueDate) addDetail('Due Date:', formatDate(invoice.dueDate), 32);

      const statusColor = {
        draft: GRAY, sent: PRIMARY, paid: GREEN, overdue: RED, void: RED,
      }[invoice.status] || DARK;

      addDetail('Status:', (invoice.status || '').toUpperCase(), 48, statusColor);

      y += 100;

      // ── LINE ITEMS TABLE ───────────────────────────
      // Header
      doc.rect(50, y, pageWidth, 22).fill(PRIMARY);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(8);

      const cols = { desc: 50, qty: 280, price: 340, vat: 400, total: 460 };
      doc.text('DESCRIPTION', cols.desc + 5, y + 7);
      doc.text('QTY', cols.qty, y + 7, { width: 50, align: 'right' });
      doc.text('UNIT PRICE', cols.price, y + 7, { width: 55, align: 'right' });
      doc.text('VAT %', cols.vat, y + 7, { width: 50, align: 'right' });
      doc.text('TOTAL', cols.total, y + 7, { width: 90, align: 'right' });

      y += 22;

      // Items
      const items = invoice.items || [];
      items.forEach((item: any, idx: number) => {
        const rowH = 24;
        const bg = idx % 2 === 0 ? 'white' : LIGHT_GRAY;
        doc.rect(50, y, pageWidth, rowH).fill(bg);

        doc.fillColor(DARK).font('Helvetica').fontSize(8);
        doc.text(item.description, cols.desc + 5, y + 7, { width: 220 });
        doc.text(formatNum(item.quantity), cols.qty, y + 7, { width: 50, align: 'right' });
        doc.text(formatCurrency(item.unitPrice), cols.price, y + 7, { width: 55, align: 'right' });
        doc.text(`${formatNum(item.vatRate)}%`, cols.vat, y + 7, { width: 50, align: 'right' });
        doc.fillColor(DARK).font('Helvetica-Bold')
          .text(formatCurrency(item.total), cols.total, y + 7, { width: 90, align: 'right' });

        y += rowH;
      });

      y += 10;

      // ── TOTALS ─────────────────────────────────────
      const totX = 380;
      const totW = pageWidth - totX + 55;

      const addTotal = (label: string, value: string, dy: number, bold = false, color = DARK) => {
        doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(label, totX, y + dy);
        doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
          .text(value, totX, y + dy, { width: totW, align: 'right' });
      };

      doc.moveTo(totX, y).lineTo(totX + totW, y).stroke('#e5e7eb');
      addTotal('Subtotal:', formatCurrency(invoice.subtotal), 8);
      if (Number(invoice.discountAmount) > 0) {
        addTotal(`Discount (${invoice.discountPercent}%):`, `-${formatCurrency(invoice.discountAmount)}`, 24, false, RED);
      }
      addTotal('VAT (16%):', formatCurrency(invoice.vatAmount), 40);

      // Total box
      doc.rect(totX - 5, y + 55, totW + 5, 28).fill(PRIMARY);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(11)
        .text('TOTAL (ZMW):', totX, y + 63);
      doc.text(formatCurrency(invoice.total), totX, y + 63, { width: totW, align: 'right' });

      y += 95;

      // ── NOTES & TERMS ──────────────────────────────
      if (invoice.notes || invoice.terms) {
        doc.rect(50, y, pageWidth, 1).fill('#e5e7eb');
        y += 10;
        if (invoice.notes) {
          doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9).text('Notes:', 50, y);
          doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(invoice.notes, 50, y + 12, { width: pageWidth });
          y += 30;
        }
        if (invoice.terms) {
          doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9).text('Terms & Conditions:', 50, y);
          doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(invoice.terms, 50, y + 12, { width: pageWidth });
        }
      }

      // ── FOOTER ─────────────────────────────────────
      const footerY = doc.page.height - 70;
      doc.rect(0, footerY, doc.page.width, 70).fill(LIGHT_GRAY);
      doc.rect(0, footerY, doc.page.width, 2).fill(PRIMARY);

      doc.fillColor(GRAY).font('Helvetica').fontSize(7)
        .text(
          'This is a computer-generated invoice. No signature required. | Generated by ZamERP | Zambia Revenue Authority Compliant',
          50, footerY + 15, { width: pageWidth, align: 'center' },
        );

      if (tenant?.tpin) {
        doc.text(
          `TPIN: ${tenant.tpin}${tenant.vrn ? ` | VRN: ${tenant.vrn}` : ''}`,
          50, footerY + 28, { width: pageWidth, align: 'center' },
        );
      }

      doc.end();
    });
  }
}

function formatDate(d: any): string {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-ZM', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCurrency(v: any): string {
  return `ZMW ${Number(v || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNum(v: any): string {
  return Number(v || 0).toString();
}
