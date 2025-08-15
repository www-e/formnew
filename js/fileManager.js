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
            console.warn('Could not parse database.json. It might be empty or malformed. Starting with a fresh database.', error);
            // Treat as a new database if parsing fails. This is a successful recovery.
            return { success: true, isNew: true, data: { students: [], settings: { lastId: 0 } } };
        }
    }
}