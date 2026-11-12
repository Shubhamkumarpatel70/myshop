const crypto = require('crypto');
const GlobalSettings = require('../models/GlobalSettings');
const User = require('../models/User');
const RegistrationPayment = require('../models/RegistrationPayment');
const WebhookLog = require('../models/WebhookLog');

const API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';
const isProduction = () => String(process.env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'production';
const apiBase = () => isProduction() ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

exports.getCashfreeStatus = async (req, res) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Admin access is required.' });
    }
    const missing = [];
    if (!process.env.CASHFREE_CLIENT_ID) missing.push('CASHFREE_CLIENT_ID');
    if (!process.env.CASHFREE_CLIENT_SECRET) missing.push('CASHFREE_CLIENT_SECRET');
    res.json({
        success: true,
        data: {
            configured: missing.length === 0,
            environment: isProduction() ? 'production' : 'sandbox',
            apiVersion: API_VERSION,
            missing
        }
    });
};

const credentials = () => {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        const error = new Error('Cashfree is not configured. Add CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET in backend environment variables.');
        error.status = 503;
        throw error;
    }
    return { clientId, clientSecret };
};

const cashfreeRequest = async (path, options = {}) => {
    const { clientId, clientSecret } = credentials();
    const response = await fetch(`${apiBase()}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-api-version': API_VERSION,
            'x-client-id': clientId,
            'x-client-secret': clientSecret,
            ...(options.headers || {})
        }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.message || 'Cashfree request failed.');
        error.status = response.status >= 500 ? 502 : 400;
        throw error;
    }
    return data;
};

const markRegistrationPaid = async (orderId) => {
    const record = await RegistrationPayment.findOne({ orderId });
    if (!record || record.paymentMethod !== 'cashfree') return { paid: false, reason: 'Unknown Cashfree order' };
    if (record.status === 'SUCCESS') {
        // Keep legacy successful Cashfree payments in sync with dashboard access.
        await User.updateOne(
            { _id: record.user },
            { $set: {
                isPaymentDone: true,
                approvalStatus: 'Approved',
                registrationPaymentOrderId: record.orderId,
                registrationPaymentId: record.cfPaymentId || ''
            } }
        );
        return { paid: true, record };
    }

    const payments = await cashfreeRequest(`/orders/${encodeURIComponent(orderId)}/payments`, { method: 'GET' });
    const successful = (Array.isArray(payments) ? payments : []).find(payment =>
        payment.payment_status === 'SUCCESS' &&
        Number(payment.payment_amount) === Number(record.amount) &&
        payment.payment_currency === 'INR'
    );
    if (!successful) {
        const latest = Array.isArray(payments) ? payments[payments.length - 1] : null;
        if (latest?.payment_status === 'FAILED' || latest?.payment_status === 'USER_DROPPED') {
            record.status = latest.payment_status;
            await record.save();
        }
        return { paid: false, status: latest?.payment_status || 'PENDING' };
    }

    record.status = 'SUCCESS';
    record.cfPaymentId = String(successful.cf_payment_id || '');
    record.paidAt = new Date();
    await record.save();

    await User.updateOne(
        { _id: record.user },
        { $set: { isPaymentDone: true, approvalStatus: 'Approved', registrationPaymentOrderId: record.orderId, registrationPaymentId: record.cfPaymentId } }
    );
    return { paid: true, record };
};

exports.createRegistrationOrder = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'shop_owner') return res.status(403).json({ success: false, message: 'Only shop owners can pay the registration fee.' });
        if (user.isPaymentDone) return res.status(409).json({ success: false, message: 'Registration payment is already complete.' });
        const settings = await GlobalSettings.findOne();
        if (!settings || !settings.isPaymentRequired) return res.status(400).json({ success: false, message: 'Registration payment is currently disabled.' });
        if ((settings.paymentVerificationMode || 'manual') !== 'cashfree') return res.status(409).json({ success: false, message: 'Cashfree checkout is disabled. Manual verification is currently selected.' });
        const amount = Number(settings.regFee);
        if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'Registration fee is not configured correctly.' });
        const phone = String(user.phone || '').replace(/\D/g, '').slice(-10);
        if (phone.length !== 10) return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required before payment.' });

        const orderId = `SSREG_${String(user._id)}_${Date.now()}`;
        const frontendUrl = (process.env.FRONTEND_URL || 'https://myshop-53hn.onrender.com').replace(/\/$/, '');
        const backendUrl = (process.env.BACKEND_URL || frontendUrl || 'https://myshop-53hn.onrender.com').replace(/\/$/, '');
        const orderPayload = {
            order_id: orderId,
            order_amount: amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: String(user._id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
                customer_name: String(user.ownerName || 'Shop Owner').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 100),
                customer_email: user.email,
                customer_phone: phone
            },
            order_meta: {
                return_url: `${frontendUrl}/checkout?order_id={order_id}&returned=1`,
                ...(backendUrl ? { notify_url: `${backendUrl}/api/payments/cashfree/webhook` } : {})
            },
            order_note: 'StockSaathi shop registration'
        };
        const order = await cashfreeRequest('/orders', {
            method: 'POST',
            headers: { 'x-idempotency-key': crypto.randomUUID() },
            body: JSON.stringify(orderPayload)
        });
        await RegistrationPayment.create({
            user: user._id,
            orderId,
            cfOrderId: String(order.cf_order_id || ''),
            amount,
            currency: 'INR',
            paymentSessionId: order.payment_session_id,
            paymentMethod: 'cashfree',
            status: 'ACTIVE',
            environment: isProduction() ? 'production' : 'sandbox'
        });
        user.registrationPaymentOrderId = orderId;
        await user.save();
        res.status(201).json({
            success: true,
            data: {
                order_id: orderId,
                payment_session_id: order.payment_session_id,
                environment: isProduction() ? 'production' : 'sandbox',
                amount
            }
        });
    } catch (error) {
        console.error('Cashfree order creation failed:', error.message);
        res.status(error.status || 500).json({ success: false, message: error.status === 503 ? error.message : 'Unable to create Cashfree payment order. Please try again.' });
    }
};

exports.verifyRegistrationOrder = async (req, res) => {
    try {
        const { order_id: orderId } = req.query;
        if (!orderId) return res.status(400).json({ success: false, message: 'order_id is required.' });
        const record = await RegistrationPayment.findOne({ orderId, user: req.user._id, paymentMethod: 'cashfree' });
        if (!record) return res.status(404).json({ success: false, message: 'Registration payment order not found for this account.' });
        const result = await markRegistrationPaid(orderId);
        res.json({ success: true, data: { paid: result.paid, status: result.record?.status || result.status || record.status } });
    } catch (error) {
        console.error('Cashfree payment verification failed:', error.message);
        res.status(error.status || 502).json({ success: false, message: 'Unable to verify payment with Cashfree right now. Please retry shortly.' });
    }
};

const classifyCashfreeEvent = (eventType = '') => {
    const type = String(eventType).toUpperCase();
    if (type.includes('PAYMENT')) return 'payment';
    if (type.includes('REFUND')) return 'refund';
    if (type.includes('DISPUTE')) return 'dispute';
    if (type.includes('SETTLEMENT')) return 'settlement';
    if (type.includes('VENDOR') || type.includes('VBA') || type.includes('INSTRUMENT')) return 'payout';
    if (type.includes('INCIDENT')) return 'incident';
    return 'other';
};

const updateFailedPaymentFromWebhook = async (orderId, paymentData = {}) => {
    const status = String(paymentData.payment_status || '').toUpperCase();
    if (!['FAILED', 'USER_DROPPED'].includes(status)) return;
    if (String(orderId).startsWith('SSPAY_')) {
        const payment = await Payment.findOne({ cashfreeOrderId: orderId });
        if (!payment || payment.status === 'SUCCESS') return;
        payment.status = status;
        payment.cashfreePaymentId = String(paymentData.cf_payment_id || payment.cashfreePaymentId || '');
        payment.gatewayResponse = paymentData;
        await payment.save();
        return;
    }
    const registration = await RegistrationPayment.findOne({ orderId, paymentMethod: 'cashfree' });
    if (!registration || registration.status === 'SUCCESS') return;
    registration.status = status;
    registration.cfPaymentId = String(paymentData.cf_payment_id || registration.cfPaymentId || '');
    await registration.save();
};

exports.handleCashfreeWebhook = async (req, res) => {
    let webhookEventId = null;
    try {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        if (!signature || !timestamp || !Buffer.isBuffer(req.body)) return res.status(400).send('Invalid webhook request');
        const { clientSecret } = credentials();
        const rawBody = req.body.toString('utf8');
        const expected = crypto.createHmac('sha256', clientSecret).update(timestamp + rawBody).digest('base64');
        const receivedBuffer = Buffer.from(String(signature));
        const expectedBuffer = Buffer.from(expected);
        if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
            return res.status(401).send('Invalid webhook signature');
        }

        const event = JSON.parse(rawBody);
        const orderId = event?.data?.order?.order_id || event?.data?.order_id || null;
        const paymentData = event?.data?.payment || {};
        const paymentId = paymentData.cf_payment_id || event?.data?.refund?.cf_refund_id || 'no-reference';
        const eventType = event?.type || event?.event_type || 'UNKNOWN';
        const category = classifyCashfreeEvent(eventType);
        webhookEventId = [orderId || 'no-order', paymentId, eventType, timestamp].join(':');
        const log = await WebhookLog.findOneAndUpdate(
            { eventId: webhookEventId },
            { $setOnInsert: {
                eventId: webhookEventId, orderId, eventType, category,
                summary: `${category} event received`, payload: event, status: 'RECEIVED'
            } },
            { upsert: true, new: true }
        );
        if (log.status === 'PROCESSED') return res.status(200).json({ success: true, duplicate: true });

        if (orderId && String(paymentData.payment_status || '').toUpperCase() === 'SUCCESS') {
            if (String(orderId).startsWith('SSPAY_')) await activatePaidPlan(orderId);
            else await markRegistrationPaid(orderId);
        } else if (orderId) {
            await updateFailedPaymentFromWebhook(orderId, paymentData);
        }

        const refundStatus = event?.data?.refund?.refund_status;
        const summary = category === 'payment'
            ? `Payment ${String(paymentData.payment_status || 'updated').toLowerCase()}`
            : category === 'refund'
                ? `Refund ${String(refundStatus || 'update').toLowerCase()}`
                : category === 'settlement' ? 'Settlement update received'
                    : category === 'dispute' ? 'Dispute update received'
                        : `${category} event received`;

        await WebhookLog.updateOne({ eventId: webhookEventId }, { $set: { status: 'PROCESSED', summary, processedAt: new Date() } });
        return res.status(200).json({ success: true, received: true, category });
    } catch (error) {
        if (webhookEventId) await WebhookLog.updateOne({ eventId: webhookEventId }, { $set: { status: 'FAILED' } }).catch(() => {});
        console.error('Cashfree webhook processing failed:', error.message);
        return res.status(500).send('Webhook processing failed');
    }
};

exports.getCashfreeWebhookEvents = async (req, res) => {
    try {
        const [events, total, failed, pending] = await Promise.all([
            WebhookLog.find().sort({ createdAt: -1 }).limit(100).select('eventId orderId eventType category summary status createdAt processedAt').lean(),
            WebhookLog.countDocuments(),
            WebhookLog.countDocuments({ status: 'FAILED' }),
            WebhookLog.countDocuments({ status: 'RECEIVED' })
        ]);
        res.json({ success: true, data: events, summary: { total, failed, pending, processed: Math.max(0, total - failed - pending) } });
    } catch (error) {
        console.error('Cashfree webhook event list failed:', error.message);
        res.status(500).json({ success: false, message: 'Unable to load Cashfree webhook events.' });
    }
};

const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const AuditLog = require('../models/AuditLog');

// Return the authenticated user's Cashfree order details for the hosted checkout page.
// The payment session is only returned to the order owner and is never placed in the URL.
exports.getCashfreeCheckoutOrder = async (req, res) => {
    try {
        const orderId = String(req.query.order_id || '').trim();
        if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required.' });

        const registration = await RegistrationPayment.findOne({
            orderId,
            user: req.user._id,
            paymentMethod: 'cashfree'
        });

        if (registration) {
            return res.json({
                success: true,
                data: {
                    order_id: registration.orderId,
                    amount: registration.amount,
                    currency: registration.currency || 'INR',
                    purpose: 'Registration fee',
                    // Always return a usable SDK mode for legacy records.
                    // The status endpoint is admin-only and must not be called
                    // by a shop owner just to initialize their own checkout.
                    environment: registration.environment || (isProduction() ? 'production' : 'sandbox'),
                    status: registration.status,
                    payment_session_id: registration.paymentSessionId
                }
            });
        }

        const payment = await Payment.findOne({
            cashfreeOrderId: orderId,
            user: req.user._id
        }).populate('plan', 'name');

        if (!payment) return res.status(404).json({ success: false, message: 'This payment order was not found for your account.' });

        let sessionId = payment.paymentSessionId;
        if (!sessionId && payment.status !== 'SUCCESS') {
            const cashfreeOrder = await cashfreeRequest(`/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
            sessionId = cashfreeOrder.payment_session_id || '';
            if (sessionId) {
                payment.paymentSessionId = sessionId;
                await payment.save();
            }
        }

        return res.json({
            success: true,
            data: {
                order_id: payment.cashfreeOrderId,
                amount: payment.amount,
                currency: 'INR',
                purpose: payment.addonName || (payment.plan?.name ? `${payment.plan.name} subscription` : 'Subscription'),
                plan: payment.plan?.name || payment.addonName || '',
                environment: isProduction() ? 'production' : 'sandbox',
                status: payment.status,
                payment_session_id: sessionId || ''
            }
        });
    } catch (error) {
        console.error('Cashfree checkout order lookup failed:', error.message);
        res.status(error.status || 500).json({
            success: false,
            message: error.status === 503 ? error.message : 'Unable to load this payment order. Please try again.'
        });
    }
};

