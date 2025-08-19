class AttendancePage {
    constructor() {
        this.version = '6.0.0-final';
        
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
        this.quickAttendanceBtn = document.getElementById('quick-attendance-btn');
        this.makeupAttendanceBtn = document.getElementById('makeup-attendance-btn');
        this.serviceStatusIndicator = document.getElementById('service-status');

        // State
        this.currentDate = new Date();
        this.allStudents = [];
        this.groupSchedules = this.getGroupSchedules();

        // Managers & Components
        this.fileManager = window.appContext.fileManager;
        this.storageManager = window.appContext.storageManager;
        this.quickAttendanceModal = null;
        this.makeupModal = null;
        this.attendanceTracker = null;

        this.initialize();
    }

    getGroupSchedules() {
        return {
            'sat_tue_315': { days: [6, 2], text: 'السبت والثلاثاء - 3:15 م', time: '15:15' },
            'sat_tue_430': { days: [6, 2], text: 'السبت والثلاثاء - 4:30 م', time: '16:30' },
            'sun_wed_200': { days: [0, 3], text: 'الأحد والأربعاء - 2:00 م', time: '14:00' },
            'mon_thu_200': { days: [1, 4], text: 'الاثنين والخميس - 2:00 م', time: '14:00' },
            'sat_tue_200': { days: [6, 2], text: 'السبت والثلاثاء - 2:00 م', time: '14:00' },
            'sun_wed_315': { days: [0, 3], text: 'الأحد والأربعاء - 3:15 م', time: '15:15' },
            'mon_thu_315': { days: [1, 4], text: 'الاثنين والخميس - 3:15 م', time: '15:15' },
            'sat_tue_thu_1200': { days: [6, 2, 4], text: 'السبت والثلاثاء والخميس - 12:00 م', time: '12:00' },
            'sun_wed_430': { days: [0, 3], text: 'الأحد والأربعاء - 4:30 م', time: '16:30' }
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

        this.quickAttendanceModal = new QuickAttendance(this.storageManager, () => this.render());
        this.makeupModal = new MakeupModal(this.storageManager, this.groupSchedules, () => this.render());
        this.attendanceTracker = new AttendanceTracker(this.storageManager, this.groupSchedules, () => {
            this.allStudents = this.storageManager.getAllStudents();
            this.render();
            this.updateServiceStatus(true, 'تم تحديث حالات الغياب.');
        });
        
        window.attendancePage = this;

        this.setupEventListeners();
        this.populateGroupFilter();
        this.render();
        this.startAutoAbsenceService();
        this.autoSelectCurrentGroup(); // UX Improvement
    }

    setupEventListeners() {
        this.prevMonthBtn.addEventListener('click', () => this.goToPreviousMonth());
        this.nextMonthBtn.addEventListener('click', () => this.goToNextMonth());
        this.todayBtn.addEventListener('click', () => this.goToToday());
        this.gradeFilter.addEventListener('change', () => { this.populateGroupFilter(); this.render(); });
        this.groupFilter.addEventListener('change', () => this.render());
        this.quickAttendanceBtn.addEventListener('click', () => this.quickAttendanceModal.show());
        this.makeupAttendanceBtn.addEventListener('click', () => this.makeupModal.show());
    }

    startAutoAbsenceService() {
        this.attendanceTracker.start();
        this.updateServiceStatus(true, 'الخدمة نشطة وتراقب الغياب.');
    }

    updateServiceStatus(isActive, message) {
        if (isActive) {
            this.serviceStatusIndicator.classList.add('service-active');
            this.serviceStatusIndicator.querySelector('div').style.backgroundColor = '#10B981'; // Green
            this.serviceStatusIndicator.querySelector('span').textContent = message || 'الخدمة نشطة';
        } else {
            this.serviceStatusIndicator.classList.remove('service-active');
            this.serviceStatusIndicator.querySelector('div').style.backgroundColor = '#9CA3AF'; // Gray
            this.serviceStatusIndicator.querySelector('span').textContent = message || 'الخدمة متوقفة';
        }
    }
    
    autoSelectCurrentGroup() {
        const now = new Date();
        const currentTime = now.getHours() + (now.getMinutes() / 60);

        let closestGroup = null;
        let smallestDiff = Infinity;

        // Find the group whose start time is closest to now
        for (const [key, schedule] of Object.entries(this.groupSchedules)) {
            if (schedule.days.includes(now.getDay())) {
                const [hours, minutes] = schedule.time.split(':');
                const classTime = parseInt(hours, 10) + (parseInt(minutes, 10) / 60);
                const diff = Math.abs(currentTime - classTime);

                if (diff < smallestDiff) {
                    smallestDiff = diff;
                    closestGroup = key;
                }
            }
        }

        if (closestGroup) {
            // Find a student in that group to determine the grade
            const studentInGroup = this.allStudents.find(s => s.groupTime === closestGroup);
            if (studentInGroup) {
                this.gradeFilter.value = studentInGroup.grade;
                this.populateGroupFilter(); // Repopulate groups for the selected grade
                this.groupFilter.value = closestGroup;
                this.render(); // Render the auto-selected table
            }
        }
    }

    renderTableBody(students, dates) {
        if (students.length === 0) {
            this.tableBody.innerHTML = `<tr><td colspan="${dates.length + 3}" class="text-center py-12 text-gray-500">لا يوجد طلاب في هذه المجموعة.</td></tr>`;
            return;
        }

        let bodyHTML = '';
        const statusMap = {
            'H': { class: 'bg-green-500 text-white font-bold', text: 'ح' },
            'T': { class: 'bg-yellow-500 text-white font-bold', text: 'ت' },
            'G': { class: 'bg-red-500 text-white font-bold', text: 'غ' },
        };
        const defaultStatus = { class: 'bg-gray-100', text: '-' };

        students.forEach((student, index) => {
            bodyHTML += `<tr class="table-row">
                <td class="border p-2 text-center font-bold">${index + 1}</td>
                <td class="border p-2 text-center font-mono text-sm">${student.id}</td>
                <td class="border p-2 font-semibold">${student.name}</td>`;

            dates.forEach(date => {
                const dateString = TimeUtils.toYYYYMMDD(date);
                const record = student.attendance ? student.attendance[dateString] : null;
                
                let cellContent = defaultStatus.text;
                let cellClass = defaultStatus.class;

                if (record) {
                    const statusInfo = statusMap[record.status] || defaultStatus;
                    cellClass = statusInfo.class;
                    cellContent = statusInfo.text;

                    if (record.status === 'H' || record.status === 'T') {
                        const schedule = this.groupSchedules[student.groupTime];
                        if (schedule && schedule.time && record.timestamp) {
                            const classTime = TimeUtils.parseTime(schedule.time);
                            // Adjust class date to match the record's date for accurate comparison
                            const recordDate = new Date(record.timestamp);
                            classTime.setFullYear(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());

                            const arrivalTime = new Date(record.timestamp);
                            const lateness = TimeUtils.getMinutesDifference(classTime, arrivalTime);
                            
                            if (lateness > 5) { // Add a 5 min grace period
                                cellContent += ` <span class="text-xs text-red-700 font-bold">(${lateness})</span>`;
                            }
                        }
                    }
                }
                bodyHTML += `<td class="border p-2 text-center ${cellClass}">${cellContent}</td>`;
            });
            bodyHTML += '</tr>';
        });
        this.tableBody.innerHTML = bodyHTML;
    }
    
    // --- Unchanged methods ---
    populateGroupFilter() {
        this.groupFilter.innerHTML = '<option value="all">كل المجموعات</option>';
        const selectedGrade = this.gradeFilter.value;
        if (selectedGrade === 'all') {
            return;
        }

        const groups = this.allStudents
            .filter(student => student.grade === selectedGrade)
            .map(student => ({ value: student.groupTime, text: student.groupTimeText }))
            .filter((group, index, self) => self.findIndex(g => g.value === group.value) === index);

        groups.forEach(group => {
            if (this.groupSchedules[group.value]) {
                this.groupFilter.add(new Option(group.text, group.value));
            }
        });

        if (groups.length === 1) {
            this.groupFilter.value = groups[0].value;
        }
    }
    goToPreviousMonth() { this.currentDate.setMonth(this.currentDate.getMonth() - 1); this.render(); }
    goToNextMonth() { this.currentDate.setMonth(this.currentDate.getMonth() + 1); this.render(); }
    goToToday() { this.currentDate = new Date(); this.render(); }
    updateMonthDisplay() { this.monthDisplay.textContent = this.currentDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' }); }
    getScheduledDatesForMonth(groupSchedule) { if (!groupSchedule || !groupSchedule.days) return []; const year = this.currentDate.getFullYear(); const month = this.currentDate.getMonth(); const dates = []; const daysInMonth = new Date(year, month + 1, 0).getDate(); for (let day = 1; day <= daysInMonth; day++) { const date = new Date(year, month, day); if (groupSchedule.days.includes(date.getDay())) dates.push(date); } return dates; }
    renderTableHeader(dates) { const dayNames = ['احد', 'اثنين', 'ثلاثاء', 'اربعاء', 'خميس', 'جمعة', 'سبت']; let headerHTML = `<tr><th class="border p-2 text-center" style="width: 40px;">#</th><th class="border p-2 text-center" style="width: 120px;">كود الطالب</th><th class="border p-2 min-w-[200px]">اسم الطالب</th>`; dates.forEach(date => { headerHTML += `<th class="border p-2 text-center" style="width: 80px;">${dayNames[date.getDay()]}<br>${date.getDate()}</th>`; }); headerHTML += '</tr>'; this.tableHeader.innerHTML = headerHTML; }
    render() { this.updateMonthDisplay(); const selectedGrade = this.gradeFilter.value; const selectedGroup = this.groupFilter.value; if (selectedGrade === 'all' || selectedGroup === 'all') { this.tableHeader.innerHTML = ''; this.tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-12 text-gray-500"><i class="fas fa-filter text-4xl mb-3"></i><p>اختر صفاً ومجموعة لعرض كشف الحضور</p></td></tr>'; return; } const filteredStudents = this.allStudents.filter(s => s.grade === selectedGrade && s.groupTime === selectedGroup); const groupSchedule = this.groupSchedules[selectedGroup]; const scheduledDates = this.getScheduledDatesForMonth(groupSchedule); this.renderTableHeader(scheduledDates); this.renderTableBody(filteredStudents, scheduledDates); }
}

