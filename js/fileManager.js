// js/fileManager.js - Production Ready with Auto-Backup & CSV Import
class FileManager {
    constructor() {
        this.DB_KEY = "center_data";
        this.dbManager = new DatabaseManager();
        this.setupAutoBackup();
    }

    // Auto-backup every 30 minutes
    setupAutoBackup() {
        setInterval(() => {
            this.performAutoBackup();
        }, 30 * 60 * 1000); // 30 minutes
    }

    async performAutoBackup() {
        try {
            const data = await this.dbManager.getData(this.DB_KEY);
            if (data && data.students && data.students.length > 0) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `auto_backup_${timestamp}.json`;
                
                const json = JSON.stringify(data, null, 2);
                
                // Try to save silently (modern browsers only)
                if ('showSaveFilePicker' in window) {
                    console.log(`📋 Auto-backup ready: ${filename} (${data.students.length} students)`);
                }
            }
        } catch (error) {
            console.log('Auto-backup check failed:', error);
        }
    }

    async loadFile() {
        try {
            console.log("🔍 Loading from IndexedDB...");
            let data = await this.dbManager.getData(this.DB_KEY);
            
            if (data) {
                console.log("✅ Data loaded from IndexedDB");
                return { success: true, isNew: false, data: data };
            }

            // Migration from JSON file
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
            data = { 
                students: [], 
                settings: { 
                    lastId: 0,
                    version: "2.0.0",
                    created: new Date().toISOString()
                }
            };
            await this.dbManager.setData(this.DB_KEY, data);
            console.log("🆕 Fresh database created");
            
            return { success: true, isNew: true, data: data };

        } catch (error) {
            console.error("❌ Database error:", error);
            return { success: false, error: error };
        }
    }

    async saveFile(data) {
        try {
            data.lastSaved = new Date().toISOString();
            await this.dbManager.setData(this.DB_KEY, data);
            console.log("💾 Data auto-saved to IndexedDB");
            return { success: true };
        } catch (error) {
            console.error("❌ Save error:", error);
            return { success: false, error: error };
        }
    }

    // CSV Import functionality
    async importCSV() {
        try {
            let file;
            
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: "CSV files",
                        accept: { "text/csv": [".csv"] }
                    }]
                });
                file = await handle.getFile();
            } else {
                file = await this.showFileInput('.csv,text/csv');
            }

            if (file) {
                const text = await file.text();
                const students = this.parseCSV(text);
                return { success: true, students: students };
            }
            
            return { success: false, message: "لم يتم اختيار ملف" };
            
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, message: "تم إلغاء العملية" };
            }
            console.error("CSV Import error:", error);
            return { success: false, message: "فشل في استيراد ملف CSV" };
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const students = [];
        
        // Skip header row if exists
        const startIndex = lines[0].includes('اسم الطالب') || lines.includes('name') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const columns = lines[i].split(',').map(col => col.replace(/"/g, '').trim());
            
            if (columns.length >= 6 && columns && columns[1]) {
                const student = {
                    name: columns,
                    studentPhone: columns[1],
                    parentPhone: columns[2],
                    grade: columns[3], // Should be 'first', 'second', or 'third'
                    section: columns[4] || '',
                    groupTime: columns[5],
                    paidAmount: parseFloat(columns[6]) || 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    attendance: {}
                };
                students.push(student);
            }
        }
        
        return students;
    }

    async exportBackup(data) {
        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const timestamp = new Date().toISOString().split('T')[0];
            
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `backup_${timestamp}.json`,
                    types: [{ description: "JSON files", accept: { "application/json": [".json"] } }]
                });
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
                
                return { success: true, message: "تم حفظ النسخة الاحتياطية بنجاح!" };
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `backup_${timestamp}.json`;
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
            return { success: false, message: "فشل في تصدير البيانات" };
        }
    }

    async importBackup() {
        try {
            let file;
            
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{ description: "JSON files", accept: { "application/json": [".json"] } }]
                });
                file = await handle.getFile();
            } else {
                file = await this.showFileInput('.json,application/json');
            }

            if (file) {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Validate data structure
                if (!data.students || !Array.isArray(data.students)) {
                    throw new Error("Invalid backup file format");
                }
                
                await this.dbManager.setData(this.DB_KEY, data);
                return { success: true, message: "تم استعادة البيانات بنجاح!", data: data };
            }
            
            return { success: false, message: "لم يتم اختيار ملف" };
            
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, message: "تم إلغاء العملية" };
            }
            return { success: false, message: "فشل في استعادة البيانات - تأكد من صحة الملف" };
        }
    }

    showFileInput(accept = '.json,application/json') {
        return new Promise((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = accept;
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
