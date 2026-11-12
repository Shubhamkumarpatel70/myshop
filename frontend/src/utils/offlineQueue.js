import { openDB } from 'idb';

const DB_NAME = 'stock-saathi-offline';
const STORE_NAME = 'mutations';
let dbPromise;

const getDb = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('createdAt', 'createdAt');
                    store.createIndex('userId', 'userId');
                }
            }
        });
    }
    return dbPromise;
};

export const canQueueRequest = (config = {}) => {
    const method = String(config.method || 'get').toLowerCase();
    const url = String(config.url || '').split('?')[0];
    if (!['post', 'put', 'patch', 'delete'].includes(method)) return false;
    if (/\/payments|\/subscriptions|\/auth|\/upload|\/sales|\/shifts|\/webhook/i.test(url)) return false;
    return /^\/?(products|categories|customers|suppliers|purchase-orders)(\/|$)/i.test(url.replace(/^.*\/api\//, ''));
};

export const enqueueMutation = async (config, userId) => {
    const db = await getDb();
    const headers = { ...(config.headers || {}) };
    delete headers.Authorization;
    delete headers.authorization;
    const item = {
        userId: String(userId || 'anonymous'),
        method: String(config.method || 'post').toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        params: config.params || null,
        data: config.data ?? null,
        headers,
        createdAt: new Date().toISOString(),
        status: 'pending',
        attempts: 0,
        error: null
    };
    const id = await db.add(STORE_NAME, item);
    window.dispatchEvent(new CustomEvent('stock-saathi-queue-updated'));
    return { ...item, id };
};

export const getQueuedMutations = async (userId) => {
    const db = await getDb();
    const all = await db.getAll(STORE_NAME);
    return all.filter(item => !userId || item.userId === String(userId)).sort((a, b) => a.id - b.id);
};

export const getQueueCount = async (userId) => (await getQueuedMutations(userId)).length;

export const syncQueuedMutations = async (api, userId) => {
    const items = await getQueuedMutations(userId);
    const results = [];
    for (const item of items) {
        if (item.status === 'conflict') break;
        const db = await getDb();
        try {
            await db.put(STORE_NAME, { ...item, status: 'syncing', attempts: item.attempts + 1, error: null });
            await api.request({
                method: item.method,
                url: item.url,
                baseURL: item.baseURL,
                params: item.params,
                data: item.data,
                headers: item.headers,
                _skipOfflineQueue: true
            });
            await db.delete(STORE_NAME, item.id);
            results.push({ id: item.id, status: 'synced' });
        } catch (error) {
            const status = error.response?.status;
            const conflict = status === 409 || status === 412;
            const message = error.response?.data?.message || error.message || 'Sync failed';
            await db.put(STORE_NAME, {
                ...item,
                status: conflict ? 'conflict' : 'failed',
                attempts: item.attempts + 1,
                error: message
            });
            results.push({ id: item.id, status: conflict ? 'conflict' : 'failed', error: message });
            // Keep request order; later changes may depend on this mutation.
            break;
        }
    }
    window.dispatchEvent(new CustomEvent('stock-saathi-queue-updated'));
    return results;
};

export const discardQueuedMutation = async (id) => {
    const db = await getDb();
    await db.delete(STORE_NAME, Number(id));
    window.dispatchEvent(new CustomEvent('stock-saathi-queue-updated'));
};

export const retryQueuedMutations = async (userId) => {
    const db = await getDb();
    const items = await getQueuedMutations(userId);
    for (const item of items) {
        if (item.status !== 'pending') await db.put(STORE_NAME, { ...item, status: 'pending', error: null });
    }
    window.dispatchEvent(new CustomEvent('stock-saathi-queue-updated'));
};
