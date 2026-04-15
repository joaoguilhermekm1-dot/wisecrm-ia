const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportService {
  /**
   * Gera um Relatório Executivo em PDF.
   */
  async generateExecutiveReport(data, outputPath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });

      // Pipe do PDF para um arquivo
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header Premium
      doc
        .fillColor('#3b82f6')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('WISE CRM IA - RELATÓRIO EXECUTIVO', { align: 'center' });
      
      doc.moveDown();
      doc
        .fillColor('#64748b')
        .fontSize(10)
        .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });

      doc.moveDown(2);

      // Seção 1: Performance de Vendas
      this.drawSectionHeader(doc, '1. PERFORMANCE DE VENDAS');
      doc.fontSize(12).fillColor('#1e293b');
      doc.text(`Total de Leads Capitados: ${data.totalLeads}`);
      doc.text(`Novos Negócios: ${data.newBusiness}`);
      doc.moveDown();

      // Seção 2: Marketing (Meta Ads)
      this.drawSectionHeader(doc, '2. INVESTIMENTO EM MARKETING');
      doc.fontSize(12).fillColor('#1e293b');
      doc.text(`Investimento Total: R$ ${data.adsSpend.toFixed(2)}`);
      doc.text(`Custo Médio por Lead: R$ ${data.cpl.toFixed(2)}`);
      doc.moveDown();

      // Seção 3: Insights do Cérebro (IA)
      this.drawSectionHeader(doc, '3. INSIGHTS DO CÉREBRO (IA)');
      doc
        .fillColor('#4f46e5')
        .font('Helvetica-Oblique')
        .fontSize(11)
        .text(data.aiInsight, { lineGap: 5 });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    });
  }

  drawSectionHeader(doc, title) {
    doc
      .rect(50, doc.y, 500, 20)
      .fill('#f1f5f9');
    
    doc
      .fillColor('#1e293b')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(title, 60, doc.y - 15);
    
    doc.moveDown();
  }
}

module.exports = new ReportService();
