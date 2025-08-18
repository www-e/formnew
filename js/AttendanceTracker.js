// js/components/AttendanceTracker.js

class AttendanceTracker {
    constructor(storageManager, groupSchedules, onUpdate) {
        this.storageManager = storageManager;
        this.groupSchedules = groupSchedules;
        this.onUpdate = onUpdate; // Callback to trigger UI refresh
        this.intervalId = null;
        this.ABSENCE_GRACE_PERIOD = 15; // minutes
    }

    start() {
        console.log('🕒 Auto-Absence Service Started.');
        if (this.intervalId) clearInterval(this.intervalId);

        // Run immediately on start, then every minute
        this.checkForAbsences();
        this.intervalId = setInterval(() => this.checkForAbsences(), 60000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            console.log('🛑 Auto-Absence Service Stopped.');
        }
    }

    async checkForAbsences() {
        console.log('Checking for absences...');
        const now = new Date();
        const todayString = TimeUtils.toYYYYMMDD(now);
        let updated = false;

        const allStudents = this.storageManager.getAllStudents();

        for (const student of allStudents) {
            const schedule = this.groupSchedules[student.groupTime];

            // Check if the student has a class today
            if (schedule && schedule.days.includes(now.getDay())) {
                const classTime = TimeUtils.parseTime(schedule.time);
                const timeDiff = TimeUtils.getMinutesDifference(classTime, now);

                // If class was more than 15 mins ago and student is not marked
                if (timeDiff > this.ABSENCE_GRACE_PERIOD) {
                    const hasAttendance = student.attendance && student.attendance[todayString];
                    if (!hasAttendance) {
                        console.log(`Marking ${student.name} as absent...`);
                        const attendanceUpdate = {
                            attendance: {
                                [todayString]: { status: 'G', timestamp: new Date().toISOString() }
                            }
                        };
                        await this.storageManager.updateStudent(student.id, attendanceUpdate, true);
                        updated = true;
                    }
                }
            }
        }

        if (updated) {
            console.log('Absence updates were made. Triggering UI refresh.');
            if (this.onUpdate) this.onUpdate();
        }
    }
}