class MakeupModal {
    constructor(storageManager, groupSchedules, onSaveCallback) {
        this.storageManager = storageManager;
        this.groupSchedules = groupSchedules;
        this.onSave = onSaveCallback;

        // UI Elements
        this.modal = document.getElementById('makeup-attendance-modal');
        this.closeBtn = document.getElementById('makeup-modal-close-btn');
        this.form = document.getElementById('makeup-attendance-form');
        this.studentIdInput = document.getElementById('makeup-student-id');
        this.datesContainer = document.getElementById('makeup-dates-container');
        this.datesList = document.getElementById('makeup-dates-list');
        this.messageEl = document.getElementById('makeup-modal-message');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.hide());
        this.form.addEventListener('submit', (e) => this.findMakeupDates(e));
    }

    show() {
        this.studentIdInput.value = '';
        this.datesContainer.classList.add('hidden');
        this.messageEl.textContent = '';
        this.modal.classList.remove('hidden');
        this.studentIdInput.focus();
    }

    hide() {
        this.modal.classList.add('hidden');
    }

    async findMakeupDates(event) {
        event.preventDefault();
        this.datesContainer.classList.add('hidden');
        this.datesList.innerHTML = '';
        this.messageEl.textContent = 'جاري البحث...';

        const studentId = this.studentIdInput.value.trim();
        const student = this.storageManager.getAllStudents().find(s => s.id === studentId);

        if (!student) {
            this.messageEl.textContent = 'كود الطالب غير صحيح.';
            return;
        }

        // Use the student's specific groupTime
        const studentGroupKey = student.groupTime;
        if (!studentGroupKey) {
            this.messageEl.textContent = 'لا توجد مجموعة مسجلة لهذا الطالب.';
            return;
        }

        const studentSchedule = this.groupSchedules[studentGroupKey];
        if (!studentSchedule || !studentSchedule.days || studentSchedule.days.length === 0) {
            this.messageEl.textContent = 'لا يوجد جدول زمني متاح لمجموعة الطالب.';
            return;
        }

        const today = new Date();
        const dates = new Set();
        
        // Function to find valid dates matching the student's group schedule
        const findValidDates = (direction, count) => {
            let foundCount = 0;
            // Search up to 60 days in each direction to find enough dates
            for (let i = 1; i <= 60 && foundCount < count; i++) {
                let targetDate = new Date();
                targetDate.setDate(today.getDate() + (i * direction));
                let dayOfWeek = targetDate.getDay(); // 0 for Sunday, 1 for Monday, etc.

                // Check if the targetDate's dayOfWeek matches any of the student's group schedule days
                if (studentSchedule.days.includes(dayOfWeek)) {
                    const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                    // Ensure we don't add duplicate dates if a group has multiple days
                    if (!dates.has(dateString)) {
                        dates.add(dateString);
                        foundCount++;
                    }
                }
            }
        };

        findValidDates(-1, 2); // Find up to 2 past dates
        findValidDates(1, 2);  // Find up to 2 future dates
        
        const sortedDates = Array.from(dates).sort();

        if (sortedDates.length === 0) {
            this.messageEl.textContent = 'لم يتم العثور على مواعيد متاحة قريبة لمجموعة الطالب.';
            return;
        }

        this.messageEl.textContent = '';
        // Display up to 4 dates (2 past, 2 future)
        sortedDates.slice(0, 4).forEach(dateString => {
            const date = new Date(dateString + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
            const dayName = date.toLocaleString('ar-EG', { weekday: 'long' });
            const formattedDate = date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'p-4 border rounded-lg hover:bg-gray-100 text-center';
            button.innerHTML = `<span class="font-bold">${dayName}</span><br><span class="text-sm">${formattedDate}</span>`;
            button.onclick = () => this.saveMakeupSession(studentId, dateString);
            this.datesList.appendChild(button);
        });
        
        this.datesContainer.classList.remove('hidden');
    }

    async saveMakeupSession(studentId, dateString) {
        this.messageEl.textContent = 'جاري حفظ الحصة التعويضية...';
        
        const attendanceUpdate = {
            attendance: { 
                [dateString]: {
                    status: 'T', // Ta'weedy
                    timestamp: new Date().toISOString()
                } 
            }
        };

        const result = await this.storageManager.updateStudent(studentId, attendanceUpdate, true);

        if (result.success) {
            this.messageEl.textContent = 'تم حفظ الحصة بنجاح!';
            setTimeout(() => {
                this.hide();
                if (this.onSave) this.onSave();
            }, 1000);
        } else {
            this.messageEl.textContent = 'فشل الحفظ. حاول مرة أخرى.';
        }
    }
}