import { describe, it, expect } from '@jest/globals';
import { derivePayoutBatchId } from '@/lib/paypal/sender-batch-id';

describe('derivePayoutBatchId', () => {
    it('is deterministic for the same inputs', () => {
        const a = derivePayoutBatchId('vendor1', ['e1', 'e2'], 123.45);
        const b = derivePayoutBatchId('vendor1', ['e1', 'e2'], 123.45);
        expect(a).toBe(b);
    });

    it('is order-independent for entry ids', () => {
        const a = derivePayoutBatchId('vendor1', ['e1', 'e2'], 123.45);
        const b = derivePayoutBatchId('vendor1', ['e2', 'e1'], 123.45);
        expect(a).toBe(b);
    });

    it('differs when the vendor differs', () => {
        const a = derivePayoutBatchId('vendor1', ['e1', 'e2'], 123.45);
        const b = derivePayoutBatchId('vendor2', ['e1', 'e2'], 123.45);
        expect(a).not.toBe(b);
    });

    it('differs when the entry set differs', () => {
        const a = derivePayoutBatchId('vendor1', ['e1', 'e2'], 123.45);
        const b = derivePayoutBatchId('vendor1', ['e1', 'e2', 'e3'], 123.45);
        expect(a).not.toBe(b);
    });

    it('differs when the amount differs', () => {
        const a = derivePayoutBatchId('vendor1', ['e1', 'e2'], 123.45);
        const b = derivePayoutBatchId('vendor1', ['e1', 'e2'], 123.46);
        expect(a).not.toBe(b);
    });
});
