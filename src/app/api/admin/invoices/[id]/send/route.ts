import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Invoice from '@/lib/db/models/Invoice';
import { generateInvoicePDF } from '@/lib/invoices/generatePDF';
import { sendEmail } from '@/lib/mail';
import { verifyAuth } from '@/lib/auth/middleware';

// POST — Send invoice via email
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      date: new Date(invoice.createdAt).toLocaleDateString('en-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString('en-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : undefined,
      customer: invoice.customer,
      items: invoice.items,
      subtotal: invoice.subtotal,
      vatRate: invoice.vatRate,
      vatAmount: invoice.vatAmount,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      notes: invoice.notes,
      status: invoice.status,
    });

    // Send email with PDF attached
    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
    
    <!-- Header -->
    <div style="background:#0A1628;padding:32px 40px;text-align:center">
      <h1 style="color:#C5A059;margin:0;font-size:24px;letter-spacing:2px">SAUDI HORIZON</h1>
      <p style="color:#8B9DB8;margin:8px 0 0;font-size:12px;letter-spacing:1px">Heavy Equipment Parts Supplier</p>
    </div>
    
    <!-- Content -->
    <div style="padding:40px">
      <h2 style="color:#0A1628;margin:0 0 8px;font-size:20px">Invoice ${invoice.invoiceNumber}</h2>
      <p style="color:#6B7280;margin:0 0 24px;font-size:14px;line-height:1.6">
        Dear ${invoice.customer.name},<br><br>
        Please find your invoice attached to this email. Below is a summary:
      </p>
      
      <!-- Summary Box -->
      <div style="background:#F8F9FA;border-radius:8px;padding:24px;margin-bottom:24px;border-left:4px solid #C5A059">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:6px 0;color:#6B7280">Invoice Number</td>
            <td style="padding:6px 0;color:#0A1628;font-weight:bold;text-align:right">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6B7280">Subtotal</td>
            <td style="padding:6px 0;color:#0A1628;text-align:right">${invoice.currency} ${invoice.subtotal.toLocaleString('en-SA', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6B7280">VAT (${invoice.vatRate}%)</td>
            <td style="padding:6px 0;color:#0A1628;text-align:right">${invoice.currency} ${invoice.vatAmount.toLocaleString('en-SA', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 6px;color:#0A1628;font-weight:bold;font-size:16px;border-top:2px solid #C5A059">Total Amount</td>
            <td style="padding:12px 0 6px;color:#C5A059;font-weight:bold;font-size:18px;text-align:right;border-top:2px solid #C5A059">${invoice.currency} ${invoice.totalAmount.toLocaleString('en-SA', { minimumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>
      
      ${invoice.dueDate ? `<p style="color:#6B7280;font-size:13px;margin:0 0 24px"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
      
      <div style="text-align:center;margin:32px 0 40px">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoice/${invoice._id}" 
           style="background:#C5A059;color:#0A1628;padding:16px 40px;text-decoration:none;border-radius:12px;font-weight:bold;display:inline-block;box-shadow:0 8px 20px rgba(197,160,89,0.3);letter-spacing:1px;text-transform:uppercase;font-size:14px">
          Pay Invoice Now
        </a>
      </div>

      <p style="color:#6B7280;font-size:13px;margin:0;line-height:1.6">
        If you have any questions regarding this invoice, please don't hesitate to contact us.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background:#F8F9FA;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB">
      <p style="color:#9CA3AF;font-size:11px;margin:0">© ${new Date().getFullYear()} Saudi Horizon. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const result = await sendEmail({
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} - Saudi Horizon`,
      html: emailHtml,
      attachments: [{
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    if (result.success) {
      // Update invoice status to sent
      invoice.status = 'sent';
      invoice.sentAt = new Date();
      await invoice.save();

      return NextResponse.json({
        message: `Invoice sent to ${invoice.customer.email}`,
        invoice,
      });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
