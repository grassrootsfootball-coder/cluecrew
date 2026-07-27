import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import type { NormalizedBillingEvent } from '@cluecrew/core';
import { applyBillingEvent } from '@/lib/billing';
import { getStripeClient } from '@/lib/payments/provider';

/**
 * Stripe webhook endpoint (§2): signature-verified, idempotent, and the only
 * path that mutates Subscription.status in real mode.
 */
export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 501 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'signature_required' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'signature_invalid' }, { status: 400 });
  }

  const normalized = normalize(event);
  if (!normalized) return NextResponse.json({ received: true, ignored: event.type });

  const result = await applyBillingEvent(normalized.event, normalized.locate);
  return NextResponse.json({ received: true, ...result });
}

function normalize(event: Stripe.Event): {
  event: NormalizedBillingEvent;
  locate: { parentId?: string; stripeCustomerId?: string; stripeSubId?: string };
} | null {
  const base = { id: event.id, createdAt: new Date(event.created * 1000) };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      return {
        event: {
          ...base,
          type: event.type,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
          stripeSubId: typeof session.subscription === 'string' ? session.subscription : undefined,
        },
        locate: { parentId: session.client_reference_id ?? undefined },
      };
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customer = typeof invoice.customer === 'string' ? invoice.customer : undefined;
      return { event: { ...base, type: event.type }, locate: { stripeCustomerId: customer } };
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      return {
        event: { ...base, type: event.type, stripeStatus: subscription.status },
        locate: {
          stripeSubId: subscription.id,
          stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : undefined,
        },
      };
    }
    default:
      return null;
  }
}
