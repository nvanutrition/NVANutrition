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
    const { cf_order_id } = await request.json();

    if (!cf_order_id) {
      return NextResponse.json(
        { success: false, error: 'cf_order_id is required' },
        { status: 400 }
      );
    }

    const cashfree = getCashfreeClient();

    // Fetch order details from Cashfree
    const response = await cashfree.PGFetchOrder(cf_order_id);

    if (!response?.data) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = response.data;
    const orderStatus = order.order_status; // PAID | ACTIVE | EXPIRED | CANCELLED

    if (orderStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        status: 'PAID',
        order_id: order.order_id,
        cf_order_id: order.cf_order_id,
        order_amount: order.order_amount,
        order_currency: order.order_currency,
      });
    } else {
      return NextResponse.json({
        success: false,
        status: orderStatus,
        order_id: order.order_id,
        cf_order_id: order.cf_order_id,
        message: `Payment ${orderStatus?.toLowerCase() || 'failed'}. Please try again.`,
      });
    }
  } catch (error: any) {
    const errData = error?.response?.data;
    console.error(
      '[Cashfree] Verify payment error:',
      errData ? JSON.stringify(errData) : error?.message
    );
    return NextResponse.json(
      {
        success: false,
        status: 'ERROR',
        error: errData?.message || 'Payment verification failed',
      },
      { status: 500 }
    );
  }
}
