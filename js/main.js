// =================================================================
// Main Application Context
// =================================================================
// This script initializes core services and makes them available
// globally under the `window.appContext` object.
// It should be loaded before page-specific scripts like app.js or attendance.js.

(function() {
    console.log("🚀 Initializing application context...");

    const appContext = {
        fileManager: new FileManager(),
        storageManager: new StorageManager(),
        // We can add more shared services here in the future
    };

    window.appContext = appContext;
    
    console.log("✅ Application context ready.");
})();