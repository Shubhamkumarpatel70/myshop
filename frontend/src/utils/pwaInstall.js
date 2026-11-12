let deferredInstallPrompt = null;
const subscribers = new Set();

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        subscribers.forEach((subscriber) => subscriber(true));
    });
    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        subscribers.forEach((subscriber) => subscriber(false));
    });
}

export const subscribeInstallPrompt = (subscriber) => {
    subscribers.add(subscriber);
    subscriber(Boolean(deferredInstallPrompt));
    return () => subscribers.delete(subscriber);
};

export const triggerInstallPrompt = async () => {
    if (!deferredInstallPrompt) return null;
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    const result = await promptEvent.prompt();
    subscribers.forEach((subscriber) => subscriber(false));
    return result || await promptEvent.userChoice;
};
