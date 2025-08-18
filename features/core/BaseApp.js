// js/BaseApp.js - The parent class for shared application logic
class BaseApp {
    constructor() {
        this.fileManager = window.appContext.fileManager;
        this.storageManager = window.appContext.storageManager;
        
        // Make this instance globally available for notifications
        window.app = this;
    }

    async initializeBase() {
        const result = await this.fileManager.loadFile();
        const statusEl = document.getElementById('db-status');

        if (result.success) {
            this.storageManager.loadData(result.data);
            window.storageManager = this.storageManager; // Make globally available
            this.updateStatistics();
            this.enableUI(result.isNew);
            return true;
        } else {
            statusEl.innerHTML = '<i class="fas fa-times-circle text-red-500 ml-2"></i><span class="text-red-500">فشل تحميل البيانات</span>';
            this.showErrorMessage("فشل تحميل قاعدة البيانات.");
            return false;
        }
    }

    enableUI(isNewFile) {
        const statusEl = document.getElementById('db-status');
        if (isNewFile) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-circle text-yellow-500 ml-2"></i><span class="text-yellow-600">قاعدة بيانات جديدة</span>';
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
        // Handle case where secondGradeCount might not exist on all pages
        const secondGradeEl = document.getElementById('secondGradeCount');
        if(secondGradeEl) secondGradeEl.textContent = stats.gradeDistribution['second'] || 0;
        document.getElementById('thirdGradeCount').textContent = stats.gradeDistribution['third'] || 0;
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