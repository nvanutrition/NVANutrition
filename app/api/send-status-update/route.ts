import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, customerName, email, status, items, totalAmount, reason } = body;

    if (!email) return NextResponse.json({ error: 'No email provided' }, { status: 400 });

    const isCancelled = status === 'Cancelled';
    const isRTO = status === 'RTO';
    const isDelivered = status === 'Delivered';

    const headerTitle = isCancelled ? 'Order Cancelled' : isRTO ? 'Order Returned (RTO)' : 'Order Delivered!';
    const headerColor = isCancelled ? '#dc2626' : isRTO ? '#d97706' : '#111827';
    const bgHeaderIcon = isCancelled ? '#fee2e2' : isRTO ? '#fef3c7' : '#ecfdf5';
    const iconColor = isCancelled ? '#dc2626' : isRTO ? '#d97706' : '#10b981';
    const iconText = isCancelled ? '✕' : isRTO ? '↩' : '✓';

    let messageDesc = '';
    if (isCancelled) {
      messageDesc = `We're writing to let you know that your order <strong>${orderId}</strong> has been cancelled.`;
      if (reason) messageDesc += ` Reason: ${reason}`;
      messageDesc += ` If you have already paid for this order, the refund will be processed to your original payment method within 5-7 business days.`;
    } else if (isRTO) {
      messageDesc = `Your order <strong>${orderId}</strong> was returned to our warehouse (RTO) because the delivery could not be completed successfully.`;
      messageDesc += ` If you already paid for this order, the refund will be initiated to your original payment method.`;
    } else if (isDelivered) {
      messageDesc = `Great news! Your order <strong>${orderId}</strong> has been successfully delivered to your shipping address.`;
      messageDesc += ` Time to unbox the gains! We hope you love your new supplements.`;
    }

    const itemsHtml = (items || []).map((item: any) => `
    <tr>
      <td style="padding:16px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <div style="font-weight:800;color:#111827;font-size:14px;margin-bottom:6px;line-height:1.4;">${item.name}</div>
        <div style="color:#6b7280;font-size:12px;">
          ${item.flavor ? `<span style="display:inline-block;background:#f3f4f6;color:#4b5563;padding:4px 10px;border-radius:20px;margin-right:6px;margin-bottom:4px;font-size:11px;font-weight:700;">${item.flavor}</span>` : ''}
          ${item.isPromo ? `<span style="display:inline-block;background:#ecfdf5;color:#059669;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;border:1px solid #d1fae5;">🎁 Promo Item</span>` : ''}
        </div>
      </td>
      <td style="padding:16px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#4b5563;font-size:14px;font-weight:700;vertical-align:top;">
        ×${item.quantity || 1}
      </td>
      <td style="padding:16px 12px;border-bottom:1px solid #f3f4f6;text-align:right;vertical-align:top;">
        ${item.price > 0
          ? `<span style="color:#111827;font-weight:800;font-size:15px;font-family:monospace;">₹${(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>`
          : `<span style="color:#059669;font-weight:800;font-size:14px;">FREE</span>`
        }
      </td>
    </tr>
    `).join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Order Update — NVA Nutrition</title></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:600px;margin:0 auto;padding:32px 16px 48px;">

    <!-- Header -->
    <div style="background:#ffffff;border-radius:24px 24px 0 0;border:1px solid #e5e7eb;border-bottom:0;padding:40px 28px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;background:#111827;color:#ffffff;font-weight:900;font-size:18px;padding:10px 24px;border-radius:12px;letter-spacing:2px;margin-bottom:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">NVA NUTRITION</div>
      <div style="display:inline-block;background:${bgHeaderIcon};border-radius:50%;padding:16px;margin-bottom:20px;">
        <div style="width:40px;height:40px;background:${iconColor};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">
          <span style="color:#fff;font-size:22px;font-weight:bold;">${iconText}</span>
        </div>
      </div>
      <h1 style="color:${headerColor};margin:0 0 8px;font-size:28px;font-weight:900;letter-spacing:-0.5px;">${headerTitle}</h1>
      <p style="color:#6b7280;margin:0;font-size:15px;font-weight:500;">Order Reference: <strong style="color:#111827;font-family:monospace;">${orderId}</strong></p>
    </div>

    <!-- Body Card -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 24px 24px;padding:0 32px 32px;">

      <!-- Greeting -->
      <p style="color:#374151;font-size:16px;margin:0 0 8px;padding-top:10px;">Hi <strong style="color:#111827;">${customerName}</strong>,</p>
      <p style="color:#6b7280;font-size:15px;margin:0 0 28px;line-height:1.6;">${messageDesc}</p>

      <!-- Items Table -->
      <div style="margin-bottom:28px;">
        <p style="color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🛒 ${isDelivered ? 'Delivered Items' : 'Order Items'}</p>
        <table style="width:100%;border-collapse:collapse;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:14px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:800;">Product</th>
              <th style="padding:14px 12px;text-align:center;color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:800;">Qty</th>
              <th style="padding:14px 12px;text-align:right;color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:800;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr style="background:#f9fafb;">
              <td colspan="2" style="padding:20px 12px;text-align:right;font-weight:900;color:#111827;font-size:15px;border-top:1px solid #e5e7eb;">Total Order Value</td>
              <td style="padding:20px 12px;text-align:right;font-weight:900;color:#111827;font-size:20px;font-family:monospace;border-top:1px solid #e5e7eb;">₹${Number(totalAmount || 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      ${isDelivered ? `
      <!-- Review CTA -->
      <div style="background:#ecfdf5;border:1px solid #d1fae5;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
        <h3 style="color:#059669;font-size:18px;font-weight:900;margin:0 0 10px;">How did we do?</h3>
        <p style="color:#374151;font-size:14px;margin:0 0 16px;line-height:1.5;">We would love to hear your feedback! Share your experience and help others make the best choice.</p>
        <a href="https://nvanutrition.in/account" style="display:inline-block;background:#10b981;color:#ffffff;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:24px;font-size:14px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">Review Your Products</a>
      </div>
      ` : ''}

      <!-- Support -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:20px;text-align:center;">
        <p style="color:#6b7280;font-size:14px;font-weight:500;margin:0 0 8px;">${isDelivered ? 'Need help with your order?' : 'If you feel this was a mistake, please reach out to us.'}</p>
        <a href="mailto:${process.env.EMAIL_USER || 'support@nvanutrition.com'}" style="color:#10b981;font-weight:800;text-decoration:none;font-size:15px;display:inline-block;padding:8px 24px;background:#ecfdf5;border-radius:24px;border:1px solid #d1fae5;">Contact Support</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:32px 16px 0;">
      <p style="color:#9ca3af;font-size:13px;font-weight:600;margin:0;">© 2025 NVA Nutrition • Premium Sports Nutrition</p>
      <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">Fuel your performance, every rep of the way.</p>
    </div>

  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"NVA Nutrition 🌿" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Update: ${status} — ${orderId} | NVA Nutrition`,
      html: htmlBody,
    });

    return NextResponse.json({ success: true, message: `${status} email sent` });
  } catch (error: any) {
    console.error('Send status email error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