const activatePaidPlan = async (orderId) => {
    const payment = await Payment.findOne({ cashfreeOrderId: orderId }).populate('plan');
    if (!payment) return { paid: false, reason: 'Unknown subscription order' };
    if (payment.status === 'SUCCESS') return { paid: true, payment };
    const payments = await cashfreeRequest(`/orders/${encodeURIComponent(orderId)}/payments`, { method: 'GET' });
    const successful = (Array.isArray(payments) ? payments : []).find(item =>
        item.payment_status === 'SUCCESS' &&
        Number(item.payment_amount) === Number(payment.amount) &&
        item.payment_currency === 'INR'
    );
    if (!successful) {
        const latest = Array.isArray(payments) ? payments[payments.length - 1] : null;
        if (latest?.payment_status === 'FAILED' || latest?.payment_status === 'USER_DROPPED') {
            payment.status = latest.payment_status;
            payment.gatewayResponse = latest;
            await payment.save();
        }
        return { paid: false, status: latest?.payment_status || payment.status };
    }

    const user = await User.findById(payment.user);
    if (!user || (!payment.plan && !payment.addonName)) throw new Error('Subscription owner, plan, or add-on no longer exists.');
    const now = new Date();
    payment.status = 'SUCCESS';
    payment.cashfreePaymentId = String(successful.cf_payment_id || '');
    payment.paymentDate = now;
    payment.gatewayResponse = successful;
    await payment.save();

    let activatedItem = payment.addonName || payment.plan.name;
    if (payment.addonName === 'Barcode Booster') {
        user.hasBarcodeAddon = true;
        user.subscriptionPlan = 'Enterprise';
    } else if (payment.addonName === 'Team Expansion') {
        user.hasStaffAddon = true;
        user.subscriptionPlan = 'Enterprise';
    } else if (payment.plan) {
        const expiry = new Date(now);
        if (payment.plan.duration === 'month') expiry.setMonth(expiry.getMonth() + 1);
        else if (payment.plan.duration === 'year') expiry.setFullYear(expiry.getFullYear() + 1);
        else if (payment.plan.duration === 'forever') expiry.setFullYear(expiry.getFullYear() + 50);
        else expiry.setFullYear(expiry.getFullYear() + 1);
        user.subscriptionPlan = payment.plan.name;
        user.planActivatedAt = now;
        user.planExpiresAt = payment.plan.duration === 'forever' ? null : expiry;
        user.subscriptionHistory.push({ plan: payment.plan.name, startDate: now, endDate: payment.plan.duration === 'forever' ? null : expiry, amount: payment.amount, paymentRef: payment.cashfreePaymentId || payment.paymentId });
    }
    user.pendingSubscription.status = 'None';
    user.pendingSubscription.rejectReason = '';
    await user.save();
    await AuditLog.create({ user: user._id, shop: user._id, action: payment.addonName ? 'Add-on activated by Cashfree' : 'Subscription activated by Cashfree', module: 'Subscription Payment', details: { paymentId: payment.paymentId, orderId, item: activatedItem, amount: payment.amount } });
    return { paid: true, payment };
};

