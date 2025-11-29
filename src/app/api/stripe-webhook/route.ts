import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
      
      // Get customer email from session
      const customerEmail = session.customer_email || session.customer_details?.email;
      
      // Determine which plan was purchased from metadata (set in our checkout API)
      let planToAssign: 'professional' | 'enterprise' | null = null;
      
      // Check if plan is in metadata (this is set by our /api/create-checkout endpoint)
      if (session.metadata?.plan) {
        planToAssign = session.metadata.plan as 'professional' | 'enterprise';
        console.log('Plan found in metadata:', planToAssign);
      }
      
      // Fallback: check by amount (professional = $20, enterprise = $49)
      if (!planToAssign && session.amount_total) {
        const amount = session.amount_total / 100; // Convert from cents
        if (amount >= 49) {
          planToAssign = 'enterprise';
        } else if (amount >= 20) {
          planToAssign = 'professional';
        }
        console.log('Plan determined by amount:', planToAssign, '(amount:', amount, ')');
      }

      if (!planToAssign) {
        console.error('Could not determine plan for session:', session.id);
        // Default to professional if we can't determine
        planToAssign = 'professional';
      }

      // Try to find user - first by userId in metadata, then by email
      let userUpdated = false;
      
      // Method 1: Use userId from metadata (most reliable)
      if (session.metadata?.userId) {
        try {
          const updatedUser = await prisma.user.update({
            where: { id: session.metadata.userId },
            data: { plan: planToAssign },
          });
          console.log(`✅ Updated user ${updatedUser.id} to ${planToAssign} plan (via userId)`);
          userUpdated = true;
        } catch (err) {
          console.log('Could not update by userId, trying email...');
        }
      }

      // Method 2: Use customer email
      if (!userUpdated && customerEmail) {
        try {
          // Try exact match first
          const updatedUser = await prisma.user.update({
            where: { emailAddress: customerEmail },
            data: { plan: planToAssign },
          });
          console.log(`✅ Updated user ${customerEmail} to ${planToAssign} plan (via email)`);
          userUpdated = true;
        } catch (dbError: unknown) {
          // If exact match fails, try case-insensitive search
          const existingUser = await prisma.user.findFirst({
            where: {
              emailAddress: {
                equals: customerEmail,
                mode: 'insensitive',
              },
            },
          });

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { plan: planToAssign },
            });
            console.log(`✅ Updated user ${existingUser.id} to ${planToAssign} plan (via case-insensitive email)`);
            userUpdated = true;
          }
        }
      }

      if (!userUpdated) {
        console.error('Could not find user to update. Session:', session.id, 'Email:', customerEmail);
        // Still return 200 to acknowledge the webhook
      }
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

