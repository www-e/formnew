class ExportManager {
    constructor() {
        this.students = [];
    }

    setStudentsData(students) {
        this.students = students;
    }

    exportToExcel() {
        if (this.students.length === 0) {
            window.app.showErrorMessage("لا يوجد بيانات لتصديرها.");
            return;
        }

        try {
            let csvContent = '\uFEFF'; // BOM for UTF-8 to support Arabic in Excel

            const headers = [
                'كود الطالب', 'اسم الطالب', 'رقم هاتف الطالب', 'رقم هاتف ولي الأمر',
                'الصف الدراسي', 'القسم', 'المجموعة والمعاد', 'المبلغ المدفوع',
                'الحضور', 'المدفوعات', 'معفى', 'تاريخ الإنشاء', 'تاريخ التعديل'
            ];
            
            csvContent += headers.join(',') + '\n';

            this.students.forEach(student => {
                const row = [
                    `"${student.id}"`,
                    `"${student.name}"`,
                    `"${student.studentPhone}"`,
                    `"${student.parentPhone}"`,
                    `"${student.gradeName}"`,
                    `"${student.sectionName || '-'}"`,
                    `"${student.groupTimeText}"`,
                    `"${student.paidAmount}"`,
                    `"${JSON.stringify(student.attendance)}"`,
                    `"${JSON.stringify(student.payments)}"`,
                    `"${student.isExempt ? 'نعم' : 'لا'}"`,
                    `"${student.createdAt}"`,
                    `"${student.updatedAt}"`
                ];
                csvContent += row.join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const filename = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
            this.downloadFile(blob, filename);
            
            window.app.showSuccessMessage('تم تصدير ملف Excel بنجاح.');
        } catch (error) {
            console.error('Excel export error:', error);
            window.app.showErrorMessage('حدث خطأ أثناء تصدير الملف.');
        }
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
}