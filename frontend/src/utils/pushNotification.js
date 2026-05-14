/**
 * Utility to handle browser-level push notifications
 */

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const showBrowserNotification = (title, body, icon = '/logo192.png') => {
    if (Notification.permission === "granted") {
        try {
            const notification = new Notification(title, {
                body,
                icon,
                badge: icon,
                tag: 'stock-saathi-alert', // Prevents multiple notifications for same event
                requireInteraction: false
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error("Failed to show browser notification", error);
        }
    }
};
