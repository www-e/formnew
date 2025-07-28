class FormHandler {
    constructor() {
        this.form = document.getElementById('studentForm');
        this.gradeSelect = document.getElementById('grade');
        this.sectionSelect = document.getElementById('section');
        this.groupSelect = document.getElementById('groupTime');
        this.sectionGroup = document.getElementById('sectionGroup');
        this.editingId = null;
        
        this.initializeEventListeners();
        this.initializeGradeData();
    }

    initializeGradeData() {
        this.gradeData = {
            first: {
                name: 'الصف الأول الثانوي',
                sections: {},
                groups: [
                    { value: 'sat_tue_315', text: 'السبت والثلاثاء - 3:15 م' },
                    { value: 'sat_tue_430', text: 'السبت والثلاثاء - 4:30 م' },
                    { value: 'sun_wed_200', text: 'الأحد والأربعاء - 2:00 م' },
                    { value: 'mon_thu_200', text: 'الاثنين والخميس - 2:00 م' }
                ]
            },
            second: {
                name: 'الصف الثاني الثانوي',
                sections: {
                    science_pure: 'علمي - رياضة بحتة',
                    science_applied: 'علمي - رياضة تطبيقية',
                    arts: 'أدبي'
                },
                groups: [
                    { value: 'sat_tue_200', text: 'السبت والثلاثاء - 2:00 م' },
                    { value: 'sun_wed_315', text: 'الأحد والأربعاء - 3:15 م' },
                    { value: 'mon_thu_315', text: 'الاثنين والخميس - 3:15 م' }
                ]
            },
            third: {
                name: 'الصف الثالث الثانوي',
                sections: {
                    general_science: 'علمي رياضة',
                    statistics_arts: 'إحصاء - أدبي'
                },
                groups: {
                    general_science: [
                        { value: 'sat_tue_thu_1200', text: 'السبت والثلاثاء والخميس - 12:00 م' }
                    ],
                    statistics_arts: [
                        { value: 'sun_wed_430', text: 'الأحد والأربعاء - 4:30 م' }
                    ]
                }
            }
        };
    }

    initializeEventListeners() {
        this.gradeSelect.addEventListener('change', (e) => {
            this.handleGradeChange(e.target.value);
        });

        this.sectionSelect.addEventListener('change', (e) => {
            this.handleSectionChange(e.target.value);
        });

        this.form.addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Phone number validation
        document.getElementById('studentPhone').addEventListener('input', this.validatePhone);
        document.getElementById('parentPhone').addEventListener('input', this.validatePhone);

        // Real-time validation
        document.getElementById('studentName').addEventListener('input', this.validateName);
        document.getElementById('paidAmount').addEventListener('input', this.validateAmount);
    }

    handleGradeChange(grade) {
        this.clearSelects();
        
        if (!grade) {
            this.sectionGroup.style.display = 'none';
            return;
        }

        const gradeData = this.gradeData[grade];
        
        if (grade === 'first') {
            this.sectionGroup.style.display = 'none';
            this.sectionSelect.removeAttribute('required');
            this.populateGroups(gradeData.groups);
        } else {
            this.sectionGroup.style.display = 'block';
            this.sectionSelect.setAttribute('required', 'required');
            this.populateSections(gradeData.sections);
        }
    }

    handleSectionChange(section) {
        this.groupSelect.innerHTML = '<option value="">اختر المجموعة والمعاد</option>';
        
        if (!section) return;

        const grade = this.gradeSelect.value;
        const gradeData = this.gradeData[grade];

        if (grade === 'third') {
            this.populateGroups(gradeData.groups[section] || []);
        } else {
            this.populateGroups(gradeData.groups);
        }
    }

    populateSections(sections) {
        this.sectionSelect.innerHTML = '<option value="">اختر القسم</option>';
        
        Object.entries(sections).forEach(([value, text]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            this.sectionSelect.appendChild(option);
        });
    }

    populateGroups(groups) {
        this.groupSelect.innerHTML = '<option value="">اختر المجموعة والمعاد</option>';
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.value;
            option.textContent = group.text;
            this.groupSelect.appendChild(option);
        });
    }

    clearSelects() {
        this.sectionSelect.innerHTML = '<option value="">اختر القسم</option>';
        this.groupSelect.innerHTML = '<option value="">اختر المجموعة والمعاد</option>';
    }

    validatePhone(e) {
        const phone = e.target.value;
        const phoneRegex = /^01[0125][0-9]{8}$/;
        
        if (phone && !phoneRegex.test(phone)) {
            e.target.setCustomValidity('يرجى إدخال رقم هاتف مصري صحيح (01xxxxxxxxx)');
            e.target.classList.add('border-red-500');
        } else {
            e.target.setCustomValidity('');
            e.target.classList.remove('border-red-500');
        }
    }

    validateName(e) {
        const name = e.target.value.trim();
        if (name.length < 2) {
            e.target.setCustomValidity('يجب أن يكون الاسم أكثر من حرفين');
            e.target.classList.add('border-red-500');
        } else {
            e.target.setCustomValidity('');
            e.target.classList.remove('border-red-500');
        }
    }

    validateAmount(e) {
        const amount = parseFloat(e.target.value);
        if (amount < 0) {
            e.target.setCustomValidity('يجب أن يكون المبلغ أكبر من الصفر');
            e.target.classList.add('border-red-500');
        } else {
            e.target.setCustomValidity('');
            e.target.classList.remove('border-red-500');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const studentData = {
            name: formData.get('studentName').trim(),
            studentPhone: formData.get('studentPhone'),
            parentPhone: formData.get('parentPhone'),
            grade: formData.get('grade'),
            section: formData.get('section') || '',
            groupTime: formData.get('groupTime'),
            paidAmount: parseFloat(formData.get('paidAmount'))
        };

        // Add display names
        studentData.gradeName = this.gradeData[studentData.grade].name;
        if (studentData.section) {
            const gradeData = this.gradeData[studentData.grade];
            studentData.sectionName = gradeData.sections[studentData.section];
        }

        // Add group time text
        const selectedOption = this.groupSelect.options[this.groupSelect.selectedIndex];
        studentData.groupTimeText = selectedOption.text;

        try {
            this.showLoading(true);
            
            let result;
            if (this.editingId) {
                result = await window.storageManager.updateStudent(this.editingId, studentData);
                this.editingId = null;
                this.updateSubmitButton(false);
            } else {
                result = await window.storageManager.saveStudent(studentData);
            }
            
            if (result.success) {
                this.showSuccessMessage(result.message);
                this.resetForm();
                await window.tableManager.loadStudents();
                window.app.updateStatistics();
            } else {
                this.showErrorMessage(result.message);
            }
        } catch (error) {
            this.showErrorMessage('حدث خطأ غير متوقع');
            console.error('Form submission error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    editStudent(student) {
        this.editingId = student.id;
        
        // Fill form with student data
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentPhone').value = student.studentPhone;
        document.getElementById('parentPhone').value = student.parentPhone;
        document.getElementById('grade').value = student.grade;
        document.getElementById('paidAmount').value = student.paidAmount;

        // Trigger grade change to populate sections/groups
        this.handleGradeChange(student.grade);
        
        // Set section if exists
        setTimeout(() => {
            if (student.section) {
                document.getElementById('section').value = student.section;
                this.handleSectionChange(student.section);
            }
            
            // Set group time
            setTimeout(() => {
                document.getElementById('groupTime').value = student.groupTime;
            }, 100);
        }, 100);

        this.updateSubmitButton(true);
        
        // Scroll to form
        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateSubmitButton(isEditing) {
        const submitBtn = document.getElementById('submitBtn');
        if (isEditing) {
            submitBtn.innerHTML = '<i class="fas fa-edit ml-2"></i>تحديث بيانات الطالب';
            submitBtn.className = submitBtn.className.replace('from-blue-600 to-purple-600', 'from-orange-600 to-red-600');
        } else {
            submitBtn.innerHTML = '<i class="fas fa-save ml-2"></i>تسجيل الطالب';
            submitBtn.className = submitBtn.className.replace('from-orange-600 to-red-600', 'from-blue-600 to-purple-600');
        }
    }

    resetForm() {
        this.form.reset();
        this.clearSelects();
        this.sectionGroup.style.display = 'none';
        this.sectionSelect.removeAttribute('required');
        this.editingId = null;
        this.updateSubmitButton(false);
        
        // Remove validation classes
        this.form.querySelectorAll('.border-red-500').forEach(el => {
            el.classList.remove('border-red-500');
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
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
