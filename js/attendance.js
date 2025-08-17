class AttendancePage {
    constructor() {
        this.version = '1.3.0-hotfix'; // Updated version to reflect the fix
        // UI Elements
        this.mainContent = document.getElementById('main-content');
        this.dbStatusEl = document.getElementById('db-status');
        this.monthDisplay = document.getElementById('current-month-display');
        this.prevMonthBtn = document.getElementById('prev-month-btn');
        this.nextMonthBtn = document.getElementById('next-month-btn');
        this.todayBtn = document.getElementById('today-btn');
        this.gradeFilter = document.getElementById('grade-filter');
        this.groupFilter = document.getElementById('group-filter');
        this.tableHeader = document.getElementById('attendance-table-header');
        this.tableBody = document.getElementById('attendance-table-body');
        this.saveBtn = document.getElementById('save-attendance-btn');
        this.quickAttendanceBtn = document.getElementById('quick-attendance-btn');
        this.makeupModal = document.getElementById('makeup-attendance-modal');
        this.makeupModalCloseBtn = document.getElementById('makeup-modal-close-btn');
        this.makeupAttendanceForm = document.getElementById('makeup-attendance-form');
        this.makeupStudentIdInput = document.getElementById('makeup-student-id');
        this.makeupDatesContainer = document.getElementById('makeup-dates-container');
        this.makeupDatesList = document.getElementById('makeup-dates-list');
        this.makeupModalMessage = document.getElementById('makeup-modal-message');
        this.makeupAttendanceBtn = document.getElementById('makeup-attendance-btn');
        // State
        this.currentDate = new Date();
        this.allStudents = [];
        this.groupSchedules = this.getGroupSchedules();

        // Managers & Components
        // --- FIX: Use the globally available context ---
        this.fileManager = window.appContext.fileManager;
        this.storageManager = window.appContext.storageManager;
        this.quickAttendanceModal = null; // This will be initialized after data load

        this.initialize();
    }

    getGroupSchedules() {
        // This MUST match exactly with the group options in formHandler.js!
        return {
            // First grade groups
            'sat_tue_315': { days: [6, 2], text: 'السبت والثلاثاء - 3:15 م' },
            'sat_tue_430': { days: [6, 2], text: 'السبت والثلاثاء - 4:30 م' },
            'sun_wed_200': { days: [0, 3], text: 'الأحد والأربعاء - 2:00 م' },
            'mon_thu_200': { days: [1, 4], text: 'الاثنين والخميس - 2:00 م' },

            // Second grade groups
            'sat_tue_200': { days: [6, 2], text: 'السبت والثلاثاء - 2:00 م' },
            'sun_wed_315': { days: [0, 3], text: 'الأحد والأربعاء - 3:15 م' },
            'mon_thu_315': { days: [1, 4], text: 'الاثنين والخميس - 3:15 م' },

            // Third grade groups - THIS WAS MISSING!
            'sat_tue_thu_1200': { days: [6, 2, 4], text: 'السبت والثلاثاء والخميس - 12:00 م' },
            'sun_wed_430': { days: [0, 3], text: 'الأحد والأربعاء - 4:30 م' }
        };
    }


    async initialize() {
        console.log(`✅ Attendance System v${this.version} initialized.`);
        await this.loadInitialData();
    }

    async loadInitialData() {
        const result = await this.fileManager.loadFile();
        if (result.success) {
            this.storageManager.loadData(result.data);
            this.allStudents = this.storageManager.getAllStudents();
            this.enableUI(result.isNew);
        } else {
            this.dbStatusEl.innerHTML = '<i class="fas fa-times-circle text-red-500 ml-2"></i><span class="text-red-500">فشل التحميل</span>';
        }
    }

    enableUI(isNewFile) {
        if (isNewFile) {
            this.dbStatusEl.innerHTML = '<i class="fas fa-exclamation-circle text-yellow-500 ml-2"></i><span class="text-yellow-600">جديد</span>';
        } else {
            this.dbStatusEl.innerHTML = '<i class="fas fa-check-circle text-green-500 ml-2"></i><span class="text-green-600">محمل</span>';
        }
        this.mainContent.classList.remove('opacity-25', 'pointer-events-none');

        // Initialize the modal component. It's now safe to do so.
        this.quickAttendanceModal = new QuickAttendance(this.storageManager, () => this.render());
        window.attendancePage = this; // Make this page's instance globally available for the modal

        this.setupEventListeners();
        this.populateGroupFilter();
        this.render();
    }

    setupEventListeners() {
        this.prevMonthBtn.addEventListener('click', () => this.goToPreviousMonth());
        this.nextMonthBtn.addEventListener('click', () => this.goToNextMonth());
        this.todayBtn.addEventListener('click', () => this.goToToday());
        this.gradeFilter.addEventListener('change', () => {
            this.populateGroupFilter();
            this.render();
        });
        this.groupFilter.addEventListener('change', () => this.render());
        this.saveBtn.addEventListener('click', async () => await this.storageManager.persistData());
        this.quickAttendanceBtn.addEventListener('click', () => this.quickAttendanceModal.show());
                // Makeup Modal Listeners
        this.makeupAttendanceBtn.addEventListener('click', () => this.showMakeupModal());
        this.makeupModalCloseBtn.addEventListener('click', () => this.hideMakeupModal());
        this.makeupAttendanceForm.addEventListener('submit', (e) => this.findMakeupDates(e));
    }

    populateGroupFilter() {
        this.groupFilter.innerHTML = '<option value="all">كل المجموعات</option>';
        const selectedGrade = this.gradeFilter.value;
        const seenGroups = new Set();

        this.allStudents.forEach(student => {
            if ((selectedGrade === 'all' || student.grade === selectedGrade) &&
                !seenGroups.has(student.groupTime)) {
                // Verify this group exists in our schedules
                if (this.groupSchedules[student.groupTime]) {
                    this.groupFilter.add(new Option(student.groupTimeText, student.groupTime));
                    seenGroups.add(student.groupTime);
                } else {
                    console.warn('Student has unknown group:', student.groupTime, 'for student:', student.name);
                }
            }
        });
    }



    goToPreviousMonth() { this.currentDate.setMonth(this.currentDate.getMonth() - 1); this.render(); }
    goToNextMonth() { this.currentDate.setMonth(this.currentDate.getMonth() + 1); this.render(); }
    goToToday() { this.currentDate = new Date(); this.render(); }

    updateMonthDisplay() {
        this.monthDisplay.textContent = this.currentDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
    }

    getScheduledDatesForMonth(groupSchedule) {
        if (!groupSchedule || !groupSchedule.days) return [];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const dates = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (groupSchedule.days.includes(date.getDay())) {
                dates.push(date);
            }
        }
        return dates;
    }

    renderTableHeader(dates) {
        const dayNames = ['احد', 'اثنين', 'ثلاثاء', 'اربعاء', 'خميس', 'جمعة', 'سبت'];
        let headerHTML = `
        <tr>
            <th class="border p-2 text-center" style="width: 40px;">#</th>
            <th class="border p-2 text-center" style="width: 120px;">كود الطالب</th>
            <th class="border p-2 min-w-[200px]">اسم الطالب</th>
    `;

        dates.forEach(date => {
            headerHTML += `<th class="border p-2 text-center" style="width: 80px;">${dayNames[date.getDay()]}<br>${date.getDate()}</th>`;
        });
        headerHTML += '</tr>';
        this.tableHeader.innerHTML = headerHTML;
    }


    renderTableBody(students, dates) {
        if (students.length === 0) {
            this.tableBody.innerHTML = `<tr><td colspan="${dates.length + 3}" class="text-center py-12 text-gray-500">لا يوجد طلاب في هذه المجموعة.</td></tr>`;
            return;
        }

        let bodyHTML = '';
        const statusMap = {
            'H': { class: 'bg-green-200', text: 'ح' },  // حضور
            'T': { class: 'bg-yellow-200', text: 'ت' }, // تعويضي
        };
        const defaultStatus = { class: 'bg-gray-100', text: '-' };

        students.forEach((student, index) => {
            bodyHTML += `
        <tr class="table-row">
            <td class="border p-2 text-center font-bold">${index + 1}</td>
            <td class="border p-2 text-center font-mono text-sm">${student.id}</td>
            <td class="border p-2 font-semibold">${student.name}</td>
    `;

            dates.forEach(date => {
                // **CRITICAL FIX: Use local date string consistently**
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;

                const statusKey = student.attendance ? student.attendance[dateString] : undefined;
                const status = statusMap[statusKey] || defaultStatus;

                bodyHTML += `<td class="border p-2 text-center ${status.class}">${status.text}</td>`;
            });
            bodyHTML += '</tr>';
        });

        this.tableBody.innerHTML = bodyHTML;
    }




    render() {
        this.updateMonthDisplay();
        const selectedGrade = this.gradeFilter.value;
        const selectedGroup = this.groupFilter.value;

        if (selectedGrade === 'all' || selectedGroup === 'all') {
            this.tableHeader.innerHTML = '';
            this.tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-12 text-gray-500"><i class="fas fa-filter text-4xl mb-3"></i><p>اختر صفاً ومجموعة لعرض كشف الحضور</p></td></tr>';
            return;
        }

        // 🔥 CRITICAL FIX: Get fresh data from storage instead of using cached this.allStudents
        const allStudents = this.storageManager.getAllStudents();
        const filteredStudents = allStudents.filter(s => s.grade === selectedGrade && s.groupTime === selectedGroup);

        const groupSchedule = this.groupSchedules[selectedGroup];
        const scheduledDates = this.getScheduledDatesForMonth(groupSchedule);

        this.renderTableHeader(scheduledDates);
        this.renderTableBody(filteredStudents, scheduledDates);
    }
    // --- Makeup Attendance Modal Logic ---
    showMakeupModal() {
        this.makeupStudentIdInput.value = '';
        this.makeupDatesContainer.classList.add('hidden');
        this.makeupModalMessage.textContent = '';
        this.makeupModal.classList.remove('hidden');
        this.makeupStudentIdInput.focus();
    }

    hideMakeupModal() {
        this.makeupModal.classList.add('hidden');
    }

    async findMakeupDates(event) {
        event.preventDefault();
        this.makeupDatesContainer.classList.add('hidden');
        this.makeupDatesList.innerHTML = '';
        this.makeupModalMessage.textContent = 'جاري البحث...';

        const studentId = this.makeupStudentIdInput.value.trim();
        const student = this.storageManager.getAllStudents().find(s => s.id === studentId);

        if (!student) {
            this.makeupModalMessage.textContent = 'كود الطالب غير صحيح.';
            return;
        }

        // 1. Find all possible groups for the student's grade
        const gradeGroups = new Set();
        this.allStudents.forEach(s => {
            if (s.grade === student.grade) {
                gradeGroups.add(s.groupTime);
            }
        });

        // 2. Find the 2 closest past & 2 closest future valid session dates
        const today = new Date();
        const dates = new Set();
        
        const findDates = (direction) => {
            for (let i = 1; i <= 14 && dates.size < 4; i++) { // Search up to 2 weeks
                let targetDate = new Date(today);
                targetDate.setDate(today.getDate() + (i * direction));
                let dayOfWeek = targetDate.getDay();

                gradeGroups.forEach(groupKey => {
                    const schedule = this.groupSchedules[groupKey];
                    if (schedule && schedule.days.includes(dayOfWeek) && dates.size < 4) {
                         const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                         dates.add(dateString);
                    }
                });
            }
        };
        
        // This logic isn't perfect, but it's a good starting point.
        // A more robust solution might find exactly 2 past and 2 future dates.
        findDates(1); // Future
        findDates(-1); // Past

        const sortedDates = Array.from(dates).sort();

        if (sortedDates.length === 0) {
            this.makeupModalMessage.textContent = 'لم يتم العثور على مواعيد متاحة قريبة.';
            return;
        }

        this.makeupModalMessage.textContent = '';
        sortedDates.forEach(dateString => {
            const date = new Date(dateString + 'T00:00:00'); // Ensure correct date parsing
            const dayName = date.toLocaleString('ar-EG', { weekday: 'long' });
            const formattedDate = date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'p-4 border rounded-lg hover:bg-gray-100 text-center';
            button.innerHTML = `<span class="font-bold">${dayName}</span><br><span class="text-sm">${formattedDate}</span>`;
            button.onclick = () => this.saveMakeupSession(studentId, dateString);
            this.makeupDatesList.appendChild(button);
        });
        
        this.makeupDatesContainer.classList.remove('hidden');
    }

    async saveMakeupSession(studentId, dateString) {
        this.makeupModalMessage.textContent = 'جاري حفظ الحصة التعويضية...';
        
        const attendanceUpdate = {
            attendance: { [dateString]: 'T' } // Save with 'T' for Ta'weedy
        };

        const result = await this.storageManager.updateStudent(studentId, attendanceUpdate, true);

        if (result.success) {
            this.makeupModalMessage.textContent = 'تم حفظ الحصة بنجاح!';
            setTimeout(() => {
                this.hideMakeupModal();
                this.render(); // Re-render the main table
            }, 1000);
        } else {
            this.makeupModalMessage.textContent = 'فشل الحفظ. حاول مرة أخرى.';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.appContext) {
        // Since this page doesn't have a BaseApp instance, we create a simple notifications handler
        const showNotification = (message, type) => {
            const notification = document.createElement('div');
            const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
            const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
            notification.className = `notification fixed top-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center`;
            notification.innerHTML = `<i class="fas ${icon} ml-3"></i><p>${message}</p>`;
            document.body.appendChild(notification);
            setTimeout(() => { notification.remove(); }, 4000);
        };
        
        new AttendancePage();

        setTimeout(() => { // Wait for page to fully load
            document.getElementById('backupBtn')?.addEventListener('click', async () => {
                const result = await window.attendancePage.storageManager.createBackup();
                if(result.success) showNotification(result.message, 'success');
                else showNotification(result.message, 'error');
            });

            document.getElementById('restoreBtn')?.addEventListener('click', async () => {
                if (confirm('هل أنت متأكد؟ سيتم استبدال جميع البيانات الحالية.')) {
                    const result = await window.attendancePage.storageManager.restoreBackup();
                    if(result.success) showNotification(result.message, 'success');
                    else showNotification(result.message, 'error');
                }
            });
        }, 1000);

    } else {
        console.error("AppContext is not ready!");
    }
});