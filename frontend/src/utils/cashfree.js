const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

let cashfreeSdkPromise;
let cashfreeInstanceCache = new Map();

// Warm up the SDK while the payment screen is displayed, not after Pay is tapped.
export const preloadCashfreeSdk = () => loadCashfreeSdk().catch(() => null);

export const loadCashfreeSdk = () => {
    if (typeof window === 'undefined') return Promise.reject(new Error('Cashfree checkout is only available in a browser.'));
    if (typeof window.Cashfree === 'function') return Promise.resolve(window.Cashfree);
    if (cashfreeSdkPromise) return cashfreeSdkPromise;

    cashfreeSdkPromise = new Promise((resolve, reject) => {
        let script = document.querySelector('script[data-cashfree-sdk="true"]');
        let settled = false;
        const timeout = window.setTimeout(() => finish(new Error('Cashfree checkout took too long to load. Check your internet connection and try again.')), 15000);
        const finish = (error) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            if (error || typeof window.Cashfree !== 'function') {
                cashfreeSdkPromise = null;
                reject(error || new Error('Cashfree SDK loaded, but checkout is unavailable. Refresh the page and try again.'));
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
            script.onerror = () => finish(new Error('Unable to load Cashfree checkout. Check that sdk.cashfree.com is not blocked.'));
            document.head.appendChild(script);
            return;
        }

        script.addEventListener('load', () => finish(), { once: true });
        script.addEventListener('error', () => finish(new Error('Unable to load Cashfree checkout.')), { once: true });
        if (typeof window.Cashfree === 'function') finish();
    }).catch(error => {
        cashfreeSdkPromise = null;
        throw error;
    });

    return cashfreeSdkPromise;
};

export const openCashfreeCheckout = async ({ paymentSessionId, environment }) => {
    if (!paymentSessionId || typeof paymentSessionId !== 'string' || !paymentSessionId.trim()) {
        throw new Error('Cashfree did not return a valid payment session. Please create a new payment order.');
    }

    const mode = String(environment || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox';
    const Cashfree = await loadCashfreeSdk();
    let cashfree = cashfreeInstanceCache.get(mode);

    if (!cashfree) {
        cashfree = Cashfree({ mode });
        if (cashfree && typeof cashfree.checkout === 'function') cashfreeInstanceCache.set(mode, cashfree);
    }

    if (!cashfree || typeof cashfree.checkout !== 'function') {
        throw new Error('Cashfree checkout could not be initialized. Refresh the page and try again.');
    }

    // _self performs a same-tab redirect and avoids mobile popup blockers.
    const result = await cashfree.checkout({
        paymentSessionId: paymentSessionId.trim(),
        redirectTarget: '_self'
    });

    if (result?.error) {
        const message = result.error.message || result.error.code;
        throw new Error(message ? `Cashfree could not open checkout: ${message}` : 'Cashfree could not open checkout. Please retry.');
    }
    return result;
};
