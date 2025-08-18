// js/utils/TimeUtils.js

class TimeUtils {
    /**
     * Parses a 'HH:mm' time string into a Date object for today.
     * @param {string} timeString - The time in 'HH:mm' format (e.g., '15:15').
     * @returns {Date} A Date object set to today with the specified time.
     */
    static parseTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return date;
    }

    /**
     * Calculates the difference in minutes between two Date objects.
     * @param {Date} startTime - The earlier time.
     * @param {Date} endTime - The later time.
     * @returns {number} The difference in whole minutes.
     */
    static getMinutesDifference(startTime, endTime) {
        const diff = endTime.getTime() - startTime.getTime();
        return Math.round(diff / 60000);
    }

    /**
     * Formats a date string into a standard YYYY-MM-DD format.
     * @param {Date} date - The date object to format.
     * @returns {string} The formatted date string.
     */
    static toYYYYMMDD(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}