import { NextRequest, NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

function getCashfreeClient() {
  const appId = process.env.CASHFREE_APP_ID!;
  const secretKey = process.env.CASHFREE_SECRET_KEY!;
  const isProd = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production';
  const env = isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  return new (Cashfree as any)(env, appId, secretKey);
}

export async function POST(request: NextRequest) {
  try {
    const { amount, orderId, customerName, customerEmail, customerPhone } =
      await request.json();

    if (!amount || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Amount and OrderId are required' },
        { status: 400 }
      );
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const cashfree = getCashfreeClient();

    // Always use the production site URL for the return URL (must be HTTPS for production Cashfree)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://www.nvanutrition.in';

    // Clean phone: digits only, 10 chars
    const cleanPhone =
      (customerPhone || '').replace(/\D/g, '').slice(0, 10) || '9999999999';

    const orderRequest = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `cust_${orderId}`,
        customer_name: customerName || 'NVA Customer',
        customer_email: customerEmail || 'customer@nvanutrition.in',
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: `${siteUrl}/checkout?cf_order_id={order_id}`,
        notify_url: `${siteUrl}/api/payment/webhook`,
      },
    };

    const response = await cashfree.PGCreateOrder(orderRequest);

    if (!response?.data?.payment_session_id) {
      console.error('[Cashfree] Missing payment_session_id:', response?.data);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      cf_order_id: response.data.cf_order_id,
      order_id: response.data.order_id,
    });
  } catch (error: any) {
    const errData = error?.response?.data;
    console.error(
      '[Cashfree] Order creation error:',
      errData ? JSON.stringify(errData) : error?.message
    );
    return NextResponse.json(
      {
        success: false,
        error: errData?.message || 'Payment initialization failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
