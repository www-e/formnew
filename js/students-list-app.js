class StudentsListApp extends BaseApp {
    constructor() {
        super();
        if (document.getElementById('studentsTableBody')) {
            this.version = '3.0.0-refactored';
            
            this.tableManager = new TableManager();
            this.exportManager = new ExportManager();
            
            window.tableManager = this.tableManager;
            window.exportManager = this.exportManager;
            
            this.initialize();
        }
    }

    async initialize() {
        console.log(`✅ Students List v${this.version} initialized.`);
        const loaded = await this.initializeBase();
        if(loaded){
            this.tableManager.loadStudents();
            this.setupEventListeners();
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
            if (result.success) this.showSuccessMessage(result.message);
            else this.showErrorMessage(result.message);
        });

        document.getElementById('restoreBtn')?.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد؟ سيتم استبدال جميع البيانات الحالية.')) {
                const result = await this.storageManager.restoreBackup();
                if (result.success) this.showSuccessMessage(result.message);
                else this.showErrorMessage(result.message);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.appContext) {
        new StudentsListApp();
    } else {
        console.error("AppContext is not ready!");
    }
});