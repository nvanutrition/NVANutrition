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
 const headerColor = isCancelled ? '#ef4444' : isRTO ? '#f59e0b' : '#4ade80';
 const bgHeader = isCancelled ? '#450a0a' : isRTO ? '#451a03' : '#064e3b';

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

 const itemsHtml = items.map((item: any) => `
 <tr>
 <td style="padding:12px 10px;border-bottom:1px solid #1a3a1a;">
 <p style="color:#fff;font-weight:700;font-size:13px;margin:0 0 4px;">${item.name}</p>
 ${item.flavor ? `<span style="background:#14532d;color:#4ade80;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;">${item.flavor}</span>` : ''}
 ${item.isPromo ? `<span style="background:#064e3b;color:#34d399;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;">Promo Item</span>` : ''}
 </td>
 <td style="padding:12px 10px;border-bottom:1px solid #1a3a1a;text-align:center;color:#9ca3af;font-size:13px;font-weight:600;">x${item.quantity}</td>
 <td style="padding:12px 10px;border-bottom:1px solid #1a3a1a;text-align:right;color:#fff;font-size:13px;font-weight:700;">
 ${item.price > 0 ? `₹${(item.price * item.quantity).toLocaleString()}` : '<span style="color:#4ade80;">FREE</span>'}
 </td>
 </tr>
 `).join('');

 const htmlBody = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;">
 <div style="max-width:600px;margin:0 auto;padding:20px;background:#050505;">
 
 <!-- Header -->
 <div style="background:${bgHeader};border:1px solid ${headerColor};border-radius:20px 20px 0 0;padding:30px;text-align:center;">
 <h1 style="color:${headerColor};font-size:24px;font-weight:900;letter-spacing:-0.5px;margin:0 0 8px;">${headerTitle}</h1>
 <p style="color:#d1d5db;font-size:14px;margin:0;">Order Reference: ${orderId}</p>
 </div>

 <!-- Body -->
 <div style="background:#0d1a0d;border:1px solid #1a3a1a;border-top:0;border-radius:0 0 20px 20px;padding:28px;">
 <p style="color:#d1d5db;font-size:15px;margin:0 0 6px;">Hi <strong style="color:#fff;">${customerName}</strong>,</p>
 <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;line-height:1.6;">${messageDesc}</p>

 <!-- Items -->
 <div style="margin-bottom:24px;">
 <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🛒 ${isDelivered ? 'Delivered Items' : 'Cancelled Items'}</p>
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
 <tr style="background:#111b11;">
 <td colspan="2" style="padding:16px 10px;text-align:right;font-weight:900;color:#fff;font-size:15px;">Total Order Value</td>
 <td style="padding:16px 10px;text-align:right;font-weight:900;color:#fff;font-size:18px;font-family:monospace;">₹${Number(totalAmount || 0).toLocaleString()}</td>
 </tr>
 </tfoot>
 </table>
 </div>

 ${isDelivered ? `
 <!-- Review CTA -->
 <div style="background:linear-gradient(135deg,#064e3b,#022c22);border:1px solid #059669;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
 <h3 style="color:#34d399;font-size:18px;margin:0 0 10px;">How did we do?</h3>
 <p style="color:#d1d5db;font-size:13px;margin:0 0 16px;">We would love to hear your feedback! Share your experience and help others make the best choice.</p>
 <a href="https://nvanutrition.com/account" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">Review Your Products</a>
 </div>
 ` : ''}

 <!-- Support -->
 <div style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:14px;padding:16px;text-align:center;">
 <p style="color:#9ca3af;font-size:13px;margin:0 0 6px;">${isDelivered ? 'Need help with your order?' : 'If you feel this was a mistake, please reach out to us.'}</p>
 <a href="mailto:${process.env.EMAIL_USER || 'support@nvanutrition.com'}" style="color:#4ade80;font-weight:700;text-decoration:none;font-size:14px;">${process.env.EMAIL_USER || 'support@nvanutrition.com'}</a>
 </div>
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
