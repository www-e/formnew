class StudentRegistrationApp {
    constructor() {
        if (document.getElementById('studentForm')) {
            this.version = '1.2.0-refactored';

            // Use the globally available context
            this.fileManager = window.appContext.fileManager;
            this.storageManager = window.appContext.storageManager;

            this.formHandler = new FormHandler();
            this.tableManager = new TableManager();
            this.exportManager = new ExportManager();
            window.app = this; // Maintain global reference for notifications

            this.initialize();
        }
    }

    async initialize() {
        console.log(`✅ Student Page v${this.version} initialized.`);
        await this.loadInitialData();
    }

    async loadInitialData() {
        const result = await this.fileManager.loadFile();
        const statusEl = document.getElementById('db-status');

        if (result.success) {
            this.storageManager.loadData(result.data);
            this.tableManager.loadStudents(); // Use the loaded data
            this.updateStatistics();
            this.enableUI(result.isNew);
        } else {
            statusEl.innerHTML = '<i class="fas fa-times-circle text-red-500 ml-2"></i><span class="text-red-500">فشل تحميل البيانات</span>';
            this.showErrorMessage("فشل تحميل قاعدة البيانات.");
        }
    }

    enableUI(isNewFile) {
        const statusEl = document.getElementById('db-status');
        if (isNewFile) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-circle text-yellow-500 ml-2"></i><span class="text-yellow-600">قاعدة بيانات جديدة</span>';
            this.showSuccessMessage("تم إنشاء قاعدة بيانات جديدة. ستحتاج لحفظ البيانات يدوياً.");

        } else {
            statusEl.innerHTML = '<i class="fas fa-check-circle text-green-500 ml-2"></i><span class="text-green-600">البيانات محملة</span>';
        }

        document.getElementById('main-content').classList.remove('opacity-25', 'pointer-events-none');
    }

    updateStatistics() {
        const stats = this.storageManager.getStatistics();
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalRevenue').textContent = stats.totalRevenue.toLocaleString('ar-EG');
        document.getElementById('firstGradeCount').textContent = stats.gradeDistribution['first'] || 0;
        document.getElementById('thirdGradeCount').textContent = stats.gradeDistribution['third'] || 0;
        this.animateStatCards();
    }

    animateStatCards() {
        document.querySelectorAll('.stat-card > div:first-child').forEach(card => {
            card.style.transform = 'scale(1.1)';
            setTimeout(() => { card.style.transform = 'scale(1)'; }, 250);
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
        setTimeout(() => { notification.remove(); }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for the main context to be ready before initializing the page
    if (window.appContext) {
        new StudentRegistrationApp();
    } else {
        console.error("AppContext is not ready!");
    }
    // Backup button
    document.getElementById('backupBtn')?.addEventListener('click', async () => {
        const result = await window.appContext.storageManager.createBackup();
        if (result.success) {
            window.app.showSuccessMessage(result.message);
        } else {
            window.app.showErrorMessage(result.message);
        }
    });

    // Restore button  
    document.getElementById('restoreBtn')?.addEventListener('click', async () => {
        if (confirm('هل أنت متأكد؟ سيتم استبدال جميع البيانات الحالية.')) {
            const result = await window.appContext.storageManager.restoreBackup();
            if (result.success) {
                window.app.showSuccessMessage(result.message);
            } else {
                window.app.showErrorMessage(result.message);
            }
        }
    });
});