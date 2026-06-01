import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const {
      orderId,
      customerName,
      email,
      courierPartner,
      awbNumber,
      totalAmount,
      items,
      address,
    } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    }

    if (!courierPartner || !awbNumber) {
      return NextResponse.json({ error: 'Courier and AWB are required' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemsHtml = (items || []).map((item: any) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #1a2a1a;">
          <span style="font-weight:600;color:#fff;">${item.name}</span><br/>
          <small style="color:#9ca3af;">
            ${item.flavor ? `Flavor: ${item.flavor}` : ''}
            ${item.unit ? ` | Size: ${item.unit}` : ''}
            ${item.isPromo ? ' <span style="color:#22c55e;">Free Gift</span>' : ''}
          </small>
        </td>
        <td style="padding:10px;border-bottom:1px solid #1a2a1a;text-align:center;color:#d1d5db;">×${item.quantity || 1}</td>
        <td style="padding:10px;border-bottom:1px solid #1a2a1a;text-align:right;color:#4ade80;font-weight:700;">
          ${item.isPromo ? 'FREE' : `₹${(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}`}
        </td>
      </tr>
    `).join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0f0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="text-align:center;padding:32px 24px;background:linear-gradient(135deg,#052e16,#064e3b);border-radius:20px 20px 0 0;border:1px solid #14532d;">
      <div style="display:inline-block;background:#16a34a;color:#fff;font-weight:900;font-size:20px;padding:10px 20px;border-radius:12px;letter-spacing:2px;margin-bottom:12px;">NVA</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">Your Order is on the Way! 🚚</h1>
      <p style="color:#86efac;margin:8px 0 0;font-size:14px;">Your package has been shipped and is heading to you.</p>
    </div>

    <!-- Main Card -->
    <div style="background:#0d1a0d;border:1px solid #14532d;border-top:0;border-radius:0 0 20px 20px;padding:32px 24px;">

      <p style="color:#d1d5db;font-size:15px;margin:0 0 24px;">
        Hi <strong style="color:#fff;">${customerName}</strong>,<br/>
        Great news — your NVA Nutrition order has been shipped! Here are your tracking details:
      </p>

      <!-- Tracking Box -->
      <div style="background:linear-gradient(135deg,#1a0533,#0c1f3a);border:1px solid #6d28d9;border-radius:16px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 16px;color:#c4b5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">📦 Tracking Information</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:6px 0;">Order ID</td>
            <td style="color:#fff;font-weight:700;font-family:monospace;text-align:right;font-size:13px;">${orderId}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:6px 0;">Courier Partner</td>
            <td style="color:#c4b5fd;font-weight:800;text-align:right;font-size:14px;">${courierPartner}</td>
          </tr>
          <tr>
            <td style="color:#9ca3af;font-size:13px;padding:6px 0;">AWB / Tracking No.</td>
            <td style="color:#a78bfa;font-weight:900;font-family:monospace;text-align:right;font-size:16px;letter-spacing:1px;">${awbNumber}</td>
          </tr>
        </table>
        <div style="margin-top:16px;padding:12px;background:rgba(109,40,217,0.15);border-radius:10px;text-align:center;">
          <p style="margin:0;color:#c4b5fd;font-size:12px;">Use the AWB number above to track your shipment on the <strong>${courierPartner}</strong> website or app.</p>
        </div>
      </div>

      <!-- Delivery Address -->
      ${address ? `
      <div style="background:#111b11;border:1px solid #1a2e1a;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">📍 Delivering To</p>
        <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.6;">
          ${address.address || ''}<br/>
          ${address.city || ''}, ${address.state || ''} – ${address.pinCode || ''}
        </p>
      </div>` : ''}

      <!-- Order Summary -->
      <div style="margin-bottom:24px;">
        <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🛒 Order Summary</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#111b11;">
              <th style="padding:10px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Item</th>
              <th style="padding:10px;text-align:center;color:#6b7280;font-size:11px;text-transform:uppercase;">Qty</th>
              <th style="padding:10px;text-align:right;color:#6b7280;font-size:11px;text-transform:uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:14px 10px;text-align:right;font-weight:800;color:#fff;font-size:15px;border-top:2px solid #14532d;">Total Paid</td>
              <td style="padding:14px 10px;text-align:right;font-weight:900;color:#4ade80;font-size:18px;border-top:2px solid #14532d;font-family:monospace;">₹${Number(totalAmount || 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Help -->
      <div style="background:#111b11;border:1px solid #1a2e1a;border-radius:12px;padding:16px;text-align:center;">
        <p style="margin:0;color:#6b7280;font-size:13px;">
          Questions? Reply to this email or contact us at<br/>
          <a href="mailto:${process.env.EMAIL_USER || 'support@nvanutrition.com'}" style="color:#22c55e;text-decoration:none;font-weight:600;">${process.env.EMAIL_USER || 'support@nvanutrition.com'}</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #1a2e1a;">
        <p style="margin:0;color:#374151;font-size:12px;">© 2025 NVA Nutrition. All rights reserved.</p>
        <p style="margin:4px 0 0;color:#374151;font-size:11px;">Premium sports nutrition for serious athletes.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"NVA Nutrition 🌿" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🚚 Shipped! Your Order ${orderId} is on the Way — ${courierPartner} | AWB: ${awbNumber}`,
      html: htmlBody,
    });

    return NextResponse.json({ success: true, message: 'Shipping email sent' });
  } catch (error: any) {
    console.error('Send shipping email error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
