
const currentPath = window.location.pathname;

const navLinks = {
    admin: `
        <a href="../features/students/students-list.html" class="text-gray-600 hover:text-blue-600 transition-colors">قائمة الطلاب</a>
        <a href="../features/attendance/attendance.html" class="text-gray-600 hover:text-blue-600 transition-colors">إدارة الحضور</a>
        <a href="../features/payments/payments.html" class="text-gray-600 hover:text-blue-600 transition-colors">إدارة المدفوعات</a>
    `,
    attendance: `
        <a href="../students/students-list.html" class="text-gray-600 hover:text-blue-600 transition-colors">قائمة الطلاب</a>
        <a href="../students/students.html" class="text-gray-600 hover:text-blue-600 transition-colors">إضافة طالب</a>
        <a href="../payments/payments.html" class="text-gray-600 hover:text-blue-600 transition-colors">إدارة المدفوعات</a>
    `,
    payments: `
        <a href="../students/students-list.html" class="text-gray-600 hover:text-blue-600 transition-colors">قائمة الطلاب</a>
        <a href="../students/students.html" class="text-gray-600 hover:text-blue-600 transition-colors">إضافة طالب</a>
        <a href="../attendance/attendance.html" class="text-gray-600 hover:text-blue-600 transition-colors">إدارة الحضور</a>
    `,
    students: `
    <a href="./students-list.html" class="text-gray-600 hover:text-blue-600 transition-colors">قائمة الطلاب</a>
    <a href="./students.html" class="text-gray-600 hover:text-blue-600 transition-colors">إضافة طالب</a>
    <a href="../attendance/attendance.html" class="text-gray-600 hover:text-blue-600 transition-colors">إدارة الحضور</a>
    <a href="../payments/payments.html" class="text-gray-600 hover:text-blue-600 transition-colors">إدارة المدفوعات</a>
`,
};

function getPageType() {
    if (currentPath.includes('/admin/')) return 'admin';
    if (currentPath.includes('/attendance/')) return 'attendance';
    if (currentPath.includes('/payments/')) return 'payments';
    if (currentPath.includes('/students/')) return 'students';
    return 'default';
}

class AppBar extends HTMLElement {
    constructor() {
        super();
        this.pageType = getPageType();
        this.pageTitle = this.getAttribute('page-title') || 'الأستاذ';
        this.homeLink = this.determineHomeLink();
    }

    determineHomeLink() {
        if (this.pageType === 'admin' || this.pageType === 'attendance' || this.pageType === 'payments' || this.pageType === 'students') {
            return '../../index.html';
        }
        return 'index.html';
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <header class="bg-white shadow-md sticky top-0 z-40">
                <div class="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-user-graduate text-purple-600 ml-2"></i>${this.pageTitle}
                    </h1>
                    <nav class="hidden md:flex gap-6 items-center">
                        ${navLinks[this.pageType] || ''}
                    </nav>
                    <div class="flex items-center gap-4">
                        <div id="db-status" class="text-gray-500 flex items-center">
                            <i class="fas fa-spinner fa-spin ml-2"></i>جاري التحميل...
                        </div>
                        <a href="${this.homeLink}" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                            <i class="fas fa-home ml-1"></i>
                        </a>
                    </div>
                </div>
            </header>
        `;
    }
}

customElements.define('app-bar', AppBar);
