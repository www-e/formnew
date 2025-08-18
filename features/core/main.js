// js/main.js - Enhanced Application Context
(function() {
    console.log("🚀 Initializing enhanced application context...");

    // Create managers
    const fileManager = new FileManager();
    const storageManager = new StorageManager();

    // Connect them
    storageManager.setFileManager(fileManager);

    const appContext = {
        fileManager: fileManager,
        storageManager: storageManager,
    };

    window.appContext = appContext;

    console.log("✅ Enhanced application context ready with IndexedDB!");

    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('studentForm') || document.getElementById('studentsTableBody')) {
            new StudentsApp();
        } else if (document.getElementById('attendance-table-body')) {
            new AttendancePage();
        } else if (document.getElementById('payments-table-body')) {
            new PaymentsPage();
        } else if (document.getElementById('admin-table-body')) {
            new AdminPage();
        }
    });
})();