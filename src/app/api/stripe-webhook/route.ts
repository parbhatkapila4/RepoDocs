import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  try {
    // Read the raw request body as ArrayBuffer
    const body = await req.arrayBuffer();
    
    // Convert ArrayBuffer to Buffer (required by Stripe)
    const rawBody = Buffer.from(body);
    
    // Get the Stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Payment successful, session id:', session.id);
      
      // You can add additional logic here, such as:
      // - Update user subscription status in database
      // - Send confirmation email
      // - Grant access to premium features
    }

    // Return 200 to acknowledge receipt of the event
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

