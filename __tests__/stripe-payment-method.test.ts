import { describe, it, expect, jest } from '@jest/globals';
import type Stripe from 'stripe';
import { resolvePaymentMethod } from '@/lib/stripe/payment-method';

/** Minimal Stripe stub whose PaymentIntent resolves to the given charge type. */
function stripeWithChargeType(type: string | undefined) {
    return {
        paymentIntents: {
            retrieve: jest.fn(async () => ({
                latest_charge: type ? { payment_method_details: { type } } : null,
            })),
        },
    } as unknown as Stripe;
}

function stripeThatFails() {
    return {
        paymentIntents: {
            retrieve: jest.fn(async () => {
                throw new Error('no such payment_intent');
            }),
        },
    } as unknown as Stripe;
}

function session(overrides: Partial<Stripe.Checkout.Session> = {}) {
    return {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
        payment_method_types: ['card', 'us_bank_account'],
        ...overrides,
    } as Stripe.Checkout.Session;
}

describe('resolvePaymentMethod', () => {
    it('labels a card payment credit_card even when ACH is also enabled on the session', async () => {
        // The original bug: payment_method_types lists what is *allowed*, so a
        // card payment on an ACH-enabled account was recorded as "ach".
        const method = await resolvePaymentMethod(stripeWithChargeType('card'), session());
        expect(method).toBe('credit_card');
    });

    it('labels a genuine bank debit as ach', async () => {
        const method = await resolvePaymentMethod(
            stripeWithChargeType('us_bank_account'),
            session()
        );
        expect(method).toBe('ach');
    });

    it('treats card-backed methods (link, card_present) as credit_card', async () => {
        expect(await resolvePaymentMethod(stripeWithChargeType('link'), session())).toBe(
            'credit_card'
        );
        expect(await resolvePaymentMethod(stripeWithChargeType('card_present'), session())).toBe(
            'credit_card'
        );
    });

    it('falls back to credit_card for an unmapped charge type', async () => {
        const method = await resolvePaymentMethod(stripeWithChargeType('klarna'), session());
        expect(method).toBe('credit_card');
    });

    describe('when the charge cannot be inspected', () => {
        it('uses the allow-list only when it is unambiguous', async () => {
            const method = await resolvePaymentMethod(
                stripeThatFails(),
                session({ payment_method_types: ['us_bank_account'] })
            );
            expect(method).toBe('ach');
        });

        it('does not guess ach from an ambiguous allow-list', async () => {
            const method = await resolvePaymentMethod(stripeThatFails(), session());
            expect(method).toBe('credit_card');
        });

        it('handles a session with no payment intent at all', async () => {
            const method = await resolvePaymentMethod(
                stripeWithChargeType('card'),
                session({ payment_intent: null })
            );
            expect(method).toBe('credit_card');
        });
    });

    it('accepts an expanded payment_intent object, not just an id', async () => {
        const stripe = stripeWithChargeType('us_bank_account');
        const method = await resolvePaymentMethod(
            stripe,
            session({ payment_intent: { id: 'pi_expanded' } as Stripe.PaymentIntent })
        );
        expect(method).toBe('ach');
        expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_expanded', {
            expand: ['latest_charge'],
        });
    });
});
