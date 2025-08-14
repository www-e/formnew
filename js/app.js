class StudentRegistrationApp {
    constructor() {
        if (document.getElementById('studentForm')) {
            this.version = '1.1.0-server-based';
            this.initialize();
        }
    }

    async initialize() {
        window.fileManager = new FileManager();
        window.storageManager = new StorageManager();
        window.formHandler = new FormHandler();
        window.tableManager = new TableManager();
        window.exportManager = new ExportManager();
        window.app = this;
        
        console.log(`✅ Student Registration System v${this.version} initialized.`);
        await this.loadInitialData();
    }

    async loadInitialData() {
        const result = await window.fileManager.loadFile();
        const statusEl = document.getElementById('db-status');

        if (result.success || result.isNew) {
            window.storageManager.loadData(result.data);
            window.tableManager.loadStudents();
            this.updateStatistics();
            this.enableUI(result.isNew);
        } else {
            statusEl.innerHTML = '<i class="fas fa-times-circle text-red-500 ml-2"></i><span class="text-red-500">فشل تحميل البيانات</span>';
            this.showErrorMessage("فشل تحميل قاعدة البيانات. تأكد من تشغيل الخادم المحلي.");
        }
    }

    enableUI(isNewFile) {
        const statusEl = document.getElementById('db-status');
        if (isNewFile) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-circle text-yellow-500 ml-2"></i><span class="text-yellow-600">قاعدة بيانات جديدة</span>';
        } else {
            statusEl.innerHTML = '<i class="fas fa-check-circle text-green-500 ml-2"></i><span class="text-green-600">البيانات محملة</span>';
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.classList.remove('opacity-50', 'pointer-events-none');
        this.showSuccessMessage("النظام جاهز للاستخدام.");
    }

    updateStatistics() {
        const stats = window.storageManager.getStatistics();
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalRevenue').textContent = stats.totalRevenue.toLocaleString('ar-EG');
        document.getElementById('firstGradeCount').textContent = stats.gradeDistribution['1'] || 0;
        document.getElementById('thirdGradeCount').textContent = stats.gradeDistribution['3'] || 0;
        this.animateStatCards();
    }

    animateStatCards() {
        document.querySelectorAll('.stat-card > div:first-child').forEach(card => {
            card.style.transform = 'scale(1.1)';
            setTimeout(() => card.style.transform = 'scale(1)'), 250);
        });
    }

    showSuccessMessage(message) { this.showNotification(message, 'success'); }
    showErrorMessage(message) { this.showNotification(message, 'error'); }

    showNotification(message, type) {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        notification.className = `notification fixed top-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center`;
        notification.innerHTML = `<i class="fas ${icon} ml-3"></i><p>${message}</p>`;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StudentRegistrationApp();
});