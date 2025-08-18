class QuickAttendance {
    constructor(storageManager, onAttendanceMarkedCallback) {
        this.storageManager = storageManager;
        this.onAttendanceMarked = onAttendanceMarkedCallback;

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
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    show() {
        this.messageEl.innerHTML = '';
        this.messageEl.className = 'text-sm text-gray-500 mt-2 h-auto';
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

        const now = new Date();
        const todayString = TimeUtils.toYYYYMMDD(now);
        const monthKey = todayString.substring(0, 7);

        const groupSchedule = window.attendancePage.groupSchedules[student.groupTime];
        if (!groupSchedule || !groupSchedule.days.includes(now.getDay())) {
            this.showMessage(`اليوم ليس من الأيام المحددة لمجموعة هذا الطالب.`, true);
            return;
        }

        try {
            // --- CRITICAL FIX: Check for the existence of the record object, not its value ---
            if (student.attendance && student.attendance[todayString]) {
                this.showMessage(`تم تسجيل حضور هذا الطالب بالفعل اليوم.`, false);
            } else {
                this.showMessage('جاري الحفظ...', false);
                const attendanceUpdate = {
                    attendance: {
                        [todayString]: {
                            status: 'H',
                            timestamp: now.toISOString()
                        }
                    }
                };
                const result = await this.storageManager.updateStudent(studentId, attendanceUpdate, true);

                if (result.success) {
                    this.showMessage(`تم تسجيل حضور الطالب: ${student.name}`);
                    if (this.onAttendanceMarked) this.onAttendanceMarked();
                } else {
                    throw new Error(result.message);
                }
            }

            // Payment check logic
            const isPermanentlyExempt = student.isExempt === true;
            const isMonthExempt = isPermanentlyExempt || (typeof student.isExempt === 'object' && student.isExempt && student.isExempt[monthKey]);
            if (!isMonthExempt) {
                const requiredAmount = this.storageManager.getRequiredPayment(student.grade, student.section);
                const hasPaid = student.payments && student.payments[monthKey] && student.payments[monthKey].amountPaid >= requiredAmount;
                if (!hasPaid) {
                    const existingMessage = this.messageEl.textContent;
                    this.messageEl.innerHTML = `${existingMessage}<br><span class="text-yellow-600 font-bold">⚠️ تنبيه: لم يتم دفع مصاريف هذا الشهر.</span>`;
                }
            }
            
            this.studentIdInput.value = '';

        } catch (error) {
            console.error('❌ Failed to save attendance:', error);
            this.showMessage('فشل في حفظ الحضور. حاول مرة أخرى.', true);
        }
    }
}