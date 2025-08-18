class AdminPage {
    constructor() {
        this.version = '1.2.1-hotfix'; // Version updated to reflect correction
        
        this.storageManager = window.appContext.storageManager;
        this.fileManager = window.appContext.fileManager;

        // UI Elements
        this.mainContent = document.getElementById('main-content');
        this.dbStatusEl = document.getElementById('db-status');
        this.tableBody = document.getElementById('admin-table-body');
        
        // Filters
        this.searchInput = document.getElementById('searchInput');
        this.gradeFilter = document.getElementById('filterGrade');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        
        // Edit Student Modal
        this.editStudentModal = document.getElementById('edit-student-modal');
        this.editStudentForm = document.getElementById('edit-student-form');
        this.modalCancelBtn = document.getElementById('modal-cancel-btn');
        
        // Attendance Modal
        this.attendanceModal = document.getElementById('attendance-modal');
        this.attendanceStudentName = document.getElementById('attendance-student-name');
        this.attendanceCalendar = document.getElementById('attendance-calendar');
        this.attendanceModalCloseBtn = document.getElementById('attendance-modal-close-btn');
        this.attendanceMonthDisplay = document.getElementById('attendance-month-display');
        this.attendancePrevMonthBtn = document.getElementById('attendance-prev-month-btn');
        this.attendanceNextMonthBtn = document.getElementById('attendance-next-month-btn');

        // Payments Modal
        this.paymentsModal = document.getElementById('payments-modal');
        this.paymentStudentName = document.getElementById('payment-student-name');
        this.paymentsList = document.getElementById('payments-list');
        this.paymentsModalCloseBtn = document.getElementById('payments-modal-close-btn');
        this.paymentYearDisplay = document.getElementById('payment-year-display');
        this.paymentPrevYearBtn = document.getElementById('payment-prev-year-btn');
        this.paymentNextYearBtn = document.getElementById('payment-next-year-btn');
        this.permanentExemptionToggle = document.getElementById('permanent-exemption-toggle');

        // State
        this.allStudents = [];
        this.filteredStudents = [];
        this.currentStudentId = null;
        this.currentAttendanceDate = new Date();
        this.currentPaymentYear = new Date().getFullYear();

        // Make notification methods available
        window.app = {
            showSuccessMessage: (msg) => this.showNotification(msg, 'success'),
            showErrorMessage: (msg) => this.showNotification(msg, 'error')
        };

        this.initialize();
    }

    async initialize() {
        console.log(`✅ Admin Panel v${this.version} initialized.`);
        await this.loadInitialData();
    }

    async loadInitialData() {
        const result = await this.fileManager.loadFile();
        if (result.success) {
            this.storageManager.loadData(result.data);
            this.allStudents = this.storageManager.getAllStudents();
            this.filteredStudents = [...this.allStudents];
            this.enableUI();
        } else {
            this.dbStatusEl.innerHTML = '<i class="fas fa-times-circle text-red-500 ml-2"></i><span class="text-red-500">فشل التحميل</span>';
        }
    }

    enableUI() {
        this.dbStatusEl.innerHTML = '<i class="fas fa-check-circle text-green-500 ml-2"></i><span class="text-green-600">محمل</span>';
        this.mainContent.classList.remove('opacity-25', 'pointer-events-none');
        this.setupEventListeners();
        this.renderTable();
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', () => this.applyFilters());
        this.gradeFilter.addEventListener('change', () => this.applyFilters());
        this.clearFiltersBtn.addEventListener('click', () => { this.searchInput.value = ''; this.gradeFilter.value = 'all'; this.applyFilters(); });
        this.modalCancelBtn.addEventListener('click', () => this.editStudentModal.classList.add('hidden'));
        this.attendanceModalCloseBtn.addEventListener('click', () => this.attendanceModal.classList.add('hidden'));
        this.paymentsModalCloseBtn.addEventListener('click', () => this.paymentsModal.classList.add('hidden'));
        this.attendancePrevMonthBtn.addEventListener('click', () => { this.currentAttendanceDate.setMonth(this.currentAttendanceDate.getMonth() - 1); this.renderCalendar(); });
        this.attendanceNextMonthBtn.addEventListener('click', () => { this.currentAttendanceDate.setMonth(this.currentAttendanceDate.getMonth() + 1); this.renderCalendar(); });
        this.paymentPrevYearBtn.addEventListener('click', () => { this.currentPaymentYear--; this.renderPayments(); });
        this.paymentNextYearBtn.addEventListener('click', () => { this.currentPaymentYear++; this.renderPayments(); });
        this.permanentExemptionToggle.addEventListener('change', () => this.toggleExemption(null));
    }

    applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const grade = this.gradeFilter.value;
        this.filteredStudents = this.allStudents.filter(student => (searchTerm === '' || student.name.toLowerCase().includes(searchTerm) || student.id.toLowerCase().includes(searchTerm) || student.studentPhone.includes(searchTerm)) && (grade === 'all' || student.grade === grade));
        this.renderTable();
    }

    renderTable() {
        this.tableBody.innerHTML = '';
        if (this.filteredStudents.length === 0) { this.tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-500">لا يوجد طلاب يطابقون البحث.</td></tr>'; return; }
        this.filteredStudents.forEach(student => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `<td class="border p-2 font-mono">${student.id}</td><td class="border p-2 font-semibold">${student.name}</td><td class="border p-2">${student.gradeName || student.grade}</td><td class="border p-2 font-mono">${student.studentPhone}</td><td class="border p-2"><div class="flex gap-2 justify-center"><button onclick="adminPage.openEditModal('${student.id}')" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" title="تعديل البيانات"><i class="fas fa-edit"></i></button><button onclick="adminPage.openAttendanceModal('${student.id}')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600" title="إدارة الحضور"><i class="fas fa-calendar-check"></i></button><button onclick="adminPage.openPaymentsModal('${student.id}')" class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600" title="إدارة المدفوعات"><i class="fas fa-dollar-sign"></i></button><button onclick="adminPage.deleteStudent('${student.id}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" title="حذف الطالب"><i class="fas fa-trash"></i></button></div></td>`;
            this.tableBody.appendChild(row);
        });
    }

    openEditModal(studentId) {
        this.currentStudentId = studentId;
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) return;
        this.editStudentForm.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div class="form-group"><label class="block text-sm font-medium text-gray-700">اسم الطالب</label><input type="text" name="name" value="${student.name}" class="w-full mt-1 p-2 border rounded"></div><div class="form-group"><label class="block text-sm font-medium text-gray-700">رقم هاتف الطالب</label><input type="tel" name="studentPhone" value="${student.studentPhone}" class="w-full mt-1 p-2 border rounded"></div><div class="form-group"><label class="block text-sm font-medium text-gray-700">رقم ولي الأمر</label><input type="tel" name="parentPhone" value="${student.parentPhone}" class="w-full mt-1 p-2 border rounded"></div><div class="form-group"><label class="block text-sm font-medium text-gray-700">المبلغ المدفوع (الإجمالي)</label><input type="number" name="paidAmount" value="${student.paidAmount}" class="w-full mt-1 p-2 border rounded"></div></div>`;
        this.editStudentForm.onsubmit = (e) => this.handleSaveStudent(e);
        this.editStudentModal.classList.remove('hidden');
    }

    async handleSaveStudent(e) {
        e.preventDefault();
        const formData = new FormData(this.editStudentForm);
        const updatedData = { name: formData.get('name'), studentPhone: formData.get('studentPhone'), parentPhone: formData.get('parentPhone'), paidAmount: parseFloat(formData.get('paidAmount')), };
        const result = await this.storageManager.updateStudent(this.currentStudentId, updatedData);
        if (result.success) { window.app.showSuccessMessage('تم تحديث بيانات الطالب بنجاح!'); this.editStudentModal.classList.add('hidden'); await this.loadInitialData(); } else { window.app.showErrorMessage('فشل تحديث البيانات: ' + result.message); }
    }

    openAttendanceModal(studentId) {
        this.currentStudentId = studentId;
        this.currentAttendanceDate = new Date();
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) return;
        this.attendanceStudentName.textContent = student.name;
        this.renderCalendar();
        this.attendanceModal.classList.remove('hidden');
    }

    renderCalendar() {
        const student = this.allStudents.find(s => s.id === this.currentStudentId);
        if (!student) return;
        this.attendanceCalendar.innerHTML = '';
        this.attendanceMonthDisplay.textContent = this.currentAttendanceDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
        const year = this.currentAttendanceDate.getFullYear();
        const month = this.currentAttendanceDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = student.attendance ? student.attendance[dateString] : null;
            let className = 'bg-gray-200 hover:bg-gray-300';
            if (record) {
                if (record.status === 'H') className = 'bg-green-500 text-white';
                if (record.status === 'T') className = 'bg-yellow-400 text-white';
                if (record.status === 'G') className = 'bg-red-500 text-white';
            }
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.className = `p-3 rounded-lg cursor-pointer transition-colors ${className}`;
            dayEl.onclick = () => this.toggleAttendance(dateString);
            this.attendanceCalendar.appendChild(dayEl);
        }
    }
    
    async toggleAttendance(dateString) {
        const student = this.allStudents.find(s => s.id === this.currentStudentId);
        if (!student) return;
        const currentAttendance = student.attendance || {};
        if (currentAttendance[dateString]) {
            delete currentAttendance[dateString];
        } else {
            currentAttendance[dateString] = { status: 'H', timestamp: new Date().toISOString() };
        }
        const result = await this.storageManager.updateStudent(this.currentStudentId, { attendance: currentAttendance }, true);
        if (result.success) { this.renderCalendar(); } else { window.app.showErrorMessage('فشل تحديث الحضور.'); }
    }

    openPaymentsModal(studentId) {
        this.currentStudentId = studentId;
        this.currentPaymentYear = new Date().getFullYear();
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) return;
        this.paymentStudentName.textContent = student.name;
        this.renderPayments();
        this.paymentsModal.classList.remove('hidden');
    }

    renderPayments() {
        const student = this.allStudents.find(s => s.id === this.currentStudentId);
        if (!student) return;
        this.paymentsList.innerHTML = '';
        this.paymentYearDisplay.textContent = this.currentPaymentYear;
        const isPermanentlyExempt = student.isExempt === true;
        this.permanentExemptionToggle.checked = isPermanentlyExempt;
        for (let month = 0; month < 12; month++) {
            const monthKey = `${this.currentPaymentYear}-${String(month + 1).padStart(2, '0')}`;
            const monthName = new Date(this.currentPaymentYear, month).toLocaleString('ar-EG', { month: 'long' });
            const isMonthExempt = isPermanentlyExempt || (typeof student.isExempt === 'object' && student.isExempt && student.isExempt[monthKey]);
            const payment = student.payments ? student.payments[monthKey] : null;
            const requiredAmount = this.storageManager.getRequiredPayment(student.grade, student.section);
            const isPaid = payment && payment.amountPaid >= requiredAmount;
            const paymentEl = document.createElement('div');
            paymentEl.className = 'flex items-center justify-between p-3 rounded-lg border';
            let statusButton;
            if (isMonthExempt) { statusButton = `<button class="px-6 py-2 rounded text-white font-bold bg-gray-500 hover:bg-gray-600" onclick="adminPage.toggleExemption('${monthKey}')">إلغاء الإعفاء</button>`; } else if (isPaid) { statusButton = `<button class="px-6 py-2 rounded text-white font-bold bg-red-500 hover:bg-red-600" onclick="adminPage.togglePayment('${monthKey}', ${requiredAmount})">إلغاء الدفع</button>`; } else { statusButton = `<button class="px-4 py-2 rounded text-white font-bold bg-green-500 hover:bg-green-600" onclick="adminPage.togglePayment('${monthKey}', ${requiredAmount})">تأكيد الدفع</button><button class="px-4 py-2 rounded text-gray-800 font-bold bg-yellow-400 hover:bg-yellow-500" onclick="adminPage.toggleExemption('${monthKey}')">إعفاء</button>`; }
            if(isPermanentlyExempt && !isMonthExempt) { statusButton = `<span class="text-sm text-gray-500">تم تفعيل الإعفاء الدائم</span>`; }
            paymentEl.innerHTML = `<span class="font-semibold text-lg w-1/3">${monthName}</span><div class="flex gap-2 justify-end w-2/3">${statusButton}</div>`;
            this.paymentsList.appendChild(paymentEl);
        }
    }

    async togglePayment(monthKey, requiredAmount) {
        const student = this.allStudents.find(s => s.id === this.currentStudentId);
        if (!student) return;
        const currentPayments = student.payments || {};
        let newTotalPaidAmount = student.paidAmount || 0;
        if (currentPayments[monthKey]) { newTotalPaidAmount -= currentPayments[monthKey].amountPaid; delete currentPayments[monthKey]; } else { newTotalPaidAmount += requiredAmount; currentPayments[monthKey] = { amountPaid: requiredAmount, requiredAmount: requiredAmount, paymentDate: new Date().toISOString() }; }
        if (newTotalPaidAmount < 0) newTotalPaidAmount = 0;
        const result = await this.storageManager.updateStudent(this.currentStudentId, { payments: currentPayments, paidAmount: newTotalPaidAmount }, true);
        if (result.success) { this.renderPayments(); } else { window.app.showErrorMessage('فشل تحديث حالة الدفع.'); }
    }

    async toggleExemption(monthKey = null) {
        const student = this.allStudents.find(s => s.id === this.currentStudentId);
        if (!student) return;
        let currentExemptions = student.isExempt;
        if (monthKey === null) {
            currentExemptions = this.permanentExemptionToggle.checked;
        } else {
            if (typeof currentExemptions !== 'object' || currentExemptions === null) currentExemptions = {};
            if (currentExemptions[monthKey]) delete currentExemptions[monthKey];
            else currentExemptions[monthKey] = true;
        }
        const result = await this.storageManager.updateStudent(this.currentStudentId, { isExempt: currentExemptions });
        if (result.success) { this.renderPayments(); } else { window.app.showErrorMessage('فشل تحديث حالة الإعفاء.'); }
    }

    async deleteStudent(studentId) {
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) return;
        if (window.confirm(`هل أنت متأكد تماماً من حذف الطالب "${student.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
            const result = await this.storageManager.deleteStudent(studentId);
            if (result.success) { window.app.showSuccessMessage('تم حذف الطالب بنجاح.'); await this.loadInitialData(); } else { window.app.showErrorMessage('فشل حذف الطالب.'); }
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        notification.className = `notification fixed top-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center`;
        notification.innerHTML = `<i class="fas ${icon} ml-3"></i><p>${message}</p>`;
        document.body.appendChild(notification);
        setTimeout(() => { notification.remove(); }, 4000);
    }
}

let adminPage;
document.addEventListener('DOMContentLoaded', () => {
    if (window.appContext) {
        adminPage = new AdminPage();
    } else {
        console.error("AppContext is not ready!");
    }
});