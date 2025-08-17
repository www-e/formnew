class PaymentsPage {
    constructor() {
        this.version = '1.0.0-initial';
        // UI Elements
        this.mainContent = document.getElementById('main-content');
        this.dbStatusEl = document.getElementById('db-status');
        this.monthDisplay = document.getElementById('current-month-display');
        this.prevMonthBtn = document.getElementById('prev-month-btn');
        this.nextMonthBtn = document.getElementById('next-month-btn');
        this.todayBtn = document.getElementById('today-btn');
        this.gradeFilter = document.getElementById('grade-filter');
        this.groupFilter = document.getElementById('group-filter');
        this.tableBody = document.getElementById('payments-table-body');
        this.quickPaymentBtn = document.getElementById('quick-payment-btn');

        // Modal Elements
        this.modal = document.getElementById('quick-payment-modal');
        this.modalCloseBtn = document.getElementById('modal-close-btn');
        this.modalForm = document.getElementById('quick-payment-form');
        this.modalStudentIdInput = document.getElementById('modal-student-id');
        this.modalMessageEl = document.getElementById('modal-message');

        // State
        this.currentDate = new Date();
        this.allStudents = [];
        this.filteredStudents = [];

        // Managers
        this.fileManager = window.appContext.fileManager;
        this.storageManager = window.appContext.storageManager;

        this.initialize();
    }

    async initialize() {
        console.log(`✅ Payments System v${this.version} initialized.`);
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
        
        // Modal Listeners
        this.quickPaymentBtn.addEventListener('click', () => this.showModal());
        this.modalCloseBtn.addEventListener('click', () => this.hideModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
        this.modalForm.addEventListener('submit', (e) => this.handlePaymentSubmit(e));
    }

    populateGroupFilter() {
        this.groupFilter.innerHTML = '<option value="all">كل المجموعات</option>';
        const selectedGrade = this.gradeFilter.value;
        const seenGroups = new Set();

        this.allStudents.forEach(student => {
            if ((selectedGrade === 'all' || student.grade === selectedGrade) && student.groupTime && !seenGroups.has(student.groupTime)) {
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

    applyFilters() {
        const selectedGrade = this.gradeFilter.value;
        const selectedGroup = this.groupFilter.value;

        this.filteredStudents = this.allStudents.filter(s =>
            (selectedGrade === 'all' || s.grade === selectedGrade) &&
            (selectedGroup === 'all' || s.groupTime === selectedGroup)
        );
    }

    render() {
        this.updateMonthDisplay();
        this.applyFilters();
        this.renderTableBody();
    }

renderTableBody() {
        if (this.filteredStudents.length === 0) {
            this.tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-gray-500">لا يوجد طلاب يطابقون الفلتر الحالي.</td></tr>`;
            return;
        }

        let bodyHTML = '';
        const year = this.currentDate.getFullYear();
        const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${month}`;

        this.filteredStudents.forEach((student, index) => {
            const requiredAmount = this.storageManager.getRequiredPayment(student.grade, student.section);
            
            // Exemption Check
            const isPermanentlyExempt = student.isExempt === true;
            const isMonthExempt = isPermanentlyExempt || (typeof student.isExempt === 'object' && student.isExempt && student.isExempt[monthKey]);

            const payment = student.payments ? student.payments[monthKey] : null;
            let statusBadge = '<span class="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm">لم يدفع</span>';
            let amountPaid = '---';
            let paymentDate = '---';

            if (isMonthExempt) {
                statusBadge = '<span class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">معفى</span>';
            } else if (payment) {
                if (payment.amountPaid >= requiredAmount) {
                    statusBadge = '<span class="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm">مدفوع</span>';
                } else {
                    statusBadge = `<span class="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm">دفع جزئي</span>`;
                }
                amountPaid = `${payment.amountPaid.toLocaleString('ar-EG')} جنيه`;
                paymentDate = new Date(payment.paymentDate).toLocaleDateString('ar-EG', {
                    hour: '2-digit', minute: '2-digit', hour12: true
                });
            }
            
            const sectionDisplay = student.sectionName ? `<span class="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">${student.sectionName}</span>` : '<span class="text-gray-400">-</span>';
            const requiredDisplay = isMonthExempt ? '0 جنيه' : `${requiredAmount.toLocaleString('ar-EG')} جنيه`;

            bodyHTML += `
                <tr class="table-row">
                    <td class="border p-2 text-center font-bold">${index + 1}</td>
                    <td class="border p-2 text-center font-mono text-sm">${student.id}</td>
                    <td class="border p-2 font-semibold">${student.name}</td>
                    <td class="border p-2 text-center"><span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">${student.gradeName}</span></td>
                    <td class="border p-2 text-center">${sectionDisplay}</td>
                    <td class="border p-2 text-center">${statusBadge}</td>
                    <td class="border p-2 text-center font-semibold">${amountPaid}</td>
                    <td class="border p-2 text-center">${requiredDisplay}</td>
                    <td class="border p-2 text-center text-sm">${paymentDate}</td>
                </tr>
            `;
        });
        this.tableBody.innerHTML = bodyHTML;
    }
    
    // Modal Methods
    showModal() {
        this.modalMessageEl.textContent = '';
        this.modalMessageEl.className = 'text-sm text-gray-500 mt-2';
        this.modalStudentIdInput.value = '';
        this.modal.classList.remove('hidden');
        this.modalStudentIdInput.focus();
    }

    hideModal() {
        this.modal.classList.add('hidden');
    }

    showModalMessage(text, isError = false) {
        this.modalMessageEl.textContent = text;
        this.modalMessageEl.className = isError ? 'text-sm text-red-600 mt-2 font-bold' : 'text-sm text-green-600 mt-2 font-bold';
    }

    async handlePaymentSubmit(event) {
        event.preventDefault();
        const studentId = this.modalStudentIdInput.value.trim();
        if (!studentId) {
            this.showModalMessage('يرجى إدخال كود الطالب.', true);
            return;
        }

        const student = this.storageManager.data.students.find(s => s.id === studentId);
        if (!student) {
            this.showModalMessage('هذا الكود غير صحيح أو غير مسجل.', true);
            return;
        }

        const year = this.currentDate.getFullYear();
        const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${month}`;
        
        const requiredAmount = this.storageManager.getRequiredPayment(student.grade, student.section);
        
        if (student.payments && student.payments[monthKey] && student.payments[monthKey].amountPaid >= requiredAmount) {
            this.showModalMessage('تم دفع مستحقات هذا الشهر بالفعل.', false);
            return;
        }

        try {
            this.showModalMessage('جاري الحفظ...', false);
            
            // --- DATA SYNC LOGIC ---
            // 1. Create the monthly payment record
            const paymentUpdate = {
                payments: {
                    [monthKey]: {
                        amountPaid: requiredAmount,
                        requiredAmount: requiredAmount,
                        paymentDate: new Date().toISOString()
                    }
                },
                // 2. Update the lifetime total paidAmount
                paidAmount: (student.paidAmount || 0) + requiredAmount
            };
            
            const result = await this.storageManager.updateStudent(studentId, paymentUpdate, true); // Pass merge flag
            
            if (result.success) {
                console.log(`✅ Payment saved successfully for ${student.name}`);
                this.showModalMessage(`تم تسجيل دفعة لـ: ${student.name}`);
                this.modalStudentIdInput.value = '';
                // 3. Reload student data to get the latest state
                this.allStudents = this.storageManager.getAllStudents(); 
                this.render(); // Refresh the table
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('❌ Failed to save payment:', error);
            this.showModalMessage('فشل في حفظ الدفعة. حاول مرة أخرى.', true);
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    if (window.appContext) {
        new PaymentsPage();
    } else {
        console.error("AppContext is not ready!");
    }
});