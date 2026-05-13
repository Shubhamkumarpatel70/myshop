import { openDB } from 'idb';

const DB_NAME = 'MyShopPOS';
const SALES_STORE = 'offlineSales';
const PRODUCTS_STORE = 'cachedProducts';

const dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(SALES_STORE)) {
            db.createObjectStore(SALES_STORE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
            db.createObjectStore(PRODUCTS_STORE, { keyPath: '_id' });
        }
        if (!db.objectStoreNames.contains('cachedSales')) {
            db.createObjectStore('cachedSales', { keyPath: '_id' });
        }
        if (!db.objectStoreNames.contains('cachedReports')) {
            db.createObjectStore('cachedReports', { keyPath: 'id' });
        }
    },
});

export const posStore = {
    // Offline Sales
    async saveOfflineSale(sale) {
        const db = await dbPromise;
        return db.add(SALES_STORE, { ...sale, timestamp: Date.now() });
    },
    async getOfflineSales() {
        const db = await dbPromise;
        return db.getAll(SALES_STORE);
    },
    async deleteOfflineSale(id) {
        const db = await dbPromise;
        return db.delete(SALES_STORE, id);
    },
    
    // Cached Products
    async cacheProducts(products) {
        const db = await dbPromise;
        const tx = db.transaction(PRODUCTS_STORE, 'readwrite');
        await tx.store.clear();
        for (const product of products) {
            await tx.store.put(product);
        }
        return tx.done;
    },
    async getCachedProducts() {
        const db = await dbPromise;
        return db.getAll(PRODUCTS_STORE);
    },

    // Cached Sales History
    async cacheSales(sales) {
        const db = await dbPromise;
        const tx = db.transaction('cachedSales', 'readwrite');
        await tx.store.clear();
        for (const sale of sales) {
            await tx.store.put(sale);
        }
        return tx.done;
    },
    async getCachedSales() {
        const db = await dbPromise;
        return db.getAll('cachedSales');
    },

    // Cached Reports
    async cacheReport(report) {
        const db = await dbPromise;
        return db.put('cachedReports', { ...report, id: 'latest' });
    },
    async getCachedReport() {
        const db = await dbPromise;
        return db.get('cachedReports', 'latest');
    }
};
