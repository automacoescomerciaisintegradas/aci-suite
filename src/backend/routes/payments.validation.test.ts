import { describe, it, expect } from 'vitest';
import { __paymentsTestUtils } from './payments';

describe('payments validation helpers', () => {
    it('converte valor em reais para centavos', () => {
        expect(__paymentsTestUtils.toAmountCents('29,90')).toBe(2990);
        expect(__paymentsTestUtils.toAmountCents(19.9)).toBe(1990);
        expect(__paymentsTestUtils.toAmountCents('2990')).toBe(2990);
    });

    it('normaliza payload com defaults e limites', () => {
        const { payload } = __paymentsTestUtils.normalizeCreateRequest({
            amount: '',
            expiresIn: 99,
            customer: {
                name: '',
                cellphone: '11999998888',
                email: 'email-invalido',
                taxId: '123',
            },
            metadata: {},
        });

        expect(payload.amount).toBe(100);
        expect(payload.expiresIn).toBe(30);
        expect(payload.customer.name).toBe('Cliente WhatsApp');
        expect(payload.customer.cellphone).toBe('(11) 99999-8888');
        expect(payload.customer.email).toBe('cliente@example.com');
        expect(payload.customer.taxId).toBe('123.456.789-00');
        expect(typeof payload.metadata.externalid).toBe('number');
    });
});
