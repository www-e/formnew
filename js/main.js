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
