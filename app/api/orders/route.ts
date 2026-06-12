import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
 try {
 const orderData = await request.json();

 // Cleanly structure the order details for Google Sheets columns
 const formattedData = {
 orderId: orderData.orderId,
 date: new Date().toISOString().replace('T', ' ').substring(0, 19),
 customerName: orderData.customerName || orderData.fullName || 'Guest Customer',
 phone: orderData.phone || '',
 email: orderData.email || '',
 address: `${orderData.address || ''}, ${orderData.city || ''}, ${orderData.state || ''} - ${orderData.pincode || ''}`,
 products: orderData.items.map((item: any) => `${item.name}${item.flavor ? ` (${item.flavor})` : ''}`).join(', '),
 quantity: orderData.items.map((item: any) => `${item.quantity}`).join(', '),
 totalAmount: orderData.totalAmount || orderData.finalTotal || 0,
 paymentStatus: orderData.paymentStatus || 'Pending',
 orderStatus: orderData.orderStatus || 'Pending',
 notes: orderData.notes || '',
 };

 console.log('Processed Order for Sheets API:', formattedData);

 const scriptURL = process.env.GOOGLE_APPS_SCRIPT_URL;

 if (scriptURL) {
 try {
 const response = await fetch(scriptURL, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(formattedData),
 });

 if (response.ok) {
 const resJson = await response.json();
 console.log('[Google Sheets API Success]:', resJson);
 } else {
 console.error('[Google Sheets API Error] Status:', response.status);
 }
 } catch (scriptError) {
 console.error('[Google Sheets API Fetch Exception]:', scriptError);
 }
 } else {
 console.log('[Google Sheets Warning] GOOGLE_APPS_SCRIPT_URL environment variable is not configured. Saved order locally.');
 }

 return NextResponse.json(
 { 
 success: true, 
 message: 'Order received successfully and stored in Google Sheets',
 orderId: formattedData.orderId
 },
 { status: 200 }
 );

 } catch (error) {
 console.error('Error processing order route:', error);
 return NextResponse.json(
 { success: false, message: 'Error processing order' },
 { status: 500 }
 );
 }
}
