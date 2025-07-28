class TableManager {
    constructor() {
        this.tableBody = document.getElementById('studentsTableBody');
        this.students = [];
        this.filteredStudents = [];
        this.currentFilters = {
            search: '',
            grade: '',
            sort: 'newest'
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterGrade').addEventListener('change', (e) => {
            this.currentFilters.grade = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.applyFilters();
        });
    }

    async loadStudents() {
        try {
            this.students = window.storageManager.getAllStudents();
            this.applyFilters();
        } catch (error) {
            console.error('Error loading students:', error);
            this.showErrorMessage('حدث خطأ أثناء تحميل البيانات');
        }
    }

    applyFilters() {
        let filtered = [...this.students];

        // Apply search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(student => 
                student.name.toLowerCase().includes(searchTerm) ||
                student.studentPhone.includes(searchTerm) ||
                student.parentPhone.includes(searchTerm)
            );
        }

        // Apply grade filter
        if (this.currentFilters.grade) {
            filtered = filtered.filter(student => student.grade === this.currentFilters.grade);
        }

        // Apply sorting
        switch (this.currentFilters.sort) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
                break;
            case 'amount_high':
                filtered.sort((a, b) => b.paidAmount - a.paidAmount);
                break;
            case 'amount_low':
                filtered.sort((a, b) => a.paidAmount - b.paidAmount);
                break;
        }

        this.filteredStudents = filtered;
        this.renderTable();
    }

    renderTable() {
        this.tableBody.innerHTML = '';

        if (this.filteredStudents.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-8 text-gray-500">
                        <i class="fas fa-search text-4xl mb-2"></i>
                        <p>لا توجد نتائج للبحث الحالي</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredStudents.forEach((student, index) => {
            const row = document.createElement('tr');
            row.className = 'table-row border-b border-gray-200';
            
            row.innerHTML = `
                <td class="border border-gray-300 px-4 py-3">
                    <div class="font-semibold">${student.name}</div>
                </td>
                <td class="border border-gray-300 px-4 py-3">
                    <div class="font-mono">${student.studentPhone}</div>
                </td>
                <td class="border border-gray-300 px-4 py-3">
                    <div class="font-mono">${student.parentPhone}</div>
                </td>
                <td class="border border-gray-300 px-4 py-3">
                    <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        ${student.gradeName}
                    </span>
                </td>
                <td class="border border-gray-300 px-4 py-3">
                    ${student.sectionName ? 
                        `<span class="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">${student.sectionName}</span>` : 
                        '<span class="text-gray-400">-</span>'
                    }
                </td>
                <td class="border border-gray-300 px-4 py-3">
                    <div class="text-sm">${student.groupTimeText}</div>
                </td>
                <td class="border border-gray-300 px-4 py-3">
                    <div class="font-semibold text-green-600">${student.paidAmount} جنيه</div>
                </td>
                <td class="border border-gray-300 px-4 py-3">
                    <div class="text-sm text-gray-600">${this.formatDate(student.createdAt)}</div>
                    ${student.updatedAt !== student.createdAt ? 
                        `<div class="text-xs text-gray-400">محدث: ${this.formatDate(student.updatedAt)}</div>` : ''
                    }
                </td>
                <td class="border border-gray-300 px-4 py-3">
                    <div class="flex gap-2">
                        <button onclick="tableManager.editStudent(${student.id})" 
                                class="btn-edit bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="tableManager.deleteStudent(${student.id})" 
                                class="btn-delete bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            this.tableBody.appendChild(row);
        });
    }

    editStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            window.formHandler.editStudent(student);
        }
    }

    async deleteStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        
        if (!student) {
            this.showErrorMessage('الطالب غير موجود');
            return;
        }

        const confirmMessage = `هل أنت متأكد من حذف الطالب "${student.name}"؟\nهذا الإجراء لا يمكن التراجع عنه.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const result = await window.storageManager.deleteStudent(studentId);
            
            if (result.success) {
                this.showSuccessMessage(result.message);
                await this.loadStudents();
                window.app.updateStatistics();
            } else {
                this.showErrorMessage(result.message);
            }
        } catch (error) {
            this.showErrorMessage('حدث خطأ أثناء حذف الطالب');
            console.error('Delete error:', error);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        notification.className = `notification fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
        notification.innerHTML = `<i class="fas ${icon} ml-2"></i>${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Global functions for clearing filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterGrade').value = '';
    document.getElementById('sortBy').value = 'newest';
    
    window.tableManager.currentFilters = {
        search: '',
        grade: '',
        sort: 'newest'
    };
    
    window.tableManager.applyFilters();
}
