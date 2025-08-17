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

    // Date validation
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    const monthKey = `${year}-${month}`; // Key for payment check

    console.log(`📅 Marking attendance for ${student.name} on ${todayString}`);

    // Group schedule validation
    const groupSchedule = window.attendancePage.groupSchedules[student.groupTime];
    if (!groupSchedule) {
        this.showMessage(`مجموعة الطالب غير موجودة: ${student.groupTime}`, true);
        return;
    }

    if (!groupSchedule.days.includes(todayDayOfWeek)) {
        this.showMessage(`اليوم ليس من الأيام المحددة لمجموعة هذا الطالب.`, true);
        return;
    }

    // --- NEW: Payment Status Check ---
    const requiredAmount = this.storageManager.getRequiredPayment(student.grade, student.section);
    const hasPaid = student.payments && student.payments[monthKey] && student.payments[monthKey].amountPaid >= requiredAmount;

    // --- MODIFICATION: The rest of the function is wrapped in a try/catch ---
    try {
        if (student.attendance && student.attendance[todayString] === 'present') {
            this.showMessage(`تم تسجيل حضور هذا الطالب بالفعل اليوم.`, false);
        } else {
            // Mark attendance
            this.showMessage('جاري الحفظ...', false);
            const attendanceUpdate = {
                attendance: { [todayString]: 'H' }
            };
            const result = await this.storageManager.updateStudent(studentId, attendanceUpdate, true); // Use merge update
            
            if (result.success) {
                console.log(`✅ Attendance saved successfully for ${student.name}`);
                this.showMessage(`تم تسجيل حضور الطالب: ${student.name}`);
                if (this.onAttendanceMarked) {
                    this.onAttendanceMarked(); // Refresh the main attendance table
                }
            } else {
                throw new Error(result.message);
            }
        }

        // --- NEW: Display payment warning AFTER attendance is marked ---
        if (!hasPaid) {
            // Append a warning message without clearing the success message
            const existingMessage = this.messageEl.textContent;
            this.messageEl.innerHTML = `
                ${existingMessage}
                <br>
                <span class="text-yellow-600 font-bold">⚠️ تنبيه: لم يتم دفع مصاريف هذا الشهر.</span>
            `;
        }
        
        this.studentIdInput.value = ''; // Clear input for next scan

    } catch (error) {
        console.error('❌ Failed to save attendance:', error);
        this.showMessage('فشل في حفظ الحضور. حاول مرة أخرى.', true);
    }
}

}