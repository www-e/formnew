class StudentsApp extends BaseApp {
    constructor() {
        super();
        this.version = '4.0.0-refactored';
        
        if (document.getElementById('studentForm')) {
            this.formHandler = new FormHandler();
            window.formHandler = this.formHandler;
        }

        this.tableManager = new TableManager();
        this.exportManager = new ExportManager();
        
        window.tableManager = this.tableManager;
        window.exportManager = this.exportManager;
        
        this.initialize();
    }

    async initialize() {
        console.log(`✅ Students Feature v${this.version} initialized.`);
        const loaded = await this.initializeBase();
        if(loaded){
            this.tableManager.loadStudents();
            this.setupEventListeners();

            if (this.formHandler) {
                const urlParams = new URLSearchParams(window.location.search);
                const studentIdToEdit = urlParams.get('edit');
                if (studentIdToEdit) {
                    setTimeout(() => {
                        this.formHandler.editStudentById(studentIdToEdit);
                    }, 100);
                }
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

        if (this.formHandler) {
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
}