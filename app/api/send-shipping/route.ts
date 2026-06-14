import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { orderId, customerName, email, courierPartner, awbNumber, totalAmount, items, address } = await req.json();

    if (!email) return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    if (!courierPartner || !awbNumber) return NextResponse.json({ error: 'Courier and AWB are required' }, { status: 400 });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const itemsHtml = (items || []).map((item: any) => `
    <tr>
      <td style="padding:16px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <div style="font-weight:800;color:#111827;font-size:14px;margin-bottom:6px;line-height:1.4;">${item.name}</div>
        <div style="color:#6b7280;font-size:12px;">
          ${item.flavor ? `<span style="display:inline-block;background:#f3f4f6;color:#4b5563;padding:4px 10px;border-radius:20px;margin-right:6px;margin-bottom:4px;font-size:11px;font-weight:700;">${item.flavor}</span>` : ''}
          ${item.unit ? `<span style="display:inline-block;background:#f3f4f6;color:#4b5563;padding:4px 10px;border-radius:20px;margin-right:6px;margin-bottom:4px;font-size:11px;font-weight:700;">${item.unit}</span>` : ''}
          ${item.isPromo ? `<span style="display:inline-block;background:#ecfdf5;color:#059669;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;border:1px solid #d1fae5;">🎁 FREE Gift</span>` : ''}
        </div>
      </td>
      <td style="padding:16px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#4b5563;font-size:14px;font-weight:700;vertical-align:top;">
        ×${item.quantity || 1}
      </td>
      <td style="padding:16px 12px;border-bottom:1px solid #f3f4f6;text-align:right;vertical-align:top;">
        ${item.isPromo
          ? `<span style="color:#059669;font-weight:800;font-size:14px;">FREE</span>`
          : `<span style="color:#111827;font-weight:800;font-size:15px;font-family:monospace;">₹${(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>`
        }
      </td>
    </tr>
    `).join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Your Order is Shipped — NVA Nutrition</title></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:600px;margin:0 auto;padding:32px 16px 48px;">

    <!-- Header -->
    <div style="background:#ffffff;border-radius:24px 24px 0 0;border:1px solid #e5e7eb;border-bottom:0;padding:40px 28px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;background:#111827;color:#ffffff;font-weight:900;font-size:18px;padding:10px 24px;border-radius:12px;letter-spacing:2px;margin-bottom:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">NVA NUTRITION</div>
      <div style="display:inline-block;background:#f3e8ff;border:1px solid #e9d5ff;border-radius:50%;padding:16px;margin-bottom:20px;">
        <div style="width:40px;height:40px;background:#9333ea;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 4px 12px rgba(147,51,234,0.3);">
          <span style="color:#fff;font-size:22px;">🚚</span>
        </div>
      </div>
      <h1 style="color:#111827;margin:0 0 8px;font-size:28px;font-weight:900;letter-spacing:-0.5px;">Your Order is Shipped!</h1>
      <p style="color:#6b7280;margin:0;font-size:15px;font-weight:500;">Your NVA package is on its way to you.</p>
    </div>

    <!-- Body Card -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 24px 24px;padding:0 32px 32px;">

      <!-- Greeting -->
      <p style="color:#374151;font-size:16px;margin:0 0 8px;padding-top:10px;">Hi <strong style="color:#111827;">${customerName}</strong>,</p>
      <p style="color:#6b7280;font-size:15px;margin:0 0 28px;line-height:1.6;">Exciting news! Your order has been dispatched. You can track your package's journey using the details below.</p>

      <!-- Tracking Box -->
      <div style="background:#faf5ff;border:2px solid #e9d5ff;border-radius:16px;padding:28px 24px;margin-bottom:28px;text-align:center;">
        <p style="color:#9333ea;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 20px;">📦 Tracking Information</p>
        
        <div style="display:inline-block;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;padding:6px 16px;margin-bottom:12px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
          <span style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Courier Partner</span>
        </div>
        <div style="font-size:24px;font-weight:900;color:#111827;margin-bottom:24px;">${courierPartner}</div>
        
        <div style="display:inline-block;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;padding:6px 16px;margin-bottom:12px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
          <span style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">AWB / Tracking Number</span>
        </div>
        <div style="font-size:28px;font-weight:900;color:#9333ea;font-family:monospace;letter-spacing:2px;word-break:break-all;padding:0 10px;">${awbNumber}</div>
        
        <p style="color:#6b7280;font-size:13px;margin:20px 0 0;font-weight:500;">Copy the AWB number and track it on the <strong style="color:#111827;">${courierPartner}</strong> website.</p>
      </div>

      <!-- Order ID Row -->
      <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:16px;padding:16px 20px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;font-weight:500;">Order Reference</td>
            <td style="color:#111827;font-family:monospace;font-weight:900;text-align:right;font-size:15px;letter-spacing:0.5px;">${orderId}</td>
          </tr>
        </table>
      </div>

      <!-- Delivery Address -->
      ${address ? `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;margin-bottom:28px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
        <p style="color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">📍 Delivering To</p>
        <p style="color:#374151;font-size:15px;margin:0;line-height:1.6;font-weight:500;">
          ${address.address || ''}<br/>
          ${address.city || ''}, ${address.state || ''} – ${address.pinCode || ''}
        </p>
      </div>` : ''}

      <!-- Items Table -->
      <div style="margin-bottom:28px;">
        <p style="color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🛒 Items in This Shipment</p>
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
              <td colspan="2" style="padding:20px 12px;text-align:right;font-weight:900;color:#111827;font-size:16px;border-top:1px solid #e5e7eb;">Total Paid</td>
              <td style="padding:20px 12px;text-align:right;font-weight:900;color:#10b981;font-size:22px;font-family:monospace;border-top:1px solid #e5e7eb;">₹${Number(totalAmount || 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Support -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:20px;text-align:center;">
        <p style="color:#6b7280;font-size:14px;font-weight:500;margin:0 0 8px;">Questions about your shipment?</p>
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
      subject: `🚚 Shipped! Order ${orderId} — ${courierPartner} | AWB: ${awbNumber}`,
      html: htmlBody,
    });

    return NextResponse.json({ success: true, message: 'Shipping email sent' });
  } catch (error: any) {
    console.error('Send shipping email error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
