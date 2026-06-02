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
        <td style="padding:12px 10px;border-bottom:1px solid #1a2a1a;vertical-align:top;">
          <span style="font-weight:700;color:#fff;font-size:14px;">${item.name}</span><br/>
          <span style="color:#6b7280;font-size:12px;">
            ${item.flavor ? `<span style="background:#14532d;color:#86efac;padding:2px 8px;border-radius:20px;margin-right:4px;font-size:11px;">${item.flavor}</span>` : ''}
            ${item.unit ? `<span style="background:#1e293b;color:#94a3b8;padding:2px 8px;border-radius:20px;font-size:11px;">${item.unit}</span>` : ''}
            ${item.isPromo ? `<span style="background:#14532d;color:#4ade80;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">🎁 FREE</span>` : ''}
          </span>
        </td>
        <td style="padding:12px 10px;border-bottom:1px solid #1a2a1a;text-align:center;color:#9ca3af;font-size:13px;vertical-align:top;">×${item.quantity || 1}</td>
        <td style="padding:12px 10px;border-bottom:1px solid #1a2a1a;text-align:right;vertical-align:top;">
          ${item.isPromo
            ? `<span style="color:#4ade80;font-weight:800;font-size:13px;">FREE</span>`
            : `<span style="color:#4ade80;font-weight:800;font-size:14px;font-family:monospace;">₹${(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>`}
        </td>
      </tr>
    `).join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Your Order is Shipped — NVA Nutrition</title></head>
<body style="margin:0;padding:0;background-color:#060d06;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <div style="max-width:600px;margin:0 auto;padding:24px 16px 40px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a0533 0%,#0c1f3a 50%,#052e16 100%);border-radius:20px 20px 0 0;border:1px solid #6d28d9;border-bottom:0;padding:36px 28px 28px;text-align:center;">
      <div style="display:inline-block;background:#16a34a;color:#fff;font-weight:900;font-size:16px;padding:8px 20px;border-radius:10px;letter-spacing:3px;margin-bottom:20px;">NVA</div>
      <div style="font-size:48px;margin-bottom:12px;">🚚</div>
      <h1 style="color:#fff;margin:0 0 6px;font-size:26px;font-weight:900;letter-spacing:-0.5px;">Your Order is On Its Way!</h1>
      <p style="color:#c4b5fd;margin:0;font-size:14px;">Your NVA Nutrition package has been dispatched</p>
    </div>

    <!-- Body -->
    <div style="background:#0d1a0d;border:1px solid #6d28d9;border-top:0;border-radius:0 0 20px 20px;padding:28px;">

      <p style="color:#d1d5db;font-size:15px;margin:0 0 6px;">Hi <strong style="color:#fff;">${customerName}</strong>,</p>
      <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;line-height:1.6;">Exciting news — your order has been shipped and is heading your way! Use the tracking details below to follow your package.</p>

      <!-- BIG Tracking Box -->
      <div style="background:linear-gradient(135deg,#1a0533,#0c1f3a);border:2px solid #7c3aed;border-radius:18px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="color:#c4b5fd;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 18px;">📦 Tracking Information</p>

        <div style="display:inline-block;background:rgba(109,40,217,0.2);border:1px solid rgba(109,40,217,0.4);border-radius:14px;padding:6px 16px;margin-bottom:16px;">
          <span style="color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Courier Partner</span>
        </div>
        <div style="font-size:22px;font-weight:900;color:#c4b5fd;margin-bottom:20px;">${courierPartner}</div>

        <div style="display:inline-block;background:rgba(109,40,217,0.15);border:1px solid rgba(109,40,217,0.3);border-radius:14px;padding:6px 16px;margin-bottom:10px;">
          <span style="color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">AWB / Tracking Number</span>
        </div>
        <div style="font-size:28px;font-weight:900;color:#a78bfa;font-family:monospace;letter-spacing:3px;word-break:break-all;padding:0 10px;">${awbNumber}</div>

        <p style="color:#6b7280;font-size:12px;margin:16px 0 0;">Copy the AWB number and track on the <strong style="color:#9ca3af;">${courierPartner}</strong> website or app</p>
      </div>

      <!-- Order ID Row -->
      <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:14px;padding:14px 18px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:12px;padding:4px 0;">Order Reference</td>
            <td style="color:#4ade80;font-family:monospace;font-weight:900;text-align:right;font-size:14px;">${orderId}</td>
          </tr>
        </table>
      </div>

      <!-- Delivery Progress -->
      <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:14px;padding:18px;margin-bottom:24px;">
        <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px;">📍 Delivery Progress</p>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="text-align:center;flex:1;">
            <div style="width:32px;height:32px;background:#16a34a;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:14px;">✓</span>
            </div>
            <p style="color:#4ade80;font-size:10px;font-weight:700;margin:0;">Confirmed</p>
          </div>
          <div style="flex:1;height:2px;background:linear-gradient(90deg,#16a34a,#7c3aed);margin:0 4px;margin-bottom:22px;"></div>
          <div style="text-align:center;flex:1;">
            <div style="width:32px;height:32px;background:#16a34a;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:14px;">✓</span>
            </div>
            <p style="color:#4ade80;font-size:10px;font-weight:700;margin:0;">Packed</p>
          </div>
          <div style="flex:1;height:2px;background:linear-gradient(90deg,#7c3aed,#7c3aed);margin:0 4px;margin-bottom:22px;"></div>
          <div style="text-align:center;flex:1;">
            <div style="width:32px;height:32px;background:#7c3aed;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:16px;">🚚</span>
            </div>
            <p style="color:#c4b5fd;font-size:10px;font-weight:700;margin:0;">Shipped</p>
          </div>
          <div style="flex:1;height:2px;background:#1a2a1a;margin:0 4px;margin-bottom:22px;"></div>
          <div style="text-align:center;flex:1;">
            <div style="width:32px;height:32px;background:#1a2a1a;border:2px solid #374151;border-radius:50%;margin:0 auto 6px;"></div>
            <p style="color:#6b7280;font-size:10px;font-weight:700;margin:0;">Delivered</p>
          </div>
        </div>
        <p style="color:#6b7280;font-size:12px;margin:14px 0 0;text-align:center;">Expected delivery: <strong style="color:#9ca3af;">3–5 business days</strong></p>
      </div>

      <!-- Delivery Address -->
      ${address ? `
      <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:14px;padding:16px;margin-bottom:24px;">
        <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">📍 Delivering To</p>
        <p style="color:#d1d5db;font-size:14px;margin:0;line-height:1.8;">
          ${address.address || ''}<br/>
          ${address.city || ''}, ${address.state || ''} – ${address.pinCode || ''}
        </p>
      </div>` : ''}

      <!-- Items -->
      <div style="margin-bottom:24px;">
        <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🛒 Items in This Shipment</p>
        <table style="width:100%;border-collapse:collapse;background:#0a1a0a;border-radius:14px;overflow:hidden;border:1px solid #1a3a1a;">
          <thead>
            <tr style="background:#111b11;">
              <th style="padding:10px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:700;">Product</th>
              <th style="padding:10px;text-align:center;color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:700;">Qty</th>
              <th style="padding:10px;text-align:right;color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:700;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr style="background:linear-gradient(90deg,#052e16,#064e3b);">
              <td colspan="2" style="padding:16px 10px;text-align:right;font-weight:900;color:#fff;font-size:15px;">Total Paid</td>
              <td style="padding:16px 10px;text-align:right;font-weight:900;color:#4ade80;font-size:20px;font-family:monospace;">₹${Number(totalAmount || 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Support -->
      <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:14px;padding:16px;text-align:center;">
        <p style="color:#9ca3af;font-size:13px;margin:0 0 6px;">Questions about your shipment?</p>
        <a href="mailto:${process.env.EMAIL_USER || 'support@nvanutrition.com'}" style="color:#4ade80;font-weight:700;text-decoration:none;font-size:14px;">${process.env.EMAIL_USER || 'support@nvanutrition.com'}</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 16px 0;">
      <p style="color:#374151;font-size:12px;margin:0;">© 2025 NVA Nutrition • Premium Sports Nutrition</p>
      <p style="color:#374151;font-size:11px;margin:4px 0 0;">Fuel your performance, every rep of the way.</p>
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
