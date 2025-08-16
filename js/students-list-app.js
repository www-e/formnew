class StudentsListApp {
    constructor() {
        if (document.getElementById('studentsTableBody')) {
            this.version = '2.0.0-modular';
            
            this.fileManager = window.appContext.fileManager;
            this.storageManager = window.appContext.storageManager;
            
            this.tableManager = new TableManager();
            this.exportManager = new ExportManager();
            
            window.app = this;
            window.tableManager = this.tableManager;
            window.exportManager = this.exportManager;
            
            this.initialize();
        }
    }

    async initialize() {
        console.log(`✅ Students List v${this.version} initialized.`);
        await this.loadInitialData();
        this.setupEventListeners();
    }

    async loadInitialData() {
        const result = await this.fileManager.loadFile();
        const statusEl = document.getElementById('db-status');

        if (result.success) {
            this.storageManager.loadData(result.data);
            window.storageManager = this.storageManager;
            this.tableManager.loadStudents();
            this.updateStatistics();
            this.enableUI(result.isNew);
        } else {
            statusEl.innerHTML = '<i class="fas fa-times-circle text-red-500 ml-2"></i><span class="text-red-500">فشل تحميل البيانات</span>';
        }
    }

    setupEventListeners() {
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
            this.exportManager.setStudentsData(this.storageManager.getAllStudents());
            this.exportManager.exportToExcel();
        });

        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            this.tableManager.clearFilters();
        });

        document.getElementById('backupBtn')?.addEventListener('click', async () => {
            const result = await this.storageManager.createBackup();
            if (result.success) {
                this.showSuccessMessage(result.message);
            } else {
                this.showErrorMessage(result.message);
            }
        });

        document.getElementById('restoreBtn')?.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد؟ سيتم استبدال جميع البيانات الحالية.')) {
                const result = await this.storageManager.restoreBackup();
                if (result.success) {
                    this.showSuccessMessage(result.message);
                } else {
                    this.showErrorMessage(result.message);
                }
            }
        });
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

document.addEventListener('DOMContentLoaded', () => {
    if (window.appContext) {
        new StudentsListApp();
    } else {
        console.error("AppContext is not ready!");
    }
});
