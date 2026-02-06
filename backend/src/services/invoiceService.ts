/**
 * Generate PDF invoices for approved payments. Used when Super Admin confirms a manual payment.
 */

import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import type { PrismaClient } from '@prisma/client';

const PLATFORM_NAME = 'AfriLaunch Hub';

export interface ManualPaymentWithUser {
  id: string;
  amount: import('@prisma/client').Decimal;
  currency: string;
  paymentType: string;
  status: string;
  submittedAt: Date;
  confirmedAt: Date | null;
  user: { name: string; email: string };
}

/** Generate PDF invoice for a manual payment; returns buffer and suggested filename. */
export async function generateInvoicePDF(
  payment: ManualPaymentWithUser
): Promise<{ buffer: Buffer; fileName: string }> {
  const chunks: Buffer[] = [];
  const stream = new PassThrough();
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  doc.fontSize(20).text(PLATFORM_NAME, { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(`Invoice #${payment.id.slice(0, 8).toUpperCase()}`);
  doc.fontSize(10).text(`Date: ${(payment.confirmedAt || payment.submittedAt).toLocaleDateString()}`);
  doc.moveDown();
  doc.text(`Bill to: ${payment.user.name}`);
  doc.text(`Email: ${payment.user.email}`);
  doc.moveDown();
  doc.text(`Amount: ${Number(payment.amount).toLocaleString()} ${payment.currency}`);
  doc.text(`Payment type: ${payment.paymentType}`);
  doc.text(`Status: ${payment.status}`);
  doc.moveDown();
  doc.fontSize(10).text('Thank you for supporting AfriLaunch Hub.', { align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('end', () => resolve({ buffer: Buffer.concat(chunks), fileName: `invoice_${payment.id.slice(0, 8)}.pdf` }));
    stream.on('error', reject);
  });
}

/** Load manual payment with user and return invoice buffer + filename. For use after confirm. */
export async function generateInvoiceForPayment(
  prisma: PrismaClient,
  paymentId: string
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const payment = await prisma.manualPayment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!payment || payment.status !== 'Confirmed') return null;
  return generateInvoicePDF(payment as ManualPaymentWithUser);
}
