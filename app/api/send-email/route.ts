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
 <td style="padding:12px 10px;border-bottom:1px solid #1a2e1a;vertical-align:top;">
 <div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:3px;">${item.name}</div>
 <div style="color:#6b7280;font-size:12px;">
 ${item.flavor ? `<span style="background:#14532d;color:#86efac;padding:2px 8px;border-radius:20px;margin-right:6px;font-size:11px;">${item.flavor}</span>` : ''}
 ${item.unit ? `<span style="background:#1e293b;color:#94a3b8;padding:2px 8px;border-radius:20px;margin-right:6px;font-size:11px;">${item.unit}</span>` : ''}
 ${item.isPromo ? `<span style="background:#14532d;color:#4ade80;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">🎁 FREE Gift</span>` : ''}
 </div>
 </td>
 <td style="padding:12px 10px;border-bottom:1px solid #1a2e1a;text-align:center;color:#9ca3af;font-size:13px;vertical-align:top;">
 ×${item.quantity || 1}
 </td>
 <td style="padding:12px 10px;border-bottom:1px solid #1a2e1a;text-align:right;vertical-align:top;">
 ${item.isPromo
 ? `<span style="color:#4ade80;font-weight:800;font-size:13px;">FREE</span>`
 : `<span style="color:#4ade80;font-weight:800;font-size:14px;font-family:monospace;">₹${(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>`
 }
 </td>
 </tr>
 `).join('');

 const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Order Confirmed — NVA Nutrition</title></head>
<body style="margin:0;padding:0;background-color:#060d06;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

 <div style="max-width:600px;margin:0 auto;padding:24px 16px 40px;">

 <!-- Header -->
 <div style="background:linear-gradient(135deg,#052e16 0%,#064e3b 50%,#052e16 100%);border-radius:20px 20px 0 0;border:1px solid #166534;border-bottom:0;padding:36px 28px 28px;text-align:center;">
 <div style="display:inline-flex;align-items:center;justify-content:center;background:#16a34a;color:#fff;font-weight:900;font-size:16px;padding:8px 20px;border-radius:10px;letter-spacing:3px;margin-bottom:20px;">NVA</div>
 <div style="display:inline-block;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);border-radius:50%;padding:16px;margin-bottom:16px;">
 <div style="width:36px;height:36px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">
 <span style="color:#fff;font-size:20px;">✓</span>
 </div>
 </div>
 <h1 style="color:#fff;margin:0 0 6px;font-size:26px;font-weight:900;letter-spacing:-0.5px;">Order Confirmed!</h1>
 <p style="color:#86efac;margin:0;font-size:14px;font-weight:500;">Your NVA Nutrition order has been received</p>
 </div>

 <!-- Body Card -->
 <div style="background:#0d1a0d;border:1px solid #166534;border-top:0;border-radius:0 0 20px 20px;padding:28px;">

 <!-- Greeting -->
 <p style="color:#d1d5db;font-size:15px;margin:0 0 6px;">Hi <strong style="color:#fff;">${customerName}</strong>,</p>
 <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;line-height:1.6;">Thank you for your order! We've received it and our team will start processing it right away. You'll get a shipping notification with tracking details once your order is dispatched.</p>

 <!-- Order Info Box -->
 <div style="background:linear-gradient(135deg,#0a1a0a,#0f2310);border:1px solid #166534;border-radius:16px;padding:20px;margin-bottom:24px;">
 <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;">📋 Order Details</p>
 <table style="width:100%;border-collapse:collapse;">
 <tr>
 <td style="color:#9ca3af;font-size:13px;padding:5px 0;">Order ID</td>
 <td style="color:#4ade80;font-weight:900;font-family:monospace;text-align:right;font-size:14px;letter-spacing:0.5px;">${orderId}</td>
 </tr>
 <tr>
 <td style="color:#9ca3af;font-size:13px;padding:5px 0;">Phone</td>
 <td style="color:#fff;font-weight:600;text-align:right;font-size:13px;">${phone || '—'}</td>
 </tr>
 <tr>
 <td style="color:#9ca3af;font-size:13px;padding:5px 0;">Payment</td>
 <td style="text-align:right;">
 <span style="background:${paymentMethod === 'COD' ? 'rgba(251,191,36,0.15)' : 'rgba(34,197,94,0.15)'};color:${paymentMethod === 'COD' ? '#fbbf24' : '#4ade80'};font-weight:700;font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid ${paymentMethod === 'COD' ? 'rgba(251,191,36,0.3)' : 'rgba(34,197,94,0.3)'};">
 ${paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}
 </span>
 </td>
 </tr>
 </table>
 </div>

 <!-- Delivery Address -->
 ${address ? `
 <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:14px;padding:16px;margin-bottom:24px;">
 <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">📍 Shipping To</p>
 <p style="color:#d1d5db;font-size:14px;margin:0;line-height:1.8;">
 ${address.address || ''}<br/>
 ${address.city || ''}, ${address.state || ''} – ${address.pinCode || ''}
 ${address.alternatePhone ? `<br/><span style="color:#6b7280;font-size:12px;">Alt: ${address.alternatePhone}</span>` : ''}
 </p>
 </div>` : ''}

 <!-- Items Table -->
 <div style="margin-bottom:24px;">
 <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🛒 Your Items</p>
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
 ${discount > 0 ? `
 <tr>
 <td colspan="2" style="padding:10px 10px 4px;text-align:right;color:#4ade80;font-size:13px;font-weight:700;">Discount Saved</td>
 <td style="padding:10px 10px 4px;text-align:right;color:#4ade80;font-size:13px;font-weight:700;">− ₹${discount.toLocaleString()}</td>
 </tr>` : ''}
 <tr>
 <td colspan="2" style="padding:14px 10px;text-align:right;color:#9ca3af;font-size:12px;font-weight:600;border-top:1px solid #1a3a1a;">Shipping</td>
 <td style="padding:14px 10px;text-align:right;color:#4ade80;font-size:12px;font-weight:700;border-top:1px solid #1a3a1a;">FREE</td>
 </tr>
 <tr style="background:linear-gradient(90deg,#052e16,#064e3b);">
 <td colspan="2" style="padding:16px 10px;text-align:right;font-weight:900;color:#fff;font-size:15px;">Total Paid</td>
 <td style="padding:16px 10px;text-align:right;font-weight:900;color:#4ade80;font-size:20px;font-family:monospace;">₹${Number(totalAmount || 0).toLocaleString()}</td>
 </tr>
 </tfoot>
 </table>
 </div>

 <!-- What Happens Next -->
 <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:14px;padding:18px;margin-bottom:24px;">
 <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;">🚀 What Happens Next</p>
 <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
 <div style="min-width:28px;height:28px;background:#14532d;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#4ade80;font-weight:900;font-size:12px;">1</div>
 <div>
 <p style="color:#fff;font-weight:700;font-size:13px;margin:0 0 2px;">Order Processing (1-2 hrs)</p>
 <p style="color:#6b7280;font-size:12px;margin:0;">Our team verifies and packs your order</p>
 </div>
 </div>
 <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
 <div style="min-width:28px;height:28px;background:#14532d;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#4ade80;font-weight:900;font-size:12px;">2</div>
 <div>
 <p style="color:#fff;font-weight:700;font-size:13px;margin:0 0 2px;">Shipped (1-2 days)</p>
 <p style="color:#6b7280;font-size:12px;margin:0;">You'll receive a tracking email with AWB number</p>
 </div>
 </div>
 <div style="display:flex;align-items:flex-start;gap:12px;">
 <div style="min-width:28px;height:28px;background:#14532d;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#4ade80;font-weight:900;font-size:12px;">3</div>
 <div>
 <p style="color:#fff;font-weight:700;font-size:13px;margin:0 0 2px;">Delivered (3-5 business days)</p>
 <p style="color:#6b7280;font-size:12px;margin:0;">Fast, safe delivery to your doorstep</p>
 </div>
 </div>
 </div>

 <!-- Trust Badges -->
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;text-align:center;">
 <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:12px;">
 <div style="font-size:20px;margin-bottom:4px;">🔬</div>
 <p style="color:#4ade80;font-size:11px;font-weight:700;margin:0;">Lab Tested</p>
 </div>
 <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:12px;">
 <div style="font-size:20px;margin-bottom:4px;">🚚</div>
 <p style="color:#4ade80;font-size:11px;font-weight:700;margin:0;">Free Shipping</p>
 </div>
 <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:12px;">
 <div style="font-size:20px;margin-bottom:4px;">🛡️</div>
 <p style="color:#4ade80;font-size:11px;font-weight:700;margin:0;">Genuine Products</p>
 </div>
 </div>

 <!-- Support -->
 <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:14px;padding:16px;text-align:center;">
 <p style="color:#9ca3af;font-size:13px;margin:0 0 6px;">Have questions about your order?</p>
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
 subject: `✅ Order Confirmed — ${orderId} | NVA Nutrition`,
 html: htmlBody,
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 console.error('Error sending confirmation email:', error);
 return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
 }
}
