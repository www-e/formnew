class AutoBackupManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.backupInterval = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
        this.backupEndpoint = 'http://localhost:8000/backup'; // Local server endpoint
    }

    start() {
        console.log('🚀 Starting auto-backup service...');
        // Perform a backup immediately on start
        this.performBackup();
        // Set up interval for periodic backups
        setInterval(() => this.performBackup(), this.backupInterval);
    }

    async performBackup() {
        try {
            const allData = this.storageManager.data; // Get the entire application data
            const jsonContent = JSON.stringify(allData, null, 2);

            const response = await fetch(this.backupEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonContent,
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Auto-backup successful: ${result.message}`);
            } else {
                const errorText = await response.text();
                console.error(`❌ Auto-backup failed: Server responded with ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Auto-backup failed:', error);
        }
    }
}
