import PDFDocument from 'pdfkit';
import {
  SUBMISSION_TYPE_LABELS,
  type CertificateDto,
  type SubmissionType,
} from '@impactalign/types';

const day = (iso: string) => iso.slice(0, 10);

/** Renders the certificate as a one-page A4 PDF. Deterministic: same input, same content. */
export function renderCertificatePdf(cert: CertificateDto, verifyUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 56,
      info: { Title: `Certificate ${cert.certificateNumber}`, Author: 'ImpactAlign SDG' },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = doc.page.width;
    const inner = width - 112;
    doc
      .lineWidth(2)
      .rect(28, 28, width - 56, doc.page.height - 56)
      .stroke('#0b2545');

    doc.font('Helvetica-Bold').fontSize(26).fillColor('#0b2545');
    doc.text('Certificate of SDG Alignment Verification', 56, 110, {
      width: inner,
      align: 'center',
    });

    doc.moveDown(1.5).font('Helvetica').fontSize(12).fillColor('#333333');
    doc.text('This certifies that the submission below was reviewed by a person on the', {
      width: inner,
      align: 'center',
    });
    doc.text('ImpactAlign SDG platform and verified against the Sustainable Development Goals.', {
      width: inner,
      align: 'center',
    });

    doc.moveDown(2).font('Helvetica-Bold').fontSize(20).fillColor('#0b2545');
    doc.text(cert.title, { width: inner, align: 'center' });

    const label =
      SUBMISSION_TYPE_LABELS[cert.submissionType as SubmissionType] ?? cert.submissionType;
    const sdgs = cert.sdgNumbers.map((n) => `SDG ${n}`).join(', ') || 'None';
    const row = (name: string, value: string) => {
      doc.moveDown(0.6).font('Helvetica-Bold').fontSize(11).fillColor('#0b2545');
      doc.text(name, { width: inner, align: 'center', continued: false });
      doc.font('Helvetica').fontSize(12).fillColor('#222222');
      doc.text(value, { width: inner, align: 'center' });
    };

    doc.moveDown(1.5);
    row('Submission code', cert.code);
    row('Submission type', label);
    row('Goals', sdgs);
    row('Certificate number', cert.certificateNumber);
    row('Issued', day(cert.issuedAt));
    row('Valid until', day(cert.expiresAt));

    doc.moveDown(2).font('Helvetica').fontSize(10).fillColor('#444444');
    doc.text('Verify this certificate online:', { width: inner, align: 'center' });
    doc.fillColor('#0b2545').text(verifyUrl, { width: inner, align: 'center' });

    doc.moveDown(2).fontSize(8).fillColor('#666666');
    doc.text(
      'The final decision was made by a human assessor. This certificate is not an endorsement by the United Nations.',
      { width: inner, align: 'center' },
    );

    doc.end();
  });
}
