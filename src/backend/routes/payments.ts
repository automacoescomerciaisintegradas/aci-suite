/**
 * =========================================
 * ACI - Rotas de Pagamento Mercado Pago
 * =========================================
 */

import { Router } from 'express';
import { authMiddleware } from '../auth';
import { creditService } from '../../../services/creditService';

const router = Router();

// Configuração do Mercado Pago
const MP_CONFIG = {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    apiUrl: 'https://api.mercadopago.com',
};

// Pacotes de créditos disponíveis (Modelo Pay-per-use)
const CREDIT_PACKAGES = [
    { id: 'pack-50', value: 50.00, credits: 50000, bonus: 5000, name: 'Valor' },
    { id: 'pack-197', value: 197.00, credits: 250000, bonus: 25000, name: 'Valor' },
    { id: 'pack-397', value: 397.00, credits: 600000, bonus: 60000, name: 'Valor' },
    { id: 'pack-697', value: 697.00, credits: 1200000, bonus: 120000, name: 'Valor' },
    { id: 'pack-999', value: 999.00, credits: 2000000, bonus: 200000, name: 'Valor' },
];

// Bônus de 10% para qualquer recarga
const BONUS_PERCENTAGE = 0.10;

interface PaymentCustomerPayload {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;
}

interface NormalizedPaymentPayload {
    amount: number; // em centavos
    expiresIn: number; // em dias
    description: string;
    customer: PaymentCustomerPayload;
    metadata: {
        externalid: number;
        [key: string]: any;
    };
}

const createdPaymentsByExternalId = new Map<string, any>();
const processedWebhookEvents = new Set<string>();
const creditedPayments = new Set<string>();
const MAX_TRACKED_ITEMS = 5000;

const pruneMap = <T>(map: Map<string, T>, max: number) => {
    while (map.size > max) {
        const oldestKey = map.keys().next().value;
        if (!oldestKey) break;
        map.delete(oldestKey);
    }
};

const addTrackedEvent = (set: Set<string>, value: string) => {
    set.add(value);
    while (set.size > MAX_TRACKED_ITEMS) {
        const oldestKey = set.values().next().value;
        if (!oldestKey) break;
        set.delete(oldestKey);
    }
};

