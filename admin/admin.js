class AdminPage {
    constructor() {
        this.version = '1.0.0-release';
        
        // Managers from global context
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
        this.modalSaveBtn = document.getElementById('modal-save-btn');

        // Attendance Modal
        this.attendanceModal = document.getElementById('attendance-modal');
        this.attendanceStudentName = document.getElementById('attendance-student-name');
        this.attendanceCalendar = document.getElementById('attendance-calendar');
        this.attendanceModalCloseBtn = document.getElementById('attendance-modal-close-btn');

        // Payments Modal
        this.paymentsModal = document.getElementById('payments-modal');
        this.paymentStudentName = document.getElementById('payment-student-name');
        this.paymentsList = document.getElementById('payments-list');
        this.paymentsModalCloseBtn = document.getElementById('payments-modal-close-btn');

        // State
        this.allStudents = [];
        this.filteredStudents = [];
        this.currentStudentId = null;

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
        this.clearFiltersBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.gradeFilter.value = 'all';
            this.applyFilters();
        });

        // Modal close buttons
        this.modalCancelBtn.addEventListener('click', () => this.editStudentModal.classList.add('hidden'));
        this.attendanceModalCloseBtn.addEventListener('click', () => this.attendanceModal.classList.add('hidden'));
        this.paymentsModalCloseBtn.addEventListener('click', () => this.paymentsModal.classList.add('hidden'));
    }

    applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const grade = this.gradeFilter.value;

        this.filteredStudents = this.allStudents.filter(student => {
            const matchesSearch = searchTerm === '' ||
                student.name.toLowerCase().includes(searchTerm) ||
                student.id.toLowerCase().includes(searchTerm) ||
                student.studentPhone.includes(searchTerm);
            
            const matchesGrade = grade === 'all' || student.grade === grade;
            
            return matchesSearch && matchesGrade;
        });
        
        this.renderTable();
    }

    renderTable() {
        this.tableBody.innerHTML = '';
        if (this.filteredStudents.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-500">لا يوجد طلاب يطابقون البحث.</td></tr>';
            return;
        }

        this.filteredStudents.forEach(student => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="border p-2 font-mono">${student.id}</td>
                <td class="border p-2 font-semibold">${student.name}</td>
                <td class="border p-2">${student.gradeName || student.grade}</td>
                <td class="border p-2 font-mono">${student.studentPhone}</td>
                <td class="border p-2">
                    <div class="flex gap-2 justify-center">
                        <button onclick="adminPage.openEditModal('${student.id}')" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" title="تعديل البيانات"><i class="fas fa-edit"></i></button>
                        <button onclick="adminPage.openAttendanceModal('${student.id}')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600" title="إدارة الحضور"><i class="fas fa-calendar-check"></i></button>
                        <button onclick="adminPage.openPaymentsModal('${student.id}')" class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600" title="إدارة المدفوعات"><i class="fas fa-dollar-sign"></i></button>
                        <button onclick="adminPage.deleteStudent('${student.id}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" title="حذف الطالب"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            this.tableBody.appendChild(row);
        });
    }

    // --- Edit Student Modal Logic ---
    openEditModal(studentId) {
        this.currentStudentId = studentId;
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) return;

        // We can reuse the form fields from the main students page for consistency
        this.editStudentForm.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="form-group">
                    <label class="block text-sm font-medium text-gray-700">اسم الطالب</label>
                    <input type="text" name="name" value="${student.name}" class="w-full mt-1 p-2 border rounded">
                </div>
                <div class="form-group">
                    <label class="block text-sm font-medium text-gray-700">رقم هاتف الطالب</label>
                    <input type="tel" name="studentPhone" value="${student.studentPhone}" class="w-full mt-1 p-2 border rounded">
                </div>
                <div class="form-group">
                    <label class="block text-sm font-medium text-gray-700">رقم ولي الأمر</label>
                    <input type="tel" name="parentPhone" value="${student.parentPhone}" class="w-full mt-1 p-2 border rounded">
                </div>
                 <div class="form-group">
                    <label class="block text-sm font-medium text-gray-700">المبلغ المدفوع (الإجمالي)</label>
                    <input type="number" name="paidAmount" value="${student.paidAmount}" class="w-full mt-1 p-2 border rounded">
                </div>
            </div>
        `;
        
        this.editStudentForm.onsubmit = (e) => this.handleSaveStudent(e);
        this.editStudentModal.classList.remove('hidden');
    }

    async handleSaveStudent(e) {
        e.preventDefault();
        const formData = new FormData(this.editStudentForm);
        const updatedData = {
            name: formData.get('name'),
            studentPhone: formData.get('studentPhone'),
            parentPhone: formData.get('parentPhone'),
            paidAmount: parseFloat(formData.get('paidAmount')),
        };

        const result = await this.storageManager.updateStudent(this.currentStudentId, updatedData);
        if (result.success) {
            alert('تم تحديث بيانات الطالب بنجاح!');
            this.editStudentModal.classList.add('hidden');
            await this.loadInitialData(); // Reload all data
        } else {
            alert('فشل تحديث البيانات: ' + result.message);
        }
    }

    // --- Attendance Modal Logic ---
    openAttendanceModal(studentId) {
        this.currentStudentId = studentId;
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) return;

        this.attendanceStudentName.textContent = student.name;
        this.renderCalendar(student);
        this.attendanceModal.classList.remove('hidden');
    }

    renderCalendar(student) {
        this.attendanceCalendar.innerHTML = '';
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const isPresent = student.attendance && student.attendance[dateString] === 'present';
            
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.className = `p-3 rounded-lg cursor-pointer transition-colors ${isPresent ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`;
            dayEl.onclick = () => this.toggleAttendance(dateString);
            this.attendanceCalendar.appendChild(dayEl);
        }
    }
    
    async toggleAttendance(dateString) {
        const student = this.allStudents.find(s => s.id === this.currentStudentId);
        if (!student) return;

        const currentAttendance = student.attendance || {};
        if (currentAttendance[dateString] === 'present') {
            delete currentAttendance[dateString]; // Mark as absent
        } else {
            currentAttendance[dateString] = 'present'; // Mark as present
        }

        const result = await this.storageManager.updateStudent(this.currentStudentId, { attendance: currentAttendance }, true); // Merge nested
        if (result.success) {
            this.renderCalendar(student); // Re-render calendar
        } else {
            alert('فشل تحديث الحضور.');
        }
    }

    // --- Payments Modal Logic ---
    openPaymentsModal(studentId) {
        this.currentStudentId = studentId;
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) return;

        this.paymentStudentName.textContent = student.name;
        this.renderPayments(student);
        this.paymentsModal.classList.remove('hidden');
    }
    
    renderPayments(student) {
        this.paymentsList.innerHTML = '';
        const currentYear = new Date().getFullYear();

        for (let month = 0; month < 12; month++) {
            const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
            const monthName = new Date(currentYear, month).toLocaleString('ar-EG', { month: 'long' });
            const payment = student.payments ? student.payments[monthKey] : null;
            const requiredAmount = this.storageManager.getRequiredPayment(student.grade, student.section);
            const isPaid = payment && payment.amountPaid >= requiredAmount;

            const paymentEl = document.createElement('div');
            paymentEl.className = 'flex items-center justify-between p-3 rounded-lg';
            paymentEl.innerHTML = `
                <span class="font-semibold text-lg">${monthName}</span>
                <button class="px-6 py-2 rounded text-white font-bold ${isPaid ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}"
                        onclick="adminPage.togglePayment('${monthKey}', ${requiredAmount})">
                    ${isPaid ? 'إلغاء الدفع' : 'تأكيد الدفع'}
                </button>
            `;
            this.paymentsList.appendChild(paymentEl);
        }
    }
    
    async togglePayment(monthKey, requiredAmount) {
        const student = this.allStudents.find(s => s.id === this.currentStudentId);
        if (!student) return;
        
        const currentPayments = student.payments || {};
        let newTotalPaidAmount = student.paidAmount || 0;

        if (currentPayments[monthKey]) {
            // UNPAY: Remove the monthly record and DECREMENT the total
            newTotalPaidAmount -= currentPayments[monthKey].amountPaid;
            delete currentPayments[monthKey];
        } else {
            // PAY: Add the monthly record and INCREMENT the total
            newTotalPaidAmount += requiredAmount;
            currentPayments[monthKey] = {
                amountPaid: requiredAmount,
                requiredAmount: requiredAmount,
                paymentDate: new Date().toISOString()
            };
        }
        
        // Ensure the total doesn't go below zero
        if (newTotalPaidAmount < 0) {
            newTotalPaidAmount = 0;
        }

        const updatePayload = {
            payments: currentPayments,
            paidAmount: newTotalPaidAmount
        };
        
        const result = await this.storageManager.updateStudent(this.currentStudentId, updatePayload, true); // Merge nested
        if (result.success) {
            this.renderPayments(student); // Re-render the list
        } else {
            alert('فشل تحديث حالة الدفع.');
        }
    }


    // --- Delete Logic ---
    async deleteStudent(studentId) {
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) return;

        if (confirm(`هل أنت متأكد تماماً من حذف الطالب "${student.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
            const result = await this.storageManager.deleteStudent(studentId);
            if (result.success) {
                alert('تم حذف الطالب بنجاح.');
                await this.loadInitialData();
            } else {
                alert('فشل حذف الطالب.');
            }
        }
    }
}

// Initialize the page
let adminPage;
document.addEventListener('DOMContentLoaded', () => {
    if (window.appContext) {
        // We make it globally available so the onclick attributes in the HTML can find it.
        adminPage = new AdminPage(); 
    } else {
        console.error("AppContext is not ready!");
    }
});