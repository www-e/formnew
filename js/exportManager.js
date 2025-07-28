class ExportManager {
    constructor() {
        this.students = [];
    }

    setStudentsData(students) {
        this.students = students;
    }

    exportToExcel() {
        try {
            // Create CSV content (Excel compatible)
            let csvContent = '\uFEFF'; // BOM for UTF-8
            
            // Headers
            const headers = [
                'اسم الطالب',
                'رقم هاتف الطالب', 
                'رقم هاتف ولي الأمر',
                'الصف الدراسي',
                'القسم',
                'المجموعة والمعاد',
                'المبلغ المدفوع',
                'تاريخ التسجيل',
                'تاريخ آخر تحديث'
            ];
            
            csvContent += headers.join(',') + '\n';
            
            // Data rows
            this.students.forEach(student => {
                const row = [
                    `"${student.name}"`,
                    `"${student.studentPhone}"`,
                    `"${student.parentPhone}"`,
                    `"${student.gradeName}"`,
                    `"${student.sectionName || '-'}"`,
                    `"${student.groupTimeText}"`,
                    `"${student.paidAmount} جنيه"`,
                    `"${this.formatDateForExport(student.createdAt)}"`,
                    `"${this.formatDateForExport(student.updatedAt)}"`
                ];
                csvContent += row.join(',') + '\n';
            });
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const filename = `students_data_${this.getCurrentDateString()}.csv`;
            this.downloadFile(blob, filename);
            
            this.showSuccessMessage('تم تصدير ملف Excel بنجاح');
        } catch (error) {
            console.error('Excel export error:', error);
            this.showErrorMessage('حدث خطأ أثناء تصدير ملف Excel');
        }
    }

    exportToPDF() {
        try {
            // Create HTML content for PDF
            let htmlContent = `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>قائمة الطلاب المسجلين</title>
                    <style>
                        body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
                        h1 { text-align: center; color: #333; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .header-info { text-align: center; margin-bottom: 20px; color: #666; }
                        .stats { display: flex; justify-content: space-around; margin-bottom: 20px; }
                        .stat-box { text-align: center; padding: 10px; background: #f0f0f0; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <h1>📋 قائمة الطلاب المسجلين</h1>
                    <div class="header-info">
                        <p>تاريخ التصدير: ${this.getCurrentDateString()}</p>
                        <p>إجمالي عدد الطلاب: ${this.students.length}</p>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-box">
                            <strong>إجمالي الإيرادات</strong><br>
                            ${this.calculateTotalRevenue()} جنيه
                        </div>
                        <div class="stat-box">
                            <strong>متوسط المبلغ</strong><br>
                            ${this.calculateAverageAmount()} جنيه
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>اسم الطالب</th>
                                <th>رقم الطالب</th>
                                <th>رقم ولي الأمر</th>
                                <th>الصف</th>
                                <th>القسم</th>
                                <th>المجموعة</th>
                                <th>المبلغ المدفوع</th>
                                <th>تاريخ التسجيل</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            this.students.forEach(student => {
                htmlContent += `
                    <tr>
                        <td>${student.name}</td>
                        <td>${student.studentPhone}</td>
                        <td>${student.parentPhone}</td>
                        <td>${student.gradeName}</td>
                        <td>${student.sectionName || '-'}</td>
                        <td>${student.groupTimeText}</td>
                        <td>${student.paidAmount} جنيه</td>
                        <td>${this.formatDateForExport(student.createdAt)}</td>
                    </tr>
                `;
            });
            
            htmlContent += `
                        </tbody>
                    </table>
                    <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
                        <p>تم إنشاء هذا التقرير بواسطة نظام تسجيل الطلاب</p>
                    </div>
                </body>
                </html>
            `;
            
            // Create and download HTML file (can be opened as PDF)
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
            const filename = `students_report_${this.getCurrentDateString()}.html`;
            this.downloadFile(blob, filename);
            
            this.showSuccessMessage('تم تصدير التقرير بنجاح (افتح الملف واطبعه كـ PDF)');
        } catch (error) {
            console.error('PDF export error:', error);
            this.showErrorMessage('حدث خطأ أثناء تصدير التقرير');
        }
    }

    exportToJSON() {
        try {
            const exportData = {
                exportInfo: {
                    date: new Date().toISOString(),
                    totalStudents: this.students.length,
                    totalRevenue: this.calculateTotalRevenue(),
                    version: '1.0'
                },
                students: this.students,
                statistics: window.storageManager.getStatistics()
            };
            
            const jsonContent = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const filename = `students_backup_${this.getCurrentDateString()}.json`;
            this.downloadFile(blob, filename);
            
            this.showSuccessMessage('تم تصدير النسخة الاحتياطية بنجاح');
        } catch (error) {
            console.error('JSON export error:', error);
            this.showErrorMessage('حدث خطأ أثناء تصدير النسخة الاحتياطية');
        }
    }

    calculateTotalRevenue() {
        return this.students.reduce((sum, student) => sum + parseFloat(student.paidAmount || 0), 0);
    }

    calculateAverageAmount() {
        if (this.students.length === 0) return 0;
        return Math.round(this.calculateTotalRevenue() / this.students.length);
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

    formatDateForExport(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getCurrentDateString() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        notification.className = `notification fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
        notification.innerHTML = `<i class="fas ${icon} ml-2"></i>${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Global export functions
function exportToExcel() {
    window.exportManager.setStudentsData(window.tableManager.filteredStudents);
    window.exportManager.exportToExcel();
}

function exportToPDF() {
    window.exportManager.setStudentsData(window.tableManager.filteredStudents);
    window.exportManager.exportToPDF();
}

function exportToJSON() {
    window.exportManager.setStudentsData(window.tableManager.students);
    window.exportManager.exportToJSON();
}