exports.createSubscriptionOrder = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'shop_owner') return res.status(403).json({ success: false, message: 'Only shop owners can purchase a plan.' });
        const addonPrices = { 'Barcode Booster': 499, 'Team Expansion': 999 };
        const addonName = String(req.body.addonName || '').trim();
        const isAddon = Boolean(addonName);
        const plan = isAddon ? null : await Plan.findOne({ _id: req.body.planId, isActive: true });
        if (isAddon && !Object.prototype.hasOwnProperty.call(addonPrices, addonName)) return res.status(400).json({ success: false, message: 'Selected add-on is not available.' });
        if (!isAddon && !plan) return res.status(404).json({ success: false, message: 'Selected plan is unavailable.' });
        if (isAddon && ((addonName === 'Barcode Booster' && user.hasBarcodeAddon) || (addonName === 'Team Expansion' && user.hasStaffAddon))) return res.status(409).json({ success: false, message: 'This add-on is already active.' });
        let amount = isAddon ? addonPrices[addonName] : Number(plan.price);
        const currentPlan = isAddon ? null : await Plan.findOne({ name: user.subscriptionPlan });
        if (!isAddon && currentPlan && user.planExpiresAt && new Date(user.planExpiresAt) > new Date()) {
            const activatedAt = new Date(user.planActivatedAt || user.createdAt);
            const expiresAt = new Date(user.planExpiresAt);
            const duration = expiresAt - activatedAt;
            if (duration > 0) {
                const usedRatio = Math.min(1, Math.max(0, (Date.now() - activatedAt.getTime()) / duration));
                const credit = Math.floor(Number(currentPlan.price || 0) * (1 - usedRatio));
                amount = Math.max(0, amount - credit);
            }
        }
        amount = Number(amount.toFixed(2));
        if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'The selected plan has no payable balance after applying your remaining plan credit.' });
        const phone = String(user.phone || '').replace(/\D/g, '').slice(-10);
        if (phone.length !== 10) return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required.' });

        const paymentId = `SSPAY_${user._id}_${Date.now()}`;
        const idempotencyKey = crypto.randomUUID();
        const orderPayload = {
            order_id: paymentId,
            order_amount: amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: String(user._id).slice(0, 50),
                customer_name: String(user.ownerName || 'Shop Owner').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 100),
                customer_email: user.email,
                customer_phone: phone
            },
            order_meta: {
                return_url: `${(process.env.FRONTEND_URL || 'https://myshop-53hn.onrender.com').replace(/\/$/, '')}/checkout?order_id={order_id}&returned=1`,
                notify_url: `${(process.env.BACKEND_URL || process.env.FRONTEND_URL || 'https://myshop-53hn.onrender.com').replace(/\/$/, '')}/api/payments/cashfree/webhook`
            },
            order_note: isAddon ? `Stock Saathi ${addonName} add-on` : `Stock Saathi ${plan.name} subscription`
        };
        const order = await cashfreeRequest('/orders', {
            method: 'POST',
            headers: { 'x-idempotency-key': idempotencyKey },
            body: JSON.stringify(orderPayload)
        });
        await Payment.create({
            paymentId,
            cashfreeOrderId: paymentId,
            user: user._id,
            ...(plan ? { plan: plan._id } : {}),
            ...(isAddon ? { addonName } : {}),
            amount,
            status: 'PENDING',
            gatewayResponse: { cf_order_id: order.cf_order_id },
            paymentSessionId: order.payment_session_id,
            idempotencyKey
        });
        res.status(201).json({ success: true, data: { order_id: paymentId, payment_session_id: order.payment_session_id, environment: isProduction() ? 'production' : 'sandbox', amount, plan: plan?.name || addonName } });
    } catch (error) {
        console.error('Subscription Cashfree order failed:', error.message);
        res.status(error.status || 500).json({ success: false, message: error.status === 503 ? error.message : 'Unable to create subscription payment. Please try again.' });
    }
};

exports.verifySubscriptionOrder = async (req, res) => {
    try {
        const orderId = String(req.query.order_id || '');
        if (!orderId) return res.status(400).json({ success: false, message: 'order_id is required.' });
        const payment = await Payment.findOne({ cashfreeOrderId: orderId, user: req.user._id });
        if (!payment) return res.status(404).json({ success: false, message: 'Subscription payment order not found.' });
        const result = await activatePaidPlan(orderId);
        res.json({ success: true, data: { paid: result.paid, status: result.payment?.status || result.status || payment.status } });
    } catch (error) {
        res.status(error.status || 502).json({ success: false, message: 'Unable to verify subscription payment right now.' });
    }
};
