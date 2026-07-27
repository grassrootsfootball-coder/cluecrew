/**
 * Payment provider abstraction (BUILD-PHASE-2 §2). With STRIPE_SECRET_KEY set
 * (staging/production), the real Stripe provider is used. Without it (dev,
 * CI), the dev provider simulates the same flows so the full journey —
 * including webhook-driven status transitions — runs end-to-end with no keys.
 */
import Stripe from 'stripe';
import { PRICING, type PaidTier } from '@cluecrew/core';

export interface CheckoutInput {
  parentId: string;
  tier: PaidTier;
  customerEmail: string;
  origin: string;
}

export interface PaymentProvider {
  kind: 'stripe' | 'dev';
  createCheckoutSession(input: CheckoutInput): Promise<{ url: string }>;
  cancelSubscription(stripeSubId: string): Promise<void>;
  /** Full refund of every charge for the customer (cooling-off, §2.2). */
  refundAllCharges(stripeCustomerId: string): Promise<number>;
}

function priceIdFor(tier: PaidTier): string {
  const envKey = { TWO_YEAR: 'STRIPE_PRICE_2YR', ONE_YEAR: 'STRIPE_PRICE_1YR', SUMMER: 'STRIPE_PRICE_SUMMER' }[tier];
  const priceId = process.env[envKey];
  if (!priceId) throw new Error(`${envKey} is not configured`);
  return priceId;
}

class StripeProvider implements PaymentProvider {
  readonly kind = 'stripe' as const;
  readonly client: Stripe;

  constructor(secretKey: string) {
    this.client = new Stripe(secretKey);
  }

  async createCheckoutSession(input: CheckoutInput): Promise<{ url: string }> {
    const oneOff = PRICING[input.tier].billing === 'one_off';
    const session = await this.client.checkout.sessions.create({
      mode: oneOff ? 'payment' : 'subscription',
      line_items: [{ price: priceIdFor(input.tier), quantity: 1 }],
      customer_email: input.customerEmail,
      client_reference_id: input.parentId,
      success_url: `${input.origin}/parent/billing?checkout=success`,
      cancel_url: `${input.origin}/parent/billing?checkout=cancelled`,
      // Receipts and VAT invoices on every charge (§2): enable in the Stripe
      // dashboard (email receipts + automatic invoices); enforced at gate #1.
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return { url: session.url };
  }

  async cancelSubscription(stripeSubId: string): Promise<void> {
    await this.client.subscriptions.cancel(stripeSubId);
  }

  async refundAllCharges(stripeCustomerId: string): Promise<number> {
    let refundedPence = 0;
    const charges = await this.client.charges.list({ customer: stripeCustomerId, limit: 100 });
    for (const charge of charges.data) {
      if (charge.paid && !charge.refunded) {
        await this.client.refunds.create({ charge: charge.id });
        refundedPence += charge.amount;
      }
    }
    return refundedPence;
  }
}

/**
 * Dev provider: checkout redirects to an in-app confirmation page; the
 * confirm button synthesizes the same billing events the Stripe webhook
 * would deliver. Cancellation/refund side effects are synthesized by the
 * billing module, so these are deliberate no-ops.
 */
class DevProvider implements PaymentProvider {
  readonly kind = 'dev' as const;

  async createCheckoutSession(input: CheckoutInput): Promise<{ url: string }> {
    return { url: `${input.origin}/parent/billing/dev-checkout?tier=${input.tier}` };
  }

  async cancelSubscription(): Promise<void> {}

  async refundAllCharges(): Promise<number> {
    return 0;
  }
}

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new StripeProvider(key) : new DevProvider();
  return cached;
}

export function getStripeClient(): Stripe | null {
  const provider = getPaymentProvider();
  return provider.kind === 'stripe' ? (provider as StripeProvider).client : null;
}
