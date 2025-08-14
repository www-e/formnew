class StorageManager {
    constructor() {
        this.data = {
            students: [],
            settings: { lastId: 0 }
        };
    }

    loadData(data) {
        this.data = data;
        if (!this.data.students) this.data.students = [];
        if (!this.data.settings) this.data.settings = { lastId: 0 };
    }

    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    async persistData() {
        try {
            const jsonContent = JSON.stringify(this.data, null, 2); // Pretty-print JSON
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            this.downloadFile(blob, 'database.json');
            
            // Give the user a clear instruction.
            alert("تم تجهيز ملف البيانات المحدث. يرجى حفظه في مجلد 'data' واستبدال الملف القديم لضمان حفظ التغييرات.");

        } catch (error) {
            console.error("Error persisting data:", error);
            window.app.showErrorMessage("فشل حفظ البيانات.");
        }
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
            uniqueId = `std-g${grade}-${randomPart}`;
            
            // Check for uniqueness
            if (!this.data.students.find(s => s.id === uniqueId)) {
                isUnique = true;
            }
        }
        return uniqueId;
    }

    async saveStudent(studentData) {
        const duplicateStudent = this.data.students.find(s => s.studentPhone === studentData.studentPhone);
        if (duplicateStudent) {
            return { success: false, message: 'رقم هاتف الطالب مسجل من قبل' };
        }

        this.data.students.push(studentData);
        await this.persistData(); // This will now trigger a download
        return { success: true, message: 'تم إضافة الطالب بنجاح! جاري تجهيز ملف الحفظ...' };
    }

    getAllStudents() {
        return this.data.students || [];
    }

    async updateStudent(studentId, updatedData) {
        const studentIndex = this.data.students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) {
            return { success: false, message: 'الطالب غير موجود' };
        }

        this.data.students[studentIndex] = { ...this.data.students[studentIndex], ...updatedData };
        await this.persistData();
        return { success: true, message: 'تم تحديث الطالب بنجاح! جاري تجهيز ملف الحفظ...' };
    }

    async deleteStudent(studentId) {
        const initialLength = this.data.students.length;
        this.data.students = this.data.students.filter(s => s.id !== studentId);

        if (this.data.students.length === initialLength) {
            return { success: false, message: 'الطالب غير موجود' };
        }

        await this.persistData();
        return { success: true, message: 'تم حذف الطالب بنجاح! جاري تجهيز ملف الحفظ...' };
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