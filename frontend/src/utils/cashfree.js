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
        // A previous failed attempt may have left a script element whose load/error
        // event has already fired. Reuse only the live global, not a stale tag.
        document.querySelectorAll('script[data-cashfree-sdk="true"]').forEach(node => node.remove());

        const script = document.createElement('script');
        let settled = false;
        const cleanup = () => {
            window.clearTimeout(timeout);
            script.onload = null;
            script.onerror = null;
        };
        const finish = (error) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (error || typeof window.Cashfree !== 'function') {
                script.remove();
                cashfreeSdkPromise = null;
                reject(error || new Error('Cashfree SDK loaded but checkout is unavailable. Please retry.'));
                return;
            }
            resolve(window.Cashfree);
        };
        const timeout = window.setTimeout(() => {
            finish(new Error('Cashfree is taking too long to load. Check your connection or allow sdk.cashfree.com, then tap Retry.'));
        }, 10000);

        script.src = CASHFREE_SDK_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.dataset.cashfreeSdk = 'true';
        script.onload = () => finish();
        script.onerror = () => finish(new Error('Could not load Cashfree. Your browser or network may be blocking sdk.cashfree.com.'));
        document.head.appendChild(script);
    }).catch(error => {
        cashfreeSdkPromise = null;
        throw error;
    });

    return cashfreeSdkPromise;
};

// Warm up the Cashfree SDK while the pricing or registration page is open.
// This is best-effort: a preload failure must not break page rendering or create
// an unhandled promise rejection. The real checkout initialization retries and
// reports a clear error if the SDK is still unavailable when the user pays.
export const preloadCashfreeSdk = () => loadCashfreeSdk()
    .then(() => true)
    .catch((error) => {
        console.warn('[Cashfree] SDK preload failed; checkout will retry on demand.', error);
        return false;
    });

// Initialize the SDK before the user taps Pay so mobile browsers retain the
// user-activation context required for the checkout redirect.
export const prepareCashfreeCheckout = async ({ environment }) => {
    const Cashfree = await loadCashfreeSdk();
    const mode = String(environment || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox';
    let instance = cashfreeInstanceCache.get(mode);
    if (!instance) {
        instance = Cashfree({ mode });
        if (!instance || typeof instance.checkout !== 'function') {
            throw new Error('Cashfree loaded, but secure checkout could not be initialized. Please retry.');
        }
        cashfreeInstanceCache.set(mode, instance);
    }
    return instance;
};

// Invoke checkout synchronously from the actual user click.
export const openCashfreeCheckout = ({ cashfree, paymentSessionId }) => {
    if (!paymentSessionId || typeof paymentSessionId !== 'string' || !paymentSessionId.trim()) {
        throw new Error('Cashfree did not return a valid payment session. Please create a new payment order.');
    }
    if (!cashfree || typeof cashfree.checkout !== 'function') {
        throw new Error('Cashfree is not ready yet. Please wait and retry.');
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
