class LocalStorageManager {
    constructor() {
        this.storageKey = 'studentRegistrationData';
        this.settingsKey = 'studentRegistrationSettings';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.settingsKey)) {
            localStorage.setItem(this.settingsKey, JSON.stringify({
                lastId: 0,
                backupDate: new Date().toISOString()
            }));
        }
    }

    generateId() {
        const settings = this.getSettings();
        settings.lastId += 1;
        this.saveSettings(settings);
        return settings.lastId;
    }

    getSettings() {
        return JSON.parse(localStorage.getItem(this.settingsKey));
    }

    saveSettings(settings) {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }

    saveStudent(studentData) {
        return new Promise((resolve) => {
            try {
                const students = this.getAllStudents();
                
                // Check for duplicate phone numbers
                const duplicateStudent = students.find(s => 
                    s.studentPhone === studentData.studentPhone
                );
                
                if (duplicateStudent) {
                    resolve({
                        success: false,
                        message: 'رقم هاتف الطالب مسجل من قبل'
                    });
                    return;
                }

                // Add new student
                const newStudent = {
                    id: this.generateId(),
                    ...studentData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                students.push(newStudent);
                localStorage.setItem(this.storageKey, JSON.stringify(students));
                
                resolve({
                    success: true,
                    message: 'تم تسجيل الطالب بنجاح',
                    student: newStudent
                });
            } catch (error) {
                resolve({
                    success: false,
                    message: 'حدث خطأ أثناء حفظ البيانات'
                });
            }
        });
    }

    getAllStudents() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (error) {
            console.error('Error retrieving students:', error);
            return [];
        }
    }

    updateStudent(studentId, updatedData) {
        return new Promise((resolve) => {
            try {
                const students = this.getAllStudents();
                const studentIndex = students.findIndex(s => s.id === studentId);
                
                if (studentIndex === -1) {
                    resolve({
                        success: false,
                        message: 'الطالب غير موجود'
                    });
                    return;
                }

                students[studentIndex] = {
                    ...students[studentIndex],
                    ...updatedData,
                    updatedAt: new Date().toISOString()
                };

                localStorage.setItem(this.storageKey, JSON.stringify(students));
                
                resolve({
                    success: true,
                    message: 'تم تحديث بيانات الطالب',
                    student: students[studentIndex]
                });
            } catch (error) {
                resolve({
                    success: false,
                    message: 'حدث خطأ أثناء تحديث البيانات'
                });
            }
        });
    }

    deleteStudent(studentId) {
        return new Promise((resolve) => {
            try {
                const students = this.getAllStudents();
                const filteredStudents = students.filter(s => s.id !== studentId);
                
                if (students.length === filteredStudents.length) {
                    resolve({
                        success: false,
                        message: 'الطالب غير موجود'
                    });
                    return;
                }

                localStorage.setItem(this.storageKey, JSON.stringify(filteredStudents));
                
                resolve({
                    success: true,
                    message: 'تم حذف الطالب بنجاح'
                });
            } catch (error) {
                resolve({
                    success: false,
                    message: 'حدث خطأ أثناء حذف البيانات'
                });
            }
        });
    }

    exportData() {
        return {
            students: this.getAllStudents(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    importData(data) {
        return new Promise((resolve) => {
            try {
                if (data.students && Array.isArray(data.students)) {
                    localStorage.setItem(this.storageKey, JSON.stringify(data.students));
                }
                if (data.settings) {
                    localStorage.setItem(this.settingsKey, JSON.stringify(data.settings));
                }
                
                resolve({
                    success: true,
                    message: 'تم استيراد البيانات بنجاح'
                });
            } catch (error) {
                resolve({
                    success: false,
                    message: 'حدث خطأ أثناء استيراد البيانات'
                });
            }
        });
    }

    clearAllData() {
        return new Promise((resolve) => {
            try {
                localStorage.removeItem(this.storageKey);
                localStorage.removeItem(this.settingsKey);
                this.initializeStorage();
                
                resolve({
                    success: true,
                    message: 'تم حذف جميع البيانات'
                });
            } catch (error) {
                resolve({
                    success: false,
                    message: 'حدث خطأ أثناء حذف البيانات'
                });
            }
        });
    }

    getStatistics() {
        const students = this.getAllStudents();
        const stats = {
            totalStudents: students.length,
            totalRevenue: students.reduce((sum, student) => sum + parseFloat(student.paidAmount || 0), 0),
            gradeDistribution: {},
            sectionDistribution: {},
            recentRegistrations: students.slice(-5).reverse()
        };

        // Calculate grade distribution
        students.forEach(student => {
            stats.gradeDistribution[student.grade] = (stats.gradeDistribution[student.grade] || 0) + 1;
        });

        // Calculate section distribution
        students.forEach(student => {
            if (student.section) {
                stats.sectionDistribution[student.section] = (stats.sectionDistribution[student.section] || 0) + 1;
            }
        });

        return stats;
    }
}
