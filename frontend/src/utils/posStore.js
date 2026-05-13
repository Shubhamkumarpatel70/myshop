import { openDB } from 'idb';

const DB_NAME = 'MyShopPOS';
const STORE_NAME = 'offlineSales';

const dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
    },
});

export const posStore = {
    async saveOfflineSale(sale) {
        const db = await dbPromise;
        return db.add(STORE_NAME, { ...sale, timestamp: Date.now() });
    },
    async getOfflineSales() {
        const db = await dbPromise;
        return db.getAll(STORE_NAME);
    },
    async deleteOfflineSale(id) {
        const db = await dbPromise;
        return db.delete(STORE_NAME, id);
    },
    async clearOfflineSales() {
        const db = await dbPromise;
        return db.clear(STORE_NAME);
    }
};
