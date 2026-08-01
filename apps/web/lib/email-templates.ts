/**
 * Transactional email set (BUILD-PHASE-2 §7). Parent voice per manifesto §6:
 * plain English, no eduspeak, no fear, explains what to do. No marketing
 * content — marketing email requires an explicit opt-in consent event.
 */
import { COOLING_OFF_DAYS, formatPence, PRICING, type PricedTier } from '@cluecrew/core';

export interface EmailContent {
  subject: string;
  text: string;
}

const signoff = '\n\nThe ClueCrew team\n(Questions? Just reply to this email.)';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function verifyEmailTemplate(name: string, link: string): EmailContent {
  return {
    subject: 'Verify your ClueCrew email',
    text: `Welcome to ClueCrew, ${name}.\n\nPlease confirm your email address by opening this link:\n${link}\n\nThe link is valid for 24 hours. If you did not create this account, you can ignore this email.${signoff}`,
  };
}

export function welcomeTrialStartedTemplate(name: string, tier: PricedTier, trialEndsAt: Date): EmailContent {
  const pricing = PRICING[tier];
  return {
    subject: 'Your ClueCrew trial has started',
    text: `Hello ${name},\n\nYour 7-day free trial of ${pricing.displayName} is now running — no card needed, nothing to cancel if you decide it is not for you.\n\nYour trial ends on ${formatDate(trialEndsAt)}. If you would like to continue after that, you can add payment details any time from Parent HQ → Billing. If you do nothing, the trial simply ends and we will not charge you.\n\nA good first step: open Parent HQ and have a look at the "what happens next" checklist.${signoff}`,
  };
}

export function trialEndingTemplate(name: string, tier: PricedTier, trialEndsAt: Date): EmailContent {
  const pricing = PRICING[tier];
  return {
    subject: 'Your ClueCrew trial ends in 2 days',
    text: `Hello ${name},\n\nA quick reminder: your free trial of ${pricing.displayName} ends on ${formatDate(trialEndsAt)}.\n\nTo keep going, add payment details in Parent HQ → Billing (${formatPence(pricing.amountPence)}${pricing.billing === 'monthly' ? ' per month' : ' one-off'}, total ${formatPence(pricing.totalContractValuePence)} over ${pricing.commitmentMonths} months). If you do nothing, the trial ends and you will not be charged anything.${signoff}`,
  };
}

export function receiptTemplate(name: string, tier: PricedTier, amountPence: number): EmailContent {
  return {
    subject: 'Your ClueCrew receipt',
    text: `Hello ${name},\n\nThank you — we have received your payment of ${formatPence(amountPence)} for ${PRICING[tier].displayName}. Your VAT invoice from our payment provider follows separately.\n\nYou can see all invoices in Parent HQ → Billing.${signoff}`,
  };
}

export function paymentIssueTemplate(name: string): EmailContent {
  return {
    subject: 'A payment did not go through — no access lost yet',
    text: `Hello ${name},\n\nYour latest ClueCrew payment did not go through. This happens for all sorts of ordinary reasons — an expired card is the most common.\n\nNothing has been lost: your child's account and all their progress are safe, and access continues while we retry over the next few days. To sort it now, update your card in Parent HQ → Billing.${signoff}`,
  };
}

export function renewalReminderTemplate(
  name: string,
  tier: PricedTier,
  renewalDate: Date,
  daysAhead: number,
): EmailContent {
  const pricing = PRICING[tier];
  return {
    subject: `Your ClueCrew plan renews in ${daysAhead} days`,
    text: `Hello ${name},\n\nYour ${pricing.displayName} plan reaches the end of its ${pricing.commitmentMonths}-month term on ${formatDate(renewalDate)}.\n\nIf you would like to continue, you do not need to do anything. If you would like to stop, cancelling takes two clicks in Parent HQ → Billing — no phone calls, no forms.${signoff}`,
  };
}

export function cancellationConfirmedTemplate(name: string, accessUntil: Date | null): EmailContent {
  return {
    subject: 'Your ClueCrew cancellation is confirmed',
    text: `Hello ${name},\n\nYour cancellation is confirmed — no further payments will be taken.${accessUntil ? ` You and your child keep full access until ${formatDate(accessUntil)}.` : ''}\n\nYour child's progress is kept safe for 30 days in case you change your mind; after that it is permanently deleted. You can export everything from Parent HQ → Account at any time before then.${signoff}`,
  };
}

export function coolingOffRefundTemplate(name: string, amountPence: number): EmailContent {
  return {
    subject: 'Your refund is on its way',
    text: `Hello ${name},\n\nAs requested within the ${COOLING_OFF_DAYS}-day cooling-off period, we have refunded ${formatPence(amountPence)} in full. Depending on your bank it can take 5–10 working days to appear.\n\nNo questions, no hard feelings — and if the 11+ picture changes, you are always welcome back.${signoff}`,
  };
}

export function bursaryReceivedTemplate(name: string): EmailContent {
  return {
    subject: 'We have received your Crew Bursary application',
    text: `Hello ${name},\n\nThank you for applying for a Crew Bursary place. We review applications in the order they arrive and will email you with a decision — usually within a week.\n\nYour supporting document is stored securely, is only seen by the small team who review applications, and is deleted within 30 days of the decision.${signoff}`,
  };
}

export function bursaryApprovedTemplate(name: string): EmailContent {
  return {
    subject: 'Your Crew Bursary place is confirmed',
    text: `Hello ${name},\n\nGood news — your Crew Bursary place is confirmed. Your family now has full access to everything in ClueCrew, exactly the same product as every other family, for the full two-year programme.\n\nSign in and set up your child's profile whenever you are ready.${signoff}`,
  };
}

export function bursaryWaitlistTemplate(name: string): EmailContent {
  return {
    subject: 'Your Crew Bursary application — waitlist',
    text: `Hello ${name},\n\nThank you for your application. Bursary places open up as our community grows, and right now they are all taken — so we have added you to the waitlist and will email you the moment a place opens.\n\nYou do not need to do anything else; your place in the queue is safe.${signoff}`,
  };
}

/**
 * Double opt-in for the Founding Crew waitlist (DEMAND-TEST-PACK §3; V2 §2).
 * When the signup came through the Region Decoder, the promised one-page
 * guide travels IN this email — value first, list-join only after the tap.
 */
export function waitlistConfirmTemplate(
  link: string,
  regionGuide: { name: string; guideUrl: string } | null = null,
): EmailContent {
  const guide = regionGuide
    ? `\n\nYour one-page guide to the 11+ in ${regionGuide.name} is here:\n${regionGuide.guideUrl}\n(Schools change providers — always confirm with the school for your entry year.)`
    : '';
  return {
    subject: regionGuide
      ? `Your ${regionGuide.name} 11+ guide — and one tap to join the waitlist`
      : 'One tap to join the Founding Crew waitlist',
    text: `Hello,${guide}\n\nTap the link below to confirm your place on the ClueCrew Founding Crew waitlist:\n\n${link}\n\nWe'll email you about ClueCrew's launch and nothing else, and you can unsubscribe any time. If this wasn't you, ignore this email and the address never joins the list.${signoff}`,
  };
}

export function accountLockedTemplate(name: string, attempts: number, minutes: number): EmailContent {
  return {
    subject: 'ClueCrew: your account is temporarily locked',
    text: `Hello ${name},\n\nThere were ${attempts} unsuccessful sign-in attempts on your account, so we locked it for ${minutes} minutes as a precaution. If this was you, just try again shortly. If it was not, please reset your password once the lock lifts.${signoff}`,
  };
}
