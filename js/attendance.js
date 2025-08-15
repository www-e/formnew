class AttendancePage {
    constructor() {
        this.version = '1.1.0';
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

        // State
        this.currentDate = new Date();
        this.allStudents = [];
        this.groupSchedules = this.getGroupSchedules();

        // Managers
        this.fileManager = new FileManager();
        this.storageManager = new StorageManager();

        // Modal Elements
        this.modal = document.getElementById('attendance-modal');
        this.modalStatusRadios = this.modal.querySelectorAll('input[name="attendance-status"]');
        this.modalSaveBtn = this.modal.querySelector('#modal-save-btn');
        this.modalCloseBtn = this.modal.querySelector('#modal-close-btn');
        this.activeCell = null; // keep track of clicked cell

        this.initialize();
    }

    getGroupSchedules() {
        // Defines the days of the week for each group value. (0=Sun, 1=Mon, ..., 6=Sat)
        return {
            'sat_tue_315': { days: [6, 2], text: 'السبت والثلاثاء - 3:15 م' },
            'sat_tue_430': { days: [6, 2], text: 'السبت والثلاثاء - 4:30 م' },
            'sun_wed_200': { days: [0, 3], text: 'الأحد والأربعاء - 2:00 م' },
            'mon_thu_200': { days: [1, 4], text: 'الاثنين والخميس - 2:00 م' },
            'sat_tue_200': { days: [6, 2], text: 'السبت والثلاثاء - 2:00 م' },
            'sun_wed_315': { days: [0, 3], text: 'الأحد والأربعاء - 3:15 م' },
            'mon_thu_315': { days: [1, 4], text: 'الاثنين والخميس - 3:15 م' },
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
        if (result.success || result.isNew) {
            this.storageManager.loadData(result.data);
            this.allStudents = this.storageManager.getAllStudents();
            this.enableUI(result.isNew);
            this.populateGroupFilter();
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
        this.setupEventListeners();
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
        this.saveBtn.addEventListener('click', async () => {
            await this.storageManager.persistData();
        });

        // Modal event listeners
        this.modalSaveBtn.addEventListener('click', () => this.saveModalAttendance());
        this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }

    populateGroupFilter() {
        this.groupFilter.innerHTML = '<option value="all">كل المجموعات</option>';
        const selectedGrade = this.gradeFilter.value;
        const seenGroups = new Set();

        this.allStudents.forEach(student => {
            if ((selectedGrade === 'all' || student.grade === selectedGrade) && !seenGroups.has(student.groupTime)) {
                this.groupFilter.add(new Option(student.groupTimeText, student.groupTime));
                seenGroups.add(student.groupTime);
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
        let headerHTML = '<tr><th class="border p-2 min-w-[200px]">اسم الطالب</th>';
        dates.forEach(date => {
            const day = dayNames[date.getDay()];
            const dateNum = date.getDate();
            headerHTML += `<th class="border p-2 text-center">${day}<br>${dateNum}</th>`;
        });
        headerHTML += '</tr>';
        this.tableHeader.innerHTML = headerHTML;
    }

    renderTableBody(students, dates) {
        if (students.length === 0) {
            this.tableBody.innerHTML = `<tr><td colspan="${dates.length + 1}" class="text-center py-12 text-gray-500">لا يوجد طلاب في هذه المجموعة.</td></tr>`;
            return;
        }

        let bodyHTML = '';
        const statusMap = {
            present: { class: 'bg-green-200 hover:bg-green-300', text: 'ح' }, // حاضر
            absent: { class: 'bg-red-200 hover:bg-red-300', text: 'غ' },     // غائب
            excused: { class: 'bg-yellow-200 hover:bg-yellow-300', text: 'ع' }  // عذر
        };
        const defaultStatus = { class: 'bg-gray-100 hover:bg-gray-200', text: '-' };

        students.forEach(student => {
            bodyHTML += `<tr class="table-row"><td class="border p-2 font-semibold">${student.name}</td>`;
            dates.forEach(date => {
                const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                const statusKey = student.attendance ? student.attendance[dateString] : undefined;
                const status = statusMap[statusKey] || defaultStatus;
                bodyHTML += `<td class="border p-2 text-center cursor-pointer ${status.class}" data-student-id="${student.id}" data-date="${dateString}">${status.text}</td>`;
            });
            bodyHTML += '</tr>';
        });
        this.tableBody.innerHTML = bodyHTML;

        // Add event listeners to the new cells to open modal
        this.tableBody.querySelectorAll('td[data-student-id]').forEach(cell => {
            cell.addEventListener('click', (e) => this.openModal(e));
        });
    }

    openModal(event) {
        const cell = event.target;
        this.activeCell = cell;
        const studentId = cell.dataset.studentId;
        const date = cell.dataset.date;
        const student = this.storageManager.data.students.find(s => s.id == studentId);

        if (!student) return;
        if (!student.attendance) student.attendance = {};

        const currentStatus = student.attendance[date];

        // Set the modal radios based on current status
        this.modalStatusRadios.forEach(radio => {
            radio.checked = (radio.value === currentStatus);
        });

        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.activeCell = null;
    }

    saveModalAttendance() {
        if (!this.activeCell) return;

        const studentId = this.activeCell.dataset.studentId;
        const date = this.activeCell.dataset.date;
        const selectedStatus = Array.from(this.modalStatusRadios).find(r => r.checked)?.value;
        const student = this.storageManager.data.students.find(s => s.id == studentId);

        if (!student) return;
        if (!student.attendance) student.attendance = {};

        if (selectedStatus) {
            student.attendance[date] = selectedStatus;
        } else {
            delete student.attendance[date]; // Reset to default
        }

        this.closeModal();
        this.render();
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

        const filteredStudents = this.allStudents.filter(s => s.grade === selectedGrade && s.groupTime === selectedGroup);
        const groupSchedule = this.groupSchedules[selectedGroup];
        const scheduledDates = this.getScheduledDatesForMonth(groupSchedule);

        this.renderTableHeader(scheduledDates);
        this.renderTableBody(filteredStudents, scheduledDates);
    }
}

document.addEventListener('DOMContentLoaded', () => { new AttendancePage(); });
