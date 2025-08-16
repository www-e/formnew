// js/storage.js - Update the StorageManager class
class StorageManager {
    constructor() {
        this.data = {
            students: [],
            settings: { lastId: 0 }
        };
        this.fileManager = null; // Will be injected
    }

    setFileManager(fileManager) {
        this.fileManager = fileManager;
    }

    loadData(data) {
        this.data = data;
        if (!this.data.students) this.data.students = [];
        if (!this.data.settings) this.data.settings = { lastId: 0 };
    }

    // AUTO-SAVE: Called after every change
    async autoSave() {
        if (this.fileManager) {
            const result = await this.fileManager.saveFile(this.data);
            if (!result.success) {
                console.error("Auto-save failed:", result.error);
            }
        }
    }

    // Replace the old persistData method
    async persistData() {
        // This now just does auto-save instead of downloading
        await this.autoSave();
        
        // Show success message
        if (window.app) {
            window.app.showSuccessMessage("تم حفظ البيانات تلقائياً!");
        }
    }

    // User backup function
    async createBackup() {
        if (this.fileManager) {
            return await this.fileManager.exportBackup(this.data);
        }
        return { success: false, message: "File manager not available" };
    }

    // User restore function  
    async restoreBackup() {
        if (this.fileManager) {
            const result = await this.fileManager.importBackup();
            if (result.success && result.data) {
                this.loadData(result.data);
                // Refresh the page to update UI
                window.location.reload();
            }
            return result;
        }
        return { success: false, message: "File manager not available" };
    }

    async saveStudent(studentData) {
        const duplicateStudent = this.data.students.find(s => s.studentPhone === studentData.studentPhone);
        if (duplicateStudent) {
            return { success: false, message: 'رقم هاتف الطالب مسجل من قبل' };
        }
        
        studentData.createdAt = new Date().toISOString();
        studentData.updatedAt = studentData.createdAt;
        studentData.attendance = {};

        this.data.students.push(studentData);
        await this.autoSave(); // Auto-save instead of manual
        
        return { success: true, message: 'تم إضافة الطالب بنجاح!' };
    }

    async updateStudent(studentId, updatedData) {
        const studentIndex = this.data.students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) {
            return { success: false, message: 'الطالب غير موجود' };
        }

        updatedData.updatedAt = new Date().toISOString();
        this.data.students[studentIndex] = { ...this.data.students[studentIndex], ...updatedData };
        
        await this.autoSave(); // Auto-save instead of manual
        return { success: true, message: 'تم تحديث الطالب بنجاح!' };
    }

    async deleteStudent(studentId) {
        const initialLength = this.data.students.length;
        this.data.students = this.data.students.filter(s => s.id !== studentId);

        if (this.data.students.length === initialLength) {
            return { success: false, message: 'الطالب غير موجود' };
        }

        await this.autoSave(); // Auto-save instead of manual
        return { success: true, message: 'تم حذف الطالب بنجاح!' };
    }

    generateId(grade) {
        let uniqueId = '';
        let isUnique = false;
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        while (!isUnique) {
            let randomPart = '';
            for (let i = 0; i < 3; i++) {
                randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            uniqueId = `std-g${grade.charAt(0)}-${randomPart}`;
            
            if (!this.data.students.find(s => s.id === uniqueId)) {
                isUnique = true;
            }
        }
        return uniqueId;
    }

    getAllStudents() {
        return this.data.students || [];
    }

    getStatistics() {
        const students = this.getAllStudents();
        const stats = {
            totalStudents: students.length,
            totalRevenue: students.reduce((sum, s) => sum + parseFloat(s.paidAmount || 0), 0),
            gradeDistribution: { first: 0, second: 0, third: 0 },
        };
        students.forEach(student => {
            if (stats.gradeDistribution.hasOwnProperty(student.grade)) {
                stats.gradeDistribution[student.grade]++;
            }
        });
        return stats;
    }
}
