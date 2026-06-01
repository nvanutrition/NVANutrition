import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { orderId, customerName, email, phone, items, totalAmount, discountAmount, address } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    }

    // Configure nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can use other services or SMTP host
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Create the items HTML
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong><br/>
          <small style="color: #666;">
            ${item.flavor ? `Flavor: ${item.flavor} | ` : ''}
            ${item.unit ? `Size: ${item.unit} | ` : ''}
            ${item.isPromo ? `<span style="color: #22c55e;">Promo Gift</span>` : ''}
          </small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const discountHtml = discountAmount && discountAmount > 0 ? `
      <tr>
        <td colspan="2" style="padding: 10px; text-align: right; color: #22c55e;"><strong>Discount</strong></td>
        <td style="padding: 10px; text-align: right; color: #22c55e;">- ₹${discountAmount.toLocaleString()}</td>
      </tr>
    ` : '';

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #16a34a; margin: 0;">NVA Nutrition</h1>
          <p style="color: #666; margin-top: 5px;">Order Confirmation</p>
        </div>
        
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Thank you for your order! We have received it and will begin processing it shortly.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Order Details</h3>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
          <p style="margin: 5px 0;"><strong>Shipping Address:</strong><br/>
            ${address.address}<br/>
            ${address.city}, ${address.state} - ${address.pinCode}
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            ${discountHtml}
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-size: 1.1em;"><strong>Total Amount</strong></td>
              <td style="padding: 10px; text-align: right; font-size: 1.1em; color: #16a34a;"><strong>₹${totalAmount.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        <p style="color: #666; font-size: 0.9em; text-align: center; margin-top: 30px;">
          If you have any questions, please reply to this email or contact our support team.
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"NVA Nutrition" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmed - NVA Nutrition (${orderId})`,
      html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