const onlyDigits = (value: unknown): string => String(value ?? '').replace(/\D/g, '');

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const formatPhoneBr = (value: unknown): string => {
    let digits = onlyDigits(value);
    if (digits.length === 13 && digits.startsWith('55')) {
        digits = digits.slice(2);
    }
    if (digits.length === 10) {
        digits = `${digits.slice(0, 2)}9${digits.slice(2)}`;
    }
    if (digits.length !== 11) {
        return '(11) 99999-9999';
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatCpf = (value: unknown): string => {
    const digits = onlyDigits(value);
    if (digits.length !== 11) {
        return '123.456.789-00';
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const toAmountCents = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        if (!Number.isInteger(value)) {
            return Math.round(value * 100);
        }
        return value;
    }

    const raw = String(value ?? '').trim();
    if (!raw) return 0;

    const hasDecimalSeparator = raw.includes(',') || raw.includes('.');
    if (hasDecimalSeparator) {
        const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
    }

    const digits = onlyDigits(raw);
    return digits ? Number(digits) : 0;
};

const clampExpiresInDays = (value: unknown): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 3;
    return Math.min(30, Math.max(1, Math.trunc(parsed)));
};

const toExternalId = (value: unknown): number => {
    const digits = onlyDigits(value);
    if (digits.length > 0) {
        return Number(digits.slice(0, 18));
    }
    const uniqueId = `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    return Number(uniqueId);
};

const normalizeCreateRequest = (body: any): { payload: NormalizedPaymentPayload; warnings: string[] } => {
    const warnings: string[] = [];
    const rawCustomer = body?.customer || {};
    const rawMetadata = body?.metadata || {};

    const amount = Math.max(100, toAmountCents(body?.amount));
    if (!body?.amount) warnings.push('amount não informado, preenchido com valor mínimo.');

    const expiresIn = clampExpiresInDays(body?.expiresIn);
    if (!body?.expiresIn) warnings.push('expiresIn não informado, preenchido com 3 dias.');

    const name = String(rawCustomer?.name || '').trim() || 'Cliente WhatsApp';
    const cellphone = formatPhoneBr(rawCustomer?.cellphone);
    const emailCandidate = String(rawCustomer?.email || '').trim();
    const email = isValidEmail(emailCandidate) ? emailCandidate : 'cliente@example.com';
    const taxId = formatCpf(rawCustomer?.taxId);

    if (!rawCustomer?.name) warnings.push('customer.name não informado.');
    if (!rawCustomer?.cellphone) warnings.push('customer.cellphone não informado.');
    if (!isValidEmail(emailCandidate)) warnings.push('customer.email inválido ou ausente.');
    if (onlyDigits(rawCustomer?.taxId).length !== 11) warnings.push('customer.taxId inválido ou ausente.');

    const externalid = toExternalId(rawMetadata?.externalid);

    const payload: NormalizedPaymentPayload = {
        amount,
        expiresIn,
        description: String(body?.description || 'Pagamento via WhatsApp').trim(),
        customer: {
            name,
            cellphone,
            email,
            taxId,
        },
        metadata: {
            ...rawMetadata,
            externalid,
        },
    };

    return { payload, warnings };
};

export const __paymentsTestUtils = {
    toAmountCents,
    clampExpiresInDays,
    formatPhoneBr,
    formatCpf,
    normalizeCreateRequest,
};

// ==========================================
// CRIAR PAGAMENTO PIX (WHATSAPP/API)
// ==========================================
router.post('/create', authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        if (!MP_CONFIG.accessToken) {
            return res.status(500).json({ error: 'Integração Mercado Pago não configurada' });
        }

        const { payload, warnings } = normalizeCreateRequest(req.body);
        const idempotencyKey = `${userId}:${payload.metadata.externalid}`;

        const cached = createdPaymentsByExternalId.get(idempotencyKey);
        if (cached) {
            return res.json({
                ...cached,
                idempotent: true,
                warnings,
            });
        }

        const amountInReais = payload.amount / 100;
        const expirationDate = new Date(Date.now() + payload.expiresIn * 24 * 60 * 60 * 1000);
        const externalReference = `WHATS-${payload.metadata.externalid}`;

        const baseCredits = Math.floor(amountInReais * 1000);
        const bonusCredits = Math.floor(baseCredits * BONUS_PERCENTAGE);
        const totalCredits = baseCredits + bonusCredits;

        const [firstName, ...rest] = payload.customer.name.split(' ');
        const lastName = rest.join(' ').trim();

        const paymentPayload = {
            transaction_amount: amountInReais,
            description: payload.description,
            payment_method_id: 'pix',
            external_reference: externalReference,
            notification_url: `${process.env.API_URL || 'http://localhost:4001'}/api/payments/webhook`,
            date_of_expiration: expirationDate.toISOString(),
            payer: {
                email: payload.customer.email,
                first_name: firstName || 'Cliente',
                last_name: lastName || 'WhatsApp',
            },
            metadata: {
                ...payload.metadata,
                user_id: userId,
                source: 'whatsapp',
                credits_amount: baseCredits,
                bonus_credits: bonusCredits,
                total_credits: totalCredits,
                customer_tax_id: onlyDigits(payload.customer.taxId),
                customer_cellphone: onlyDigits(payload.customer.cellphone),
            },
        };

        const mpResponse = await fetch(`${MP_CONFIG.apiUrl}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_CONFIG.accessToken}`,
                'X-Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify(paymentPayload),
        });

        const mpData = await mpResponse.json();
        if (!mpResponse.ok) {
            return res.status(mpResponse.status).json({
                success: false,
                error: mpData?.message || 'Erro ao criar pagamento PIX',
                details: mpData,
            });
        }

        const pixData = mpData.point_of_interaction?.transaction_data;
        const responsePayload = {
            success: true,
            idempotent: false,
            warnings,
            payment: {
                id: String(mpData.id),
                status: mpData.status,
                amount: payload.amount,
                expiresIn: payload.expiresIn,
                expiresAt: expirationDate.toISOString(),
                description: payload.description,
                externalid: payload.metadata.externalid,
                externalReference,
                pix: {
                    code: pixData?.qr_code,
                    qrCodeBase64: pixData?.qr_code_base64,
                    ticketUrl: pixData?.ticket_url,
                },
            },
        };

        createdPaymentsByExternalId.set(idempotencyKey, responsePayload);
        pruneMap(createdPaymentsByExternalId, MAX_TRACKED_ITEMS);

        return res.json(responsePayload);
    } catch (error: any) {
        console.error('❌ Erro ao criar pagamento /create:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao criar pagamento',
            message: error?.message || 'unknown',
        });
    }
});

// ==========================================
// CRIAR PAGAMENTO PIX
// ==========================================
router.post('/create-pix', authMiddleware, async (req: any, res) => {
    try {
        const { amount, packageId, description } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        if (!amount || amount < 50) {
            return res.status(400).json({ error: 'Valor mínimo: R$ 50,00' });
        }

        if (!MP_CONFIG.accessToken) {
            return res.status(500).json({ error: 'Integração Mercado Pago não configurada' });
        }

        // Calcular créditos baseado no valor ou pacote
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        const baseCredits = pkg ? pkg.credits : Math.floor(amount * 1000); // 1000/Real se for valor personalizado
        const bonusCredits = Math.floor(baseCredits * BONUS_PERCENTAGE);
        const totalCredits = baseCredits + bonusCredits;

        // Referência externa única
        const externalReference = `ACI-${userId.substring(0, 8)}-${Date.now()}`;

        // Data de expiração (30 minutos)
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 30);

        // Criar pagamento no Mercado Pago
        const paymentPayload = {
            transaction_amount: amount,
            description: description || `Recarga de ${totalCredits.toLocaleString('pt-BR')} créditos ACI`,
            payment_method_id: 'pix',
            external_reference: externalReference,
            notification_url: `${process.env.API_URL || 'http://localhost:4001'}/api/payments/webhook`,
            date_of_expiration: expirationDate.toISOString(),
            payer: {
                email: req.user?.email || 'cliente@aci.com.br',
                first_name: req.user?.name?.split(' ')[0] || 'Cliente',
                last_name: req.user?.name?.split(' ').slice(1).join(' ') || 'ACI',
            },
            metadata: {
                user_id: userId,
                credits_amount: baseCredits,
                bonus_credits: bonusCredits,
                total_credits: totalCredits,
                package_id: packageId,
            },
        };

        console.log('🔄 Criando pagamento PIX:', {
            amount,
            totalCredits,
            userId: userId.substring(0, 8),
        });

        const response = await fetch(`${MP_CONFIG.apiUrl}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_CONFIG.accessToken}`,
                'X-Idempotency-Key': externalReference,
            },
            body: JSON.stringify(paymentPayload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erro Mercado Pago:', data);
            return res.status(response.status).json({
                error: data.message || 'Erro ao criar pagamento PIX',
                details: data,
            });
        }

        // Extrair dados do PIX
        const pixData = data.point_of_interaction?.transaction_data;

        console.log('✅ Pagamento PIX criado:', data.id);

        // Salvar no banco (se usando Prisma ou outro ORM)
        // await prisma.paymentTransaction.create({ ... });

        res.json({
            success: true,
            payment: {
                id: data.id.toString(),
                status: data.status,
                amount: amount,
                credits: totalCredits,
                baseCredits: baseCredits,
                bonusCredits: bonusCredits,
                expiresAt: expirationDate.toISOString(),
                pix: {
                    code: pixData?.qr_code,
                    qrCodeBase64: pixData?.qr_code_base64,
                    ticketUrl: pixData?.ticket_url,
                },
            },
        });
    } catch (error: any) {
        console.error('❌ Erro interno ao criar PIX:', error);
        res.status(500).json({
            error: 'Erro interno ao processar pagamento',
            message: error.message,
        });
    }
});

// ==========================================
// CONSULTAR STATUS DO PAGAMENTO
// ==========================================
router.get('/status/:paymentId', authMiddleware, async (req: any, res) => {
    try {
        const { paymentId } = req.params;

        if (!MP_CONFIG.accessToken) {
            return res.status(500).json({ error: 'Integração não configurada' });
        }

        const response = await fetch(`${MP_CONFIG.apiUrl}/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${MP_CONFIG.accessToken}`,
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Pagamento não encontrado' });
        }

        const data = await response.json();

        res.json({
            id: data.id,
            status: data.status,
            statusDetail: data.status_detail,
            amount: data.transaction_amount,
            paidAt: data.date_approved,
            metadata: data.metadata,
        });
    } catch (error: any) {
        console.error('Erro ao consultar pagamento:', error);
        res.status(500).json({ error: 'Erro ao consultar pagamento' });
    }
});

// ==========================================
// WEBHOOK DO MERCADO PAGO
// ==========================================
router.post('/webhook', async (req, res) => {
    try {
        const { type, data, action } = req.body;
        const eventKey = `${type || 'na'}:${action || 'na'}:${data?.id || 'na'}`;

        console.log(`📩 Webhook MP: ${type} | ${action || 'n/a'} | ID: ${data?.id || 'n/a'}`);

        if (processedWebhookEvents.has(eventKey)) {
            console.log(`↩️ Webhook duplicado ignorado: ${eventKey}`);
            return res.status(200).send('OK');
        }
        addTrackedEvent(processedWebhookEvents, eventKey);

        // Responder rapidamente ao MP
        res.status(200).send('OK');

        // Processar apenas pagamentos
        if (type !== 'payment') {
            return;
        }

        const paymentId = data?.id;
        if (!paymentId) {
            console.error('❌ Webhook sem payment ID');
            return;
        }

        // Buscar detalhes do pagamento
        const paymentResponse = await fetch(`${MP_CONFIG.apiUrl}/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${MP_CONFIG.accessToken}`,
            },
        });

        if (!paymentResponse.ok) {
            console.error('❌ Erro ao buscar pagamento:', paymentId);
            return;
        }

        const payment = await paymentResponse.json();
        const userId = payment.metadata?.user_id;
        const totalCredits = payment.metadata?.total_credits || 0;

        console.log('💳 Pagamento:', {
            id: payment.id,
            status: payment.status,
            userId: userId?.substring(0, 8),
            credits: totalCredits,
        });

        if (payment.status === 'approved') {
            if (creditedPayments.has(String(payment.id))) {
                console.log(`↩️ Crédito já aplicado para pagamento ${payment.id}. Ignorando duplicidade.`);
                return;
            }

            if (userId && totalCredits > 0) {
                try {
                    await creditService.addCredits(
                        userId,
                        totalCredits,
                        `Recarga via Mercado Pago - Pagamento ${payment.id}`,
                        {
                            payment_id: payment.id,
                            gateway: 'mercadopago',
                            amount: payment.transaction_amount,
                            bonus_credits: payment.metadata?.bonus_credits || 0,
                        }
                    );
                    addTrackedEvent(creditedPayments, String(payment.id));
                    console.log(`✅ Pagamento Aprovado: ${totalCredits.toLocaleString('pt-BR')} créditos -> ${userId.substring(0, 8)}`);
                } catch (error) {
                    console.error('❌ Erro ao adicionar créditos:', error);
                }
            }
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
            console.log(`❌ Pagamento ${payment.status}: ${paymentId}`);
        }
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
    }
});

// ==========================================
// PROCESSAR PAGAMENTO COM CARTÃO (BRICK)
// ==========================================
router.post('/process_payment', authMiddleware, async (req: any, res) => {
    try {
        const paymentData = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        if (!MP_CONFIG.accessToken) {
            return res.status(500).json({ error: 'Integração Mercado Pago não configurada' });
        }

        // Recuperar amount do body (pode vir como transaction_amount ou amount)
        const amount = paymentData.transaction_amount || paymentData.amount;

        if (!amount || amount < 1) {
            return res.status(400).json({ error: 'Valor inválido' });
        }

        // Calcular créditos
        // Tenta achar pacote pelo valor exato ou similar
        const pkg = CREDIT_PACKAGES.find(p => Math.abs(p.value - amount) < 0.1);
        const baseCredits = pkg ? pkg.credits : Math.floor(amount * 1000);
        const bonusCredits = Math.floor(baseCredits * BONUS_PERCENTAGE);
        const totalCredits = baseCredits + bonusCredits;

        const externalReference = `ACI-${userId.substring(0, 8)}-${Date.now()}`;

        // Montar payload para a API do MP
        // O Brick envia a maioria dos campos necessários, mas precisamos injetar segurança e metadados
        const payload = {
            ...paymentData,
            transaction_amount: amount,
            description: paymentData.description || `Recarga de ${totalCredits.toLocaleString('pt-BR')} créditos ACI`,
            notification_url: `${process.env.API_URL || 'http://localhost:4001'}/api/payments/webhook`,
            external_reference: externalReference,
            payer: {
                ...paymentData.payer,
                email: paymentData.payer?.email || req.user?.email || 'email@desconhecido.com'
            },
            metadata: {
                user_id: userId,
                credits_amount: baseCredits,
                bonus_credits: bonusCredits,
                total_credits: totalCredits,
                package_id: pkg?.id || 'custom',
            },
            additional_info: {
                items: [
                    {
                        id: pkg?.id || 'custom',
                        title: `Créditos ACI - ${totalCredits}`,
                        quantity: 1,
                        unit_price: amount
                    }
                ]
            }
        };

        console.log('💳 Processando pagamento cartão:', {
            userId: userId.substring(0, 8),
            amount,
            method: paymentData.payment_method_id
        });

        const response = await fetch(`${MP_CONFIG.apiUrl}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_CONFIG.accessToken}`,
                'X-Idempotency-Key': externalReference,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erro Mercado Pago (Cartão):', data);
            return res.status(response.status).json({
                error: data.message || 'Erro ao processar pagamento com cartão',
                details: data,
                status: 'error'
            });
        }

        console.log(`✅ Pagamento processado: ${data.status} | ID: ${data.id}`);

        // O crédito será adicionado via Webhook quando o status for 'approved'
        // Mas retornamos o status atual para o frontend mostrar feedback

        res.json({
            id: data.id,
            status: data.status,
            status_detail: data.status_detail,
            credits: totalCredits,
            amount: amount,
            payment_method_id: data.payment_method_id,
            payment_type_id: data.payment_type_id
        });

    } catch (error: any) {
        console.error('❌ Erro interno ao processar cartão:', error);
        res.status(500).json({
            error: 'Erro interno ao processar pagamento',
            message: error.message,
        });
    }
});

// ==========================================
// LISTAR PACOTES DISPONÍVEIS
// ==========================================
router.get('/packages', (req, res) => {
    res.json({
        packages: CREDIT_PACKAGES,
        bonusPercentage: BONUS_PERCENTAGE * 100,
        minValue: 50,
        conversionRate: 1000, // R$ 1 = 1000 créditos
    });
});

export default router;
