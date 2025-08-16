// js/fileManager.js - Enhanced with IndexedDB + File System API
class FileManager {
    constructor() {
        this.DB_KEY = "center_data";
        this.dbManager = new DatabaseManager();
    }

    // Main load function - tries IndexedDB first, then fallback
    async loadFile() {
        try {
            console.log("🔍 Loading from IndexedDB...");
            let data = await this.dbManager.getData(this.DB_KEY);
            
            if (data) {
                console.log("✅ Data loaded from IndexedDB");
                return { success: true, isNew: false, data: data };
            }

            // No data in IndexedDB, try old JSON file as migration
            console.log("⚠️ No IndexedDB data, trying JSON file...");
            try {
                const response = await fetch('./data/database.json');
                if (response.ok) {
                    data = await response.json();
                    console.log("📦 Migrating JSON data to IndexedDB...");
                    await this.dbManager.setData(this.DB_KEY, data);
                    return { success: true, isNew: false, data: data };
                }
            } catch (jsonError) {
                console.log("📄 No JSON file found, creating fresh data");
            }

            // Create fresh database
            data = { students: [], settings: { lastId: 0 } };
            await this.dbManager.setData(this.DB_KEY, data);
            console.log("🆕 Fresh database created");
            
            return { success: true, isNew: true, data: data };

        } catch (error) {
            console.error("❌ Database error:", error);
            return { success: false, error: error };
        }
    }

    // Auto-save to IndexedDB (instant, no user action needed)
    async saveFile(data) {
        try {
            await this.dbManager.setData(this.DB_KEY, data);
            console.log("💾 Data auto-saved to IndexedDB");
            return { success: true };
        } catch (error) {
            console.error("❌ Save error:", error);
            return { success: false, error: error };
        }
    }

    // User-triggered backup to file
    async exportBackup(data) {
        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            
            // Try File System Access API (Chrome/Edge/Opera)
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `backup_${new Date().toISOString().split('T')[0]}.json`,
                    types: [{
                        description: "JSON files",
                        accept: { "application/json": [".json"] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
                
                return { success: true, message: "تم حفظ النسخة الاحتياطية بنجاح!" };
            } 
            // Fallback: Traditional download (Firefox/Safari)
            else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                return { success: true, message: "تم تنزيل النسخة الاحتياطية!" };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, message: "تم إلغاء العملية" };
            }
            console.error("Export error:", error);
            return { success: false, message: "فشل في تصدير البيانات" };
        }
    }

    // User-triggered restore from file
    async importBackup() {
        try {
            let file;
            
            // Try File System Access API
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: "JSON files",
                        accept: { "application/json": [".json"] }
                    }]
                });
                file = await handle.getFile();
            }
            // Fallback: Traditional file input
            else {
                file = await this.showFileInput();
            }

            if (file) {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Save to IndexedDB
                await this.dbManager.setData(this.DB_KEY, data);
                
                return { success: true, message: "تم استعادة البيانات بنجاح!", data: data };
            }
            
            return { success: false, message: "لم يتم اختيار ملف" };
            
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, message: "تم إلغاء العملية" };
            }
            console.error("Import error:", error);
            return { success: false, message: "فشل في استعادة البيانات - تأكد من صحة الملف" };
        }
    }

    // Helper for fallback file input
    showFileInput() {
        return new Promise((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json,application/json";
            input.onchange = () => {
                resolve(input.files[0]);
                document.body.removeChild(input);
            };
            input.style.display = 'none';
            document.body.appendChild(input);
            input.click();
        });
    }
}
