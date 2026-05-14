import { openDB } from 'idb';

const DB_NAME = 'StockSaathi_Offline';
const STORE_NAME = 'pending_sales';

const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

export const saveOfflineSale = async (saleData) => {
    const db = await initDB();
    await db.add(STORE_NAME, {
        ...saleData,
        timestamp: new Date().toISOString()
    });
};

export const getOfflineSales = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};

export const clearOfflineSale = async (id) => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};

export const isOnline = () => navigator.onLine;
