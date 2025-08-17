class StudentRegistrationApp extends BaseApp {
    constructor() {
        super(); // Call the BaseApp constructor
        if (document.getElementById('studentForm')) {
            this.version = '3.0.0-refactored';
            
            this.formHandler = new FormHandler();
            this.tableManager = new TableManager();
            this.exportManager = new ExportManager();
            
            // Make managers globally available for this page
            window.tableManager = this.tableManager;
            window.formHandler = this.formHandler;
            window.exportManager = this.exportManager;
            
            this.initialize();
        }
    }

    async initialize() {
        console.log(`✅ Student Page v${this.version} initialized.`);
        const loaded = await this.initializeBase(); // Call the shared initialization logic
        if (loaded) {
            this.tableManager.loadStudents();
            this.setupEventListeners();

            // Check for edit parameter in URL
            const urlParams = new URLSearchParams(window.location.search);
            const studentIdToEdit = urlParams.get('edit');
            if (studentIdToEdit) {
                setTimeout(() => {
                    this.formHandler.editStudentById(studentIdToEdit);
                }, 100);
            }
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

        document.getElementById('importCSVBtn')?.addEventListener('click', async () => {
            const result = await this.storageManager.importStudentsFromCSV();
            if (result.success) {
                this.showSuccessMessage(result.message);
                this.tableManager.loadStudents();
                this.updateStatistics();
            } else {
                this.showErrorMessage(result.message);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.appContext) {
        new StudentRegistrationApp();
    } else {
        console.error("AppContext is not ready!");
    }
});