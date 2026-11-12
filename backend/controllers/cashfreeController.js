const crypto = require('crypto');
const GlobalSettings = require('../models/GlobalSettings');
const User = require('../models/User');
const RegistrationPayment = require('../models/RegistrationPayment');

const API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';
const isProduction = () => String(process.env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'production';
const apiBase = () => isProduction() ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

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
    if (record.status === 'SUCCESS') return { paid: true, record };

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
        { $set: { isPaymentDone: true, registrationPaymentOrderId: record.orderId, registrationPaymentId: record.cfPaymentId } }
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
        const backendUrl = (process.env.BACKEND_URL || '').replace(/\/$/, '');
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
                return_url: `${frontendUrl}/dashboard?order_id={order_id}`,
                ...(backendUrl ? { notify_url: `${backendUrl}/api/payments/cashfree/webhook` } : {})
            },
            order_note: 'StockSaathi shop registration'
        };
        const order = await cashfreeRequest('/orders', { method: 'POST', body: JSON.stringify(orderPayload) });
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

exports.handleCashfreeWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        if (!signature || !timestamp || !Buffer.isBuffer(req.body)) return res.status(400).send('Invalid webhook request');
        const { clientSecret } = credentials();
        const expected = crypto.createHmac('sha256', clientSecret).update(timestamp + req.body.toString('utf8')).digest('base64');
        const receivedBuffer = Buffer.from(String(signature));
        const expectedBuffer = Buffer.from(expected);
        if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
            return res.status(401).send('Invalid webhook signature');
        }
        const event = JSON.parse(req.body.toString('utf8'));
        const orderId = event?.data?.order?.order_id;
        if (orderId && event?.data?.payment?.payment_status === 'SUCCESS') {
            await markRegistrationPaid(orderId);
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Cashfree webhook processing failed:', error.message);
        return res.status(500).send('Webhook processing failed');
    }
};
