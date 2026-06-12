import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
 try {
 const { amount, orderId } = await request.json();

 if (!amount || !orderId) {
 return NextResponse.json(
 { success: false, error: 'Amount and OrderId are required' },
 { status: 400 }
 );
 }

 const keyId = process.env.RAZORPAY_KEY_ID;
 const keySecret = process.env.RAZORPAY_KEY_SECRET;

 // If Razorpay keys are configured, attempt to use the official SDK
 if (keyId && keySecret) {
 try {
 // Dynamic import to avoid issues if the package is not installed yet
 const Razorpay = (await import('razorpay')).default;
 const razorpay = new Razorpay({
 key_id: keyId,
 key_secret: keySecret,
 });

 const order = await razorpay.orders.create({
 amount: Math.round(amount * 100), // convert to paise
 currency: 'INR',
 receipt: orderId,
 payment_capture: 1 as any,
 }) as any;

 return NextResponse.json({
 success: true,
 gateway: 'razorpay',
 keyId: keyId,
 orderId: order.id,
 amount: order.amount,
 currency: order.currency,
 });
 } catch (sdkError) {
 console.error('[Razorpay SDK Error] Falling back to sandbox:', sdkError);
 }
 }

 // Sandbox / Simulation Mode (if credentials are empty or SDK errors out)
 const simulatedOrderId = 'rzp_order_' + Math.random().toString(36).substring(2, 14);
 
 return NextResponse.json({
 success: true,
 gateway: 'sandbox',
 keyId: 'rzp_test_sandbox_key',
 orderId: simulatedOrderId,
 amount: Math.round(amount * 100),
 currency: 'INR',
 message: 'Running in simulated Premium Sandbox Mode',
 });

 } catch (error) {
 console.error('Error creating payment order:', error);
 return NextResponse.json(
 { success: false, error: 'Internal Server Error' },
 { status: 500 }
 );
 }
}
