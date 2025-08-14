class FormHandler {
    constructor() {
        this.form = document.getElementById('studentForm');
        this.gradeSelect = document.getElementById('grade');
        this.sectionSelect = document.getElementById('section');
        this.studentIdInput = document.getElementById('studentId');
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
        this.gradeSelect.addEventListener('change', (e) => this.handleGradeChange(e.target.value));
        this.sectionSelect.addEventListener('change', (e) => this.handleSectionChange(e.target.value));
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        document.getElementById('studentPhone').addEventListener('input', this.validatePhone);
        document.getElementById('parentPhone').addEventListener('input', this.validatePhone);
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
            const option = new Option(text, value);
            this.sectionSelect.appendChild(option);
        });
    }

    populateGroups(groups) {
        this.groupSelect.innerHTML = '<option value="">اختر المجموعة والمعاد</option>';
        groups.forEach(group => {
            const option = new Option(group.text, group.value);
            this.groupSelect.appendChild(option);
        });
    }

    clearSelects() {
        this.sectionSelect.innerHTML = '<option value="">اختر القسم</option>';
        this.groupSelect.innerHTML = '<option value="">اختر المجموعة والمعاد</option>';
    }

    validatePhone(e) {
        const phoneRegex = /^01[0125][0-9]{8}$/;
        if (e.target.value && !phoneRegex.test(e.target.value)) {
            e.target.setCustomValidity('يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 01).');
            e.target.classList.add('border-red-500');
        } else {
            e.target.setCustomValidity('');
            e.target.classList.remove('border-red-500');
        }
    }

    validateName(e) {
        if (e.target.value.trim().length < 2) {
            e.target.setCustomValidity('يجب أن يكون الاسم أكثر من حرفين.');
            e.target.classList.add('border-red-500');
        } else {
            e.target.setCustomValidity('');
            e.target.classList.remove('border-red-500');
        }
    }
    
    validateAmount(e) {
        if (parseFloat(e.target.value) < 0) {
            e.target.setCustomValidity('المبلغ لا يمكن أن يكون سالباً.');
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

        studentData.gradeName = this.gradeData[studentData.grade].name;
        if (studentData.section) {
            studentData.sectionName = this.gradeData[studentData.grade].sections[studentData.section];
        }
        const selectedOption = this.groupSelect.options[this.groupSelect.selectedIndex];
        studentData.groupTimeText = selectedOption.text;

        try {
            this.showLoading(true);
            let result;
            if (this.editingId) {
                result = await window.storageManager.updateStudent(this.editingId, studentData);
            } else {
                result = await window.storageManager.saveStudent(studentData);
            }
            
            if (result.success) {
                window.app.showSuccessMessage(result.message);
                this.resetForm();
                window.tableManager.loadStudents();
                window.app.updateStatistics();
            } else {
                window.app.showErrorMessage(result.message);
            }
        } catch (error) {
            window.app.showErrorMessage('حدث خطأ غير متوقع أثناء الحفظ.');
            console.error('Form submission error:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    editStudentById(studentId) {
        const student = window.storageManager.getAllStudents().find(s => s.id === studentId);
        if (student) {
            this.editStudent(student);
        }
    }

    editStudent(student) {
        this.editingId = student.id;
        
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentPhone').value = student.studentPhone;
        document.getElementById('parentPhone').value = student.parentPhone;
        document.getElementById('grade').value = student.grade;
        document.getElementById('paidAmount').value = student.paidAmount;

        this.handleGradeChange(student.grade);
        
        // Use setTimeout to ensure the DOM has updated with the new options
        setTimeout(() => {
            if (student.section) {
                document.getElementById('section').value = student.section;
                this.handleSectionChange(student.section);
            }
            // Another timeout for the group time
            setTimeout(() => {
                document.getElementById('groupTime').value = student.groupTime;
            }, 50);
        }, 50);

        this.updateSubmitButton(true);
        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateSubmitButton(isEditing) {
        const submitBtn = document.getElementById('submitBtn');
        if (isEditing) {
            submitBtn.innerHTML = '<i class="fas fa-edit ml-2"></i>تحديث بيانات الطالب';
            submitBtn.className = submitBtn.className.replace('from-blue-600 to-purple-600', 'from-orange-500 to-red-500');
        } else {
            submitBtn.innerHTML = '<i class="fas fa-save ml-2"></i>تسجيل الطالب';
            submitBtn.className = submitBtn.className.replace('from-orange-500 to-red-500', 'from-blue-600 to-purple-600');
        }
    }

    resetForm() {
        this.form.reset();
        this.clearSelects();
        this.sectionGroup.style.display = 'none';
        this.sectionSelect.removeAttribute('required');
        this.editingId = null;
        this.updateSubmitButton(false);
        this.form.querySelectorAll('.border-red-500').forEach(el => {
            el.classList.remove('border-red-500');
            el.setCustomValidity('');
        });
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }
}