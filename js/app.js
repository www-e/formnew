class StudentRegistrationApp {
    constructor() {
        this.version = '1.0.0';
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize all managers
            window.storageManager = new LocalStorageManager();
            window.formHandler = new FormHandler();
            window.tableManager = new TableManager();
            window.exportManager = new ExportManager();
            
            // Set global reference
            window.app = this;
            
            // Load initial data
            await window.tableManager.loadStudents();
            this.updateStatistics();
            
            // Set up periodic statistics updates
            setInterval(() => {
                this.updateStatistics();
            }, 30000); // Update every 30 seconds
            
            console.log(`✅ Student Registration System v${this.version} initialized successfully`);
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showErrorMessage('حدث خطأ أثناء تحميل النظام');
        }
    }

    updateStatistics() {
        const stats = window.storageManager.getStatistics();
        
        // Update statistics cards
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalRevenue').textContent = stats.totalRevenue.toLocaleString('ar-EG');
        document.getElementById('firstGradeCount').textContent = stats.gradeDistribution.first || 0;
        document.getElementById('thirdGradeCount').textContent = stats.gradeDistribution.third || 0;
        
        // Add animation to updated numbers
        this.animateStatCards();
    }

    animateStatCards() {
        document.querySelectorAll('[id$="Students"], [id$="Revenue"], [id$="Count"]').forEach(card => {
            card.parentElement.classList.add('stat-card');
            card.parentElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                card.parentElement.style.transform = 'scale(1)';
            }, 200);
        });
    }

    showWelcomeMessage() {
        // Only show welcome message on first visit
        const hasVisited = localStorage.getItem('hasVisitedStudentApp');
        if (!hasVisited) {
            setTimeout(() => {
                const welcomeMessage = `
                    مرحباً بك في نظام تسجيل الطلاب! 🎓
                    
                    ✅ البيانات محفوظة محلياً في متصفحك
                    ✅ يمكنك تصدير البيانات كـ Excel أو PDF
                    ✅ النظام يدعم البحث والفلترة المتقدمة
                    
                    نصائح مهمة:
                    • احتفظ بنسخة احتياطية من البيانات دورياً
                    • استخدم ميزة التصدير لحفظ التقارير
                `;
                
                alert(welcomeMessage);
                localStorage.setItem('hasVisitedStudentApp', 'true');
            }, 1000);
        }
    }

    // Data management functions
    async clearAllData() {
        const confirmMessage = `
            ⚠️ تحذير: هذا سيحذف جميع بيانات الطلاب نهائياً!
            
            هل أنت متأكد من أنك تريد حذف جميع البيانات؟
            هذا الإجراء لا يمكن التراجع عنه.
        `;
        
        if (confirm(confirmMessage) && confirm('تأكيد أخير: حذف جميع البيانات؟')) {
            try {
                const result = await window.storageManager.clearAllData();
                if (result.success) {
                    await window.tableManager.loadStudents();
                    this.updateStatistics();
                    this.showSuccessMessage('تم حذف جميع البيانات بنجاح');
                }
            } catch (error) {
                this.showErrorMessage('حدث خطأ أثناء حذف البيانات');
            }
        }
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (data.students && Array.isArray(data.students)) {
                    const confirmMessage = `
                        سيتم استيراد ${data.students.length} طالب.
                        هل تريد المتابعة؟
                    `;
                    
                    if (confirm(confirmMessage)) {
                        const result = await window.storageManager.importData(data);
                        if (result.success) {
                            await window.tableManager.loadStudents();
                            this.updateStatistics();
                            this.showSuccessMessage(`تم استيراد ${data.students.length} طالب بنجاح`);
                        }
                    }
                } else {
                    this.showErrorMessage('ملف البيانات غير صالح');
                }
            } catch (error) {
                this.showErrorMessage('حدث خطأ أثناء قراءة الملف');
                console.error('Import error:', error);
            }
        };
        
        input.click();
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new StudentRegistrationApp();
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + N: Focus on name input (new student)
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        document.getElementById('studentName').focus();
    }
    
    // Ctrl + F: Focus on search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Ctrl + E: Export to Excel
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportToExcel();
    }
});
