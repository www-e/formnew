// js/db.js - Enhanced IndexedDB Wrapper with Better Error Handling
const DB_NAME = "student_center_db";
const DB_VERSION = 1;
const STORE_NAME = "main";

class DatabaseManager {
    constructor() {
        this.db = null;
    }

    async openDB() {
        if (this.db) return this.db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error("❌ IndexedDB open failed:", request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log("✅ IndexedDB opened successfully");
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                console.log("🔧 IndexedDB upgrading...");
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                    console.log("📦 Object store created");
                }
            };
        });
    }

    async getData(key) {
        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(key);
                
                req.onsuccess = () => {
                    const result = req.result ? req.result.data : null;
                    console.log(`📖 Data retrieved for key '${key}':`, result ? "Found" : "Not found");
                    resolve(result);
                };
                
                req.onerror = () => {
                    console.error(`❌ Failed to get data for key '${key}':`, req.error);
                    reject(req.error);
                };
                
                tx.onerror = () => {
                    console.error(`❌ Transaction failed for key '${key}':`, tx.error);
                    reject(tx.error);
                };
            });
        } catch (error) {
            console.error("❌ getData error:", error);
            throw error;
        }
    }

async setData(key, data) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({ id: key, data: data });
        
        req.onerror = () => {
            console.error(`❌ Failed to save data for key '${key}':`, req.error);
            reject(req.error);
        };
        
        // 🔥 CRITICAL FIX: Wait for transaction completion
        tx.oncomplete = () => {
            console.log(`✅ Data successfully saved for key '${key}'`);
            resolve();
        };
        
        tx.onerror = () => {
            console.error(`❌ Transaction failed for key '${key}':`, tx.error);
            reject(tx.error);
        };
    });
}

    // Add debugging method
    async getAllKeys() {
        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readonly");
                const store = tx.objectStore(STORE_NAME);
                const req = store.getAllKeys();
                
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        } catch (error) {
            console.error("❌ getAllKeys error:", error);
            throw error;
        }
    }
}

// Make it available globally
window.DatabaseManager = DatabaseManager;
