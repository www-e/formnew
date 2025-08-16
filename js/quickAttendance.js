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

    async handleSubmit(event) {
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

        // **FIXED: Use local date consistently**
        const today = new Date();
        const todayDayOfWeek = today.getDay();

        // **FIXED: Create local date string instead of UTC**
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        // Find the student's group schedule
        const groupSchedule = window.attendancePage.groupSchedules[student.groupTime];
        if (!groupSchedule) {
            this.showMessage(`مجموعة الطالب غير موجودة في النظام: ${student.groupTime}`, true);
            return;
        }

        if (!groupSchedule.days.includes(todayDayOfWeek)) {
            this.showMessage(`اليوم ليس من الأيام المحددة لمجموعة هذا الطالب.`, true);
            return;
        }

        if (student.attendance && student.attendance[todayString] === 'present') {
            this.showMessage(`تم تسجيل حضور هذا الطالب بالفعل اليوم.`, false);
            return;
        }

        // **CRITICAL FIX: Ensure attendance object exists**
        if (!student.attendance) {
            student.attendance = {};
        }
        student.attendance[todayString] = 'present';

        // **CRITICAL FIX: Await the save to ensure persistence**
        try {
            await this.storageManager.autoSave();
            console.log(`✅ Attendance saved for ${student.name}:`, student.attendance);

            this.showMessage(`تم تسجيل حضور الطالب: ${student.name}`);
            this.studentIdInput.value = '';

            // **CRITICAL FIX: Force UI refresh immediately**
            if (this.onAttendanceMarked) {
                this.onAttendanceMarked();
            }
        } catch (error) {
            console.error('❌ Failed to save attendance:', error);
            this.showMessage('فشل في حفظ الحضور. حاول مرة أخرى.', true);

            // **ROLLBACK: Remove the attendance since save failed**
            delete student.attendance[todayString];
        }
    }


}