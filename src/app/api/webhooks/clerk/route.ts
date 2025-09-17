import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env or .env.local');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  const payload = await req.text();
  const body = JSON.parse(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  const { type } = evt;

  if (type === 'user.created' || type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    if (!email_addresses || email_addresses.length === 0) {
      return new Response('No email address found', { status: 400 });
    }

    const emailAddress = email_addresses[0].email_address;

    try {
      await prisma.user.upsert({
        where: {
          emailAddress: emailAddress,
        },
        update: {
          imageUrl: image_url,
          firstName: first_name,
          lastName: last_name,
        },
        create: {
          id: id,
          emailAddress: emailAddress,
          imageUrl: image_url,
          firstName: first_name,
          lastName: last_name,
        },
      });

      console.log(`User ${type}:`, { id, emailAddress, firstName: first_name });
    } catch (error) {
      console.error(`Error handling user ${type}:`, error);
      return new Response('Error processing webhook', { status: 500 });
    }
  }

  if (type === 'user.deleted') {
    const { id } = evt.data;

    try {
      await prisma.user.delete({
        where: {
          id: id,
        },
      });

      console.log('User deleted:', { id });
    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response('Error processing webhook', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}
