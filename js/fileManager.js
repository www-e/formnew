class FileManager {
    constructor() {
        this.databasePath = './data/database.json';
    }

    async loadFile() {
        try {
            const response = await fetch(this.databasePath);
            if (!response.ok) {
                // If file doesn't exist (404), create a new in-memory database
                if (response.status === 404) {
                    console.warn('database.json not found. A new one will be created on first save.');
                    return { success: true, isNew: true, data: { students: [], settings: { lastId: 0 } } };
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return { success: true, isNew: false, data: data };
        } catch (error) {
            console.error('Failed to load or parse database.json:', error);
            // This can happen if the file is empty or malformed. Start fresh.
            return { success: false, isNew: true, data: { students: [], settings: { lastId: 0 } } };
        }
    }
}