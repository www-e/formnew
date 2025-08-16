class QuickAttendance {
    constructor(storageManager, onAttendanceMarkedCallback) {
        this.storageManager = storageManager;
        this.onAttendanceMarked = onAttendanceMarkedCallback; // Callback to refresh the main table

        // Modal UI Elements
        this.modal = document.getElementById('quick-attendance-modal');
        this.closeBtn = document.getElementById('modal-close-btn');
        this.form = document.getElementById('quick-attendance-form');
        this.studentIdInput = document.getElementById('modal-student-id');
        this.messageEl = document.getElementById('modal-message');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.closeBtn.addEventListener('click', () => this.hide());

        // Also hide if the user clicks outside the modal content
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    show() {
        this.messageEl.textContent = '';
        this.messageEl.className = 'text-sm text-gray-500 mt-2';
        this.studentIdInput.value = '';
        this.modal.classList.remove('hidden');
        this.studentIdInput.focus();
    }

    hide() {
        this.modal.classList.add('hidden');
    }

    showMessage(text, isError = false) {
        this.messageEl.textContent = text;
        this.messageEl.className = isError ? 'text-sm text-red-600 mt-2 font-bold' : 'text-sm text-green-600 mt-2 font-bold';
    }

    handleSubmit(event) {
        event.preventDefault();
        const studentId = this.studentIdInput.value.trim();
        if (!studentId) {
            this.showMessage('يرجى إدخال كود الطالب.', true);
            return;
        }

        const student = this.storageManager.data.students.find(s => s.id === studentId);
        if (!student) {
            this.showMessage('هذا الكود غير صحيح أو غير مسجل.', true);
            return;
        }

        // --- Crucial Validation Logic ---
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const todayDayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

        // Find the student's group schedule
        const groupSchedule = window.attendancePage.groupSchedules[student.groupTime];
        if (!groupSchedule || !groupSchedule.days.includes(todayDayOfWeek)) {
            this.showMessage(`اليوم ليس من الأيام المحددة لمجموعة هذا الطالب.`, true);
            return;
        }

        if (student.attendance && student.attendance[todayString] === 'present') {
            this.showMessage(`تم تسجيل حضور هذا الطالب بالفعل اليوم.`, false);
            return;
        }

        // All checks passed, mark as present
        if (!student.attendance) {
            student.attendance = {};
        }
        student.attendance[todayString] = 'present';

        // **FIX: Auto-save the attendance data immediately**
        this.storageManager.autoSave();

        this.showMessage(`تم تسجيل حضور الطالب: ${student.name}`);

        // Clear the input for the next entry
        this.studentIdInput.value = '';

        // Notify the main page to refresh its table view
        if (this.onAttendanceMarked) {
            this.onAttendanceMarked();
        }
    }

}