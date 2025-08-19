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
    async autoSave(showIndicator = true) {
        if (showIndicator) this.showSavingIndicator(true);
        try {
            if (this.fileManager) {
                const result = await this.fileManager.saveFile(this.data);
                if (!result.success) {
                    console.error("Auto-save failed:", result.error);
                    if (window.app) window.app.showErrorMessage("فشل الحفظ التلقائي!");
                }
            }
        } catch (error) {
            console.error("Critical auto-save error:", error);
            if (window.app) window.app.showErrorMessage("خطأ جسيم أثناء الحفظ!");
        } finally {
            if (showIndicator) {
                // Keep the indicator for a short period to feel intentional
                setTimeout(() => this.showSavingIndicator(false), 500);
            }
        }
    }

    showSavingIndicator(isSaving) {
        const statusEl = document.getElementById('db-status');
        if (!statusEl) return;

        if (isSaving) {
            this.originalStatusHTML = statusEl.innerHTML;
            statusEl.innerHTML = '<i class="fas fa-save text-blue-500 fa-fade ml-2"></i><span class="text-blue-600">جاري الحفظ...</span>';
        } else {
            // Restore original status only if it was set
            if (this.originalStatusHTML) {
                statusEl.innerHTML = this.originalStatusHTML;
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
                await this.autoSave(); // Ensure the restored data is saved
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
        studentData.attendance = {}; // Ensure it's an empty object
        studentData.payments = {};   // Ensure it's an empty object
        studentData.isExempt = false; // Default to not exempt

        this.data.students.push(studentData);
        await this.autoSave();

        return { success: true, message: 'تم إضافة الطالب بنجاح!' };
    }

async updateStudent(studentId, updatedData, mergeNested = false) {
    const studentIndex = this.data.students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
        return { success: false, message: 'الطالب غير موجود' };
    }

    const existingStudent = this.data.students[studentIndex];

    // Deep merge for attendance and payments if mergeNested is true
    if (mergeNested) {
        if (updatedData.attendance) {
            updatedData.attendance = { ...existingStudent.attendance, ...updatedData.attendance };
        }
        if (updatedData.payments) {
            updatedData.payments = { ...existingStudent.payments, ...updatedData.payments };
        }
    } else {
       // Preserve existing attendance and payments if not explicitly provided in update
        if (!updatedData.attendance) {
            updatedData.attendance = existingStudent.attendance || {};
        }
        if (!updatedData.payments) {
            updatedData.payments = existingStudent.payments || {};
        }
    }
    
    updatedData.updatedAt = new Date().toISOString();
    
    this.data.students[studentIndex] = {
        ...existingStudent,
        ...updatedData
    };

    console.log(`📋 Student ${studentId} updated.`);

    await this.autoSave();
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

    // This function generates a random ID for a new student.
    // While collisions are unlikely, it's not guaranteed to be unique for a very large number of students.
    // For a more robust solution, a library like UUID could be used.
    generateId(grade) {
        let uniqueId = '';
        let isUnique = false;

        // Grade mapping: first=1, second=2, third=3
        const gradeMap = { 'first': '1', 'second': '2', 'third': '3' };
        const gradeNumber = gradeMap[grade] || '1';

        while (!isUnique) {
            // Generate 3-digit random number (001-999)
            const randomNum = Math.floor(Math.random() * 999) + 1;
            const paddedNum = randomNum.toString().padStart(3, '0');

            uniqueId = `std-${gradeNumber}${paddedNum}`;

            // Check for uniqueness
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
    async importStudentsFromCSV() {
        if (!this.fileManager) {
            return { success: false, message: "File manager not available" };
        }

        const result = await this.fileManager.importCSV();
        if (!result.success || !result.students) {
            return result;
        }

        // --- Translation Maps (remain the same) ---
        const gradeMap = {
            'الصف الأول الثانوي': 'first',
            'الصف الثاني الثانوي': 'second',
            'الصف الثالث الثانوي': 'third',
        };
        const sectionMap = {
            'علمي - رياضة بحتة': 'science_pure',
            'علمي - رياضة تطبيقية': 'science_applied',
            'أدبي': 'arts',
            'علمي رياضة': 'general_science',
            'إحصاء - أدبي': 'statistics_arts',
            '-': '' // Handle dashes for empty sections
        };
        const groupTimeMap = {
            'السبت والثلاثاء - 3:15 م': 'sat_tue_315',
            'السبت والثلاثاء - 4:30 م': 'sat_tue_430',
            'الأحد والأربعاء - 2:00 م': 'sun_wed_200',
            'الاثنين والخميس - 2:00 م': 'mon_thu_200',
            'السبت والثلاثاء - 2:00 م': 'sat_tue_200',
            'الأحد والأربعاء - 3:15 م': 'sun_wed_315',
            'الاثنين والخميس - 3:15 م': 'mon_thu_315',
            'السبت والثلاثاء والخميس - 12:00 م': 'sat_tue_thu_1200',
            'الأحد والأربعاء - 4:30 م': 'sun_wed_430'
        };

        let importedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0; // For records that cannot be processed

        // Create a temporary array to hold the new set of students
        const newStudentsData = [];
        const existingStudentIds = new Set(this.data.students.map(s => s.id));

        for (const studentData of result.students) {
            try {
                // Translate raw CSV data to system keys
                const gradeKey = gradeMap[studentData.grade] || studentData.grade;
                const sectionKey = sectionMap[studentData.section] || studentData.section;
                const groupTimeKey = groupTimeMap[studentData.groupTime] || studentData.groupTime;

                // Prepend leading zero to phone numbers if missing
                let studentPhone = studentData.studentPhone;
                if (studentPhone && !studentPhone.startsWith('0')) {
                    studentPhone = '0' + studentPhone;
                }

                // Construct the student object with translated and preserved data
                const processedStudent = {
                    id: studentData.id || this.generateId(gradeKey), // Use existing ID or generate new
                    name: studentData.name,
                    studentPhone: studentPhone,
                    parentPhone: studentData.parentPhone,
                    grade: gradeKey,
                    section: sectionKey,
                    groupTime: groupTimeKey,
                    paidAmount: parseFloat(studentData.paidAmount || 0),
                    attendance: studentData.attendance || {}, // Preserve attendance from CSV
                    payments: studentData.payments || {},     // Preserve payments from CSV
                    isExempt: studentData.isExempt || false,  // Preserve isExempt from CSV
                    createdAt: studentData.createdAt || new Date().toISOString(), // Preserve createdAt
                    updatedAt: studentData.updatedAt || new Date().toISOString(), // Preserve updatedAt
                };

                // Add the display names (these are derived, not stored directly)
                processedStudent.gradeName = this.getGradeName(processedStudent.grade);
                processedStudent.sectionName = this.getSectionName(processedStudent.grade, processedStudent.section);
                processedStudent.groupTimeText = this.getGroupTimeText(processedStudent.groupTime);

                // Check if student with this ID already exists
                const existingStudentIndex = this.data.students.findIndex(s => s.id === processedStudent.id);

                if (existingStudentIndex !== -1) {
                    // Update existing student
                    this.data.students[existingStudentIndex] = processedStudent;
                    updatedCount++;
                } else {
                    // Add new student
                    this.data.students.push(processedStudent);
                    importedCount++;
                }
            } catch (error) {
                console.error(`Error processing CSV row for student ${studentData.id || studentData.name}:`, error);
                skippedCount++;
            }
        }

        // After processing all students, ensure data consistency and save
        // Re-calculate lastId if necessary (though with external IDs, it's less critical)
        // For simplicity, we'll just rely on the IDs from CSV or newly generated ones.
        // The `settings.lastId` is primarily for the `generateId` function's internal logic,
        // which is now less relevant if IDs are coming from CSV.

        await this.autoSave();
        return {
            success: true,
            message: `اكتمل الاستيراد! تم إضافة ${importedCount} طالب جديد، وتحديث ${updatedCount} طالب. تم تجاهل ${skippedCount} سجل بسبب أخطاء.`
        };
    }

    getGradeName(grade) {
        const gradeNames = {
            'first': 'الصف الأول الثانوي',
            'second': 'الصف الثاني الثانوي',
            'third': 'الصف الثالث الثانوي'
        };
        return gradeNames[grade] || grade;
    }

    getSectionName(grade, section) {
        if (!section) return '';
        const sections = {
            'second': {
                'science_pure': 'علمي - رياضة بحتة',
                'science_applied': 'علمي - رياضة تطبيقية',
                'arts': 'أدبي'
            },
            'third': {
                'general_science': 'علمي رياضة',
                'statistics_arts': 'إحصاء - أدبي'
            }
        };
        return sections[grade]?.[section] || section;
    }

    getGroupTimeText(groupTime) {
        const groups = {
            'sat_tue_315': 'السبت والثلاثاء - 3:15 م',
            'sat_tue_430': 'السبت والثلاثاء - 4:30 م',
            'sun_wed_200': 'الأحد والأربعاء - 2:00 م',
            'mon_thu_200': 'الاثنين والخميس - 2:00 م',
            'sat_tue_200': 'السبت والثلاثاء - 2:00 م',
            'sun_wed_315': 'الأحد والأربعاء - 3:15 م',
            'mon_thu_315': 'الاثنين والخميس - 3:15 م',
            'sat_tue_thu_1200': 'السبت والثلاثاء والخميس - 12:00 م',
            'sun_wed_430': 'الأحد والأربعاء - 4:30 م'
        };
        return groups[groupTime] || groupTime;
    }
    getRequiredPayment(grade, section = '') {
        switch (grade) {
            case 'first':
                return 200;
            case 'second':
                if (section.startsWith('science')) { // Catches 'science_pure' and 'science_applied'
                    return 350;
                }
                return 300;
            case 'third':
                if (section === 'general_science') {
                    return 450;
                }
                return 400;
            default:
                return 0; // Default case
        }
    }

}
