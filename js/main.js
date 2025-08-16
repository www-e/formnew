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
})();
window.addEventListener('beforeunload', async () => {
    try {
        const data = await window.appContext.storageManager.data;
        if (data && data.students && data.students.length > 0) {
            localStorage.setItem('emergency_backup', JSON.stringify(data));
        }
    } catch (e) {
        console.log('Emergency backup failed');
    }
});