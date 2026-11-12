const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

let cashfreeSdkPromise;
const cashfreeInstanceCache = new Map();

export const loadCashfreeSdk = () => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Cashfree checkout is only available in a browser.'));
    }
    if (typeof window.Cashfree === 'function') return Promise.resolve(window.Cashfree);
    if (cashfreeSdkPromise) return cashfreeSdkPromise;

    cashfreeSdkPromise = new Promise((resolve, reject) => {
        let script = document.querySelector('script[data-cashfree-sdk="true"]');
        let settled = false;
        const timeout = window.setTimeout(() => finish(new Error('Cashfree checkout could not load. Check your internet connection and retry.')), 15000);
        const finish = (error) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            if (error || typeof window.Cashfree !== 'function') {
                cashfreeSdkPromise = null;
                reject(error || new Error('Cashfree SDK loaded, but checkout is unavailable. Please retry.'));
                return;
            }
            resolve(window.Cashfree);
        };

        if (!script) {
            script = document.createElement('script');
            script.src = CASHFREE_SDK_URL;
            script.async = true;
            script.dataset.cashfreeSdk = 'true';
            script.onload = () => finish();
            script.onerror = () => finish(new Error('Unable to load Cashfree checkout. Your browser or network may be blocking sdk.cashfree.com.'));
            document.head.appendChild(script);
            return;
        }

        if (typeof window.Cashfree === 'function') return finish();
        script.addEventListener('load', () => finish(), { once: true });
        script.addEventListener('error', () => finish(new Error('Unable to load Cashfree checkout.')), { once: true });
    }).catch(error => {
        cashfreeSdkPromise = null;
        throw error;
    });

    return cashfreeSdkPromise;
};

// Prepare the SDK before the customer taps Pay. This preserves the browser's
// user-activation context when checkout() is called from the actual click.
export const prepareCashfreeCheckout = async ({ environment }) => {
    const Cashfree = await loadCashfreeSdk();
    const mode = String(environment || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox';
    let instance = cashfreeInstanceCache.get(mode);
    if (!instance) {
        instance = Cashfree({ mode });
        if (!instance || typeof instance.checkout !== 'function') {
            throw new Error('Cashfree checkout could not be initialized. Please refresh and retry.');
        }
        cashfreeInstanceCache.set(mode, instance);
    }
    return instance;
};

// Intentionally not async: invoke Cashfree synchronously inside the user's click
// handler so mobile browsers do not block the checkout redirect/popup.
export const openCashfreeCheckout = ({ cashfree, paymentSessionId }) => {
    if (!paymentSessionId || typeof paymentSessionId !== 'string' || !paymentSessionId.trim()) {
        throw new Error('Cashfree did not return a valid payment session. Please create a new payment order.');
    }
    if (!cashfree || typeof cashfree.checkout !== 'function') {
        throw new Error('Cashfree is still loading. Please wait a moment and try again.');
    }

    const result = cashfree.checkout({
        paymentSessionId: paymentSessionId.trim(),
        redirectTarget: '_self'
    });

    return Promise.resolve(result).then(response => {
        if (response?.error) {
            const message = response.error.message || response.error.code;
            throw new Error(message ? `Cashfree could not open checkout: ${message}` : 'Cashfree could not open checkout. Please retry.');
        }
        return response;
    });
};

export const preloadCashfreeSdk = () => loadCashfreeSdk().catch(() => null);
