import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { orderId, customerName, email, phone, items, totalAmount, discountAmount, address, paymentMethod } = await req.json();

    if (!email) return NextResponse.json({ error: 'No email provided' }, { status: 400 });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const subtotal = (items || []).filter((i: any) => !i.isPromo).reduce((s: number, i: any) => s + (Number(i.price || 0) * (i.quantity || 1)), 0);
    const discount = Number(discountAmount || 0);

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
<title>Order Confirmed — NVA Nutrition</title></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:600px;margin:0 auto;padding:32px 16px 48px;">

    <!-- Header -->
    <div style="background:#ffffff;border-radius:24px 24px 0 0;border:1px solid #e5e7eb;border-bottom:0;padding:40px 28px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;background:#111827;color:#ffffff;font-weight:900;font-size:18px;padding:10px 24px;border-radius:12px;letter-spacing:2px;margin-bottom:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">NVA NUTRITION</div>
      <div style="display:inline-block;background:#ecfdf5;border:1px solid #d1fae5;border-radius:50%;padding:16px;margin-bottom:20px;">
        <div style="width:40px;height:40px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
          <span style="color:#fff;font-size:22px;font-weight:bold;">✓</span>
        </div>
      </div>
      <h1 style="color:#111827;margin:0 0 8px;font-size:28px;font-weight:900;letter-spacing:-0.5px;">Order Confirmed!</h1>
      <p style="color:#6b7280;margin:0;font-size:15px;font-weight:500;">Your NVA Nutrition order has been successfully placed.</p>
    </div>

    <!-- Body Card -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 24px 24px;padding:0 32px 32px;">

      <!-- Greeting -->
      <p style="color:#374151;font-size:16px;margin:0 0 8px;padding-top:10px;">Hi <strong style="color:#111827;">${customerName}</strong>,</p>
      <p style="color:#6b7280;font-size:15px;margin:0 0 28px;line-height:1.6;">Thank you for choosing NVA! We're preparing your order and our team will dispatch it shortly. You'll receive another email with tracking details once it ships.</p>

      <!-- Order Info Box -->
      <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:16px;padding:24px;margin-bottom:28px;">
        <p style="color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px;">📋 Order Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:6px 0;font-weight:500;">Order ID</td>
            <td style="color:#111827;font-weight:900;font-family:monospace;text-align:right;font-size:15px;letter-spacing:0.5px;background:#f3f4f6;padding:4px 10px;border-radius:8px;">${orderId}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:6px 0;font-weight:500;">Phone</td>
            <td style="color:#111827;font-weight:700;text-align:right;font-size:14px;">${phone || '—'}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:6px 0;font-weight:500;">Payment</td>
            <td style="text-align:right;">
              <span style="background:${paymentMethod === 'COD' ? '#fef3c7' : '#ecfdf5'};color:${paymentMethod === 'COD' ? '#d97706' : '#059669'};font-weight:800;font-size:12px;padding:4px 12px;border-radius:20px;border:1px solid ${paymentMethod === 'COD' ? '#fde68a' : '#d1fae5'};display:inline-block;margin-top:4px;">
                ${paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Delivery Address -->
      ${address ? `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;margin-bottom:28px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
        <p style="color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">📍 Delivery Address</p>
        <p style="color:#374151;font-size:15px;margin:0;line-height:1.6;font-weight:500;">
          ${address.address || ''}<br/>
          ${address.city || ''}, ${address.state || ''} – ${address.pinCode || ''}
          ${address.alternatePhone ? `<br/><span style="color:#6b7280;font-size:13px;margin-top:4px;display:inline-block;">Alt: ${address.alternatePhone}</span>` : ''}
        </p>
      </div>` : ''}

      <!-- Items Table -->
      <div style="margin-bottom:28px;">
        <p style="color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🛒 Order Summary</p>
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
            ${discount > 0 ? `
            <tr>
              <td colspan="2" style="padding:16px 12px 6px;text-align:right;color:#059669;font-size:14px;font-weight:800;">Discount Applied</td>
              <td style="padding:16px 12px 6px;text-align:right;color:#059669;font-size:14px;font-weight:800;">− ₹${discount.toLocaleString()}</td>
            </tr>` : ''}
            <tr>
              <td colspan="2" style="padding:12px;text-align:right;color:#6b7280;font-size:13px;font-weight:600;">Shipping</td>
              <td style="padding:12px;text-align:right;color:#059669;font-size:13px;font-weight:800;">FREE</td>
            </tr>
            <tr style="background:#f9fafb;">
              <td colspan="2" style="padding:20px 12px;text-align:right;font-weight:900;color:#111827;font-size:16px;border-top:1px solid #e5e7eb;">Total Paid</td>
              <td style="padding:20px 12px;text-align:right;font-weight:900;color:#10b981;font-size:22px;font-family:monospace;border-top:1px solid #e5e7eb;">₹${Number(totalAmount || 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- What Happens Next -->
      <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:16px;padding:24px;margin-bottom:28px;">
        <p style="color:#9ca3af;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px;">🚀 What Happens Next</p>
        
        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;">
          <div style="min-width:32px;height:32px;background:#ecfdf5;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#059669;font-weight:900;font-size:14px;border:1px solid #d1fae5;">1</div>
          <div style="padding-top:2px;">
            <p style="color:#111827;font-weight:800;font-size:14px;margin:0 0 4px;">Processing (1-2 hrs)</p>
            <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.4;">We verify and carefully pack your items.</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;">
          <div style="min-width:32px;height:32px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-weight:900;font-size:14px;border:1px solid #e5e7eb;">2</div>
          <div style="padding-top:2px;">
            <p style="color:#374151;font-weight:800;font-size:14px;margin:0 0 4px;">Shipped (1-2 days)</p>
            <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.4;">You'll receive a tracking email with your AWB number.</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;gap:16px;">
          <div style="min-width:32px;height:32px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-weight:900;font-size:14px;border:1px solid #e5e7eb;">3</div>
          <div style="padding-top:2px;">
            <p style="color:#374151;font-weight:800;font-size:14px;margin:0 0 4px;">Delivered (3-5 days)</p>
            <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.4;">Fast, safe delivery directly to your doorstep.</p>
          </div>
        </div>
      </div>

      <!-- Trust Badges -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;text-align:center;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:16px 8px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-size:24px;margin-bottom:8px;">🔬</div>
          <p style="color:#111827;font-size:11px;font-weight:800;margin:0;">Lab Tested</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:16px 8px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-size:24px;margin-bottom:8px;">🚚</div>
          <p style="color:#111827;font-size:11px;font-weight:800;margin:0;">Free Shipping</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:16px 8px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-size:24px;margin-bottom:8px;">🛡️</div>
          <p style="color:#111827;font-size:11px;font-weight:800;margin:0;">100% Genuine</p>
        </div>
      </div>

      <!-- Support -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:20px;text-align:center;">
        <p style="color:#6b7280;font-size:14px;font-weight:500;margin:0 0 8px;">Have questions about your order?</p>
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
      subject: `✅ Order Confirmed — ${orderId} | NVA Nutrition`,
      html: htmlBody,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
