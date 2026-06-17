// ============ SECURITY: Input Sanitization ============

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============ FORM VALIDATION ============

const validators = {
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    password: (value) => {
        // Enhanced: min 8 chars, at least one uppercase, one lowercase, one number
        return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value);
    },
    passwordStrength: (value) => {
        // Returns: 'weak', 'medium', 'strong'
        let strength = 'weak';
        if (value.length >= 12) strength = 'medium';
        if (value.length >= 12 && /[!@#$%^&*]/.test(value)) strength = 'strong';
        return strength;
    },
    name: (value) => {
        return value.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(value);
    },
    businessName: (value) => {
        return value.trim().length >= 3 && /^[a-zA-Z0-9\s'-]+$/.test(value);
    }
};

const errorMessages = {
    emailInvalid: 'Please enter a valid email address',
    passwordShort: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
    nameShort: 'Name must be at least 2 characters (letters, spaces, hyphens, apostrophes only)',
    businessNameShort: 'Business name must be at least 3 characters',
    passwordMismatch: 'Passwords do not match',
    emailExists: 'This email is already registered'
};

// ============ BACKEND SIMULATION (In production, use actual backend) ============

class BackendService {
    static async registerUser(userData) {
        // Simulate backend call - in production, POST to /api/auth/register
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.userExists(userData.email)) {
                    reject('Email already registered');
                } else {
                    // Simulate password hashing on backend
                    const hashedPassword = this.hashPassword(userData.password);
                    const user = {
                        ...userData,
                        password: hashedPassword,
                        createdAt: new Date().toISOString(),
                        documents: []
                    };
                    SessionManager.saveUser(userData.email, user);
                    resolve(user);
                }
            }, 500);
        });
    }

    static async loginUser(email, password) {
        // Simulate backend call - in production, POST to /api/auth/login
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = SessionManager.getUser(email);
                if (!user) {
                    reject('User not found');
                } else if (!this.verifyPassword(password, user.password)) {
                    reject('Incorrect password');
                } else {
                    // Return user without password
                    const { password: _, ...userWithoutPassword } = user;
                    resolve(userWithoutPassword);
                }
            }, 500);
        });
    }

    // Simple hash simulation - IN PRODUCTION USE REAL BACKEND WITH BCRYPT
    static hashPassword(password) {
        // This is just for demo - NEVER use this in production
        // Use bcrypt or Argon2 on the backend
        return btoa(password + 'salt_' + Date.now());
    }

    static verifyPassword(password, hash) {
        return btoa(password + 'salt_' + hash.split('_')[1]) === hash;
    }

    static userExists(email) {
        return SessionManager.userExists(email);
    }
}

// ============ SESSION MANAGEMENT (Secure) ============

class SessionManager {
    static STORAGE_KEY = 'brp_users';
    static SESSION_KEY = 'brp_session';
    static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    static SESSION_TOKEN_KEY = 'brp_token';

    static generateToken() {
        // Generate a simple token (in production, use JWT from backend)
        return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static getUsers() {
        const users = localStorage.getItem(this.STORAGE_KEY);
        return users ? JSON.parse(users) : {};
    }

    static saveUser(email, userData) {
        const users = this.getUsers();
        users[email.toLowerCase()] = userData;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    }

    static userExists(email) {
        const users = this.getUsers();
        return email.toLowerCase() in users;
    }

    static getUser(email) {
        const users = this.getUsers();
        return users[email.toLowerCase()];
    }

    static createSession(user) {
        const session = {
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                businessName: user.businessName
            },
            token: this.generateToken(),
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(this.SESSION_TOKEN_KEY, session.token);
    }

    static getSession() {
        const session = sessionStorage.getItem(this.SESSION_KEY);
        if (!session) return null;
        
        const parsed = JSON.parse(session);
        const now = Date.now();
        
        // Check if session expired
        if (now - parsed.lastActivity > this.SESSION_TIMEOUT) {
            this.logout();
            return null;
        }
        
        // Update last activity
        parsed.lastActivity = now;
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(parsed));
        return parsed;
    }

    static getCurrentUser() {
        const session = this.getSession();
        return session ? session.user : null;
    }

    static logout() {
        sessionStorage.removeItem(this.SESSION_KEY);
        sessionStorage.removeItem(this.SESSION_TOKEN_KEY);
    }
}

// ============ FORM HANDLING ============

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorId = fieldId + 'Error';
    const errorElement = document.getElementById(errorId);
    
    if (field) field.classList.remove('error');
    if (errorElement) errorElement.textContent = '';
}

function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorId = fieldId + 'Error';
    const errorElement = document.getElementById(errorId);
    
    if (field) field.classList.add('error');
    if (errorElement) errorElement.textContent = escapeHtml(message);
}

function validateLoginForm() {
    let isValid = true;
    
    clearFieldError('loginEmail');
    clearFieldError('loginPassword');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email) {
        setFieldError('loginEmail', 'Email is required');
        isValid = false;
    } else if (!validators.email(email)) {
        setFieldError('loginEmail', errorMessages.emailInvalid);
        isValid = false;
    }
    
    if (!password) {
        setFieldError('loginPassword', 'Password is required');
        isValid = false;
    }
    
    return isValid ? { email: email.toLowerCase(), password } : null;
}

function validateRegisterForm() {
    let isValid = true;
    
    // Clear all errors
    clearFieldError('regFirstName');
    clearFieldError('regLastName');
    clearFieldError('regEmail');
    clearFieldError('regBusinessName');
    clearFieldError('regPassword');
    clearFieldError('regConfirmPassword');
    
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const businessName = document.getElementById('regBusinessName').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    // Validate First Name
    if (!firstName) {
        setFieldError('regFirstName', 'First name is required');
        isValid = false;
    } else if (!validators.name(firstName)) {
        setFieldError('regFirstName', errorMessages.nameShort);
        isValid = false;
    }
    
    // Validate Last Name
    if (!lastName) {
        setFieldError('regLastName', 'Last name is required');
        isValid = false;
    } else if (!validators.name(lastName)) {
        setFieldError('regLastName', errorMessages.nameShort);
        isValid = false;
    }
    
    // Validate Email
    if (!email) {
        setFieldError('regEmail', 'Email is required');
        isValid = false;
    } else if (!validators.email(email)) {
        setFieldError('regEmail', errorMessages.emailInvalid);
        isValid = false;
    } else if (SessionManager.userExists(email)) {
        setFieldError('regEmail', errorMessages.emailExists);
        isValid = false;
    }
    
    // Validate Business Name
    if (!businessName) {
        setFieldError('regBusinessName', 'Business name is required');
        isValid = false;
    } else if (!validators.businessName(businessName)) {
        setFieldError('regBusinessName', errorMessages.businessNameShort);
        isValid = false;
    }
    
    // Validate Password
    if (!password) {
        setFieldError('regPassword', 'Password is required');
        isValid = false;
    } else if (!validators.password(password)) {
        setFieldError('regPassword', errorMessages.passwordShort);
        isValid = false;
    }
    
    // Validate Confirm Password
    if (!confirmPassword) {
        setFieldError('regConfirmPassword', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        setFieldError('regConfirmPassword', errorMessages.passwordMismatch);
        isValid = false;
    }
    
    if (!isValid) return null;
    
    return { firstName, lastName, email: email.toLowerCase(), businessName, password };
}

// ============ AUTH EVENTS ============

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tabName === 'login') {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('loginForm').reset();
        document.getElementById('loginFormError').textContent = '';
    } else {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('registerForm').reset();
        document.getElementById('registerFormError').textContent = '';
    }
    
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = validateLoginForm();
    if (!formData) return;
    
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    try {
        const user = await BackendService.loginUser(formData.email, formData.password);
        document.getElementById('loginSuccess').textContent = 'Login successful! Redirecting...';
        
        SessionManager.createSession(user);
        
        setTimeout(() => {
            showDashboard();
        }, 500);
    } catch (error) {
        document.getElementById('loginFormError').textContent = escapeHtml(error);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = validateRegisterForm();
    if (!formData) return;
    
    const registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Account...';
    
    try {
        const user = await BackendService.registerUser({
            firstName: sanitizeInput(formData.firstName),
            lastName: sanitizeInput(formData.lastName),
            email: formData.email,
            businessName: sanitizeInput(formData.businessName),
            password: formData.password,
            registrationDate: new Date().toLocaleDateString()
        });
        
        document.getElementById('registerSuccess').textContent = 'Account created successfully! Logging in...';
        
        SessionManager.createSession(user);
        
        setTimeout(() => {
            showDashboard();
        }, 500);
    } catch (error) {
        document.getElementById('registerFormError').textContent = escapeHtml(error);
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }
});

// ============ DASHBOARD FUNCTIONS ============

function showDashboard() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'flex';
    
    const user = SessionManager.getCurrentUser();
    if (user) {
        updateDashboardWithUserData(user);
    }
}

function updateDashboardWithUserData(user) {
    // Sanitize and display user data
    document.getElementById('userGreeting').textContent = `Welcome, ${escapeHtml(user.firstName)}!`;
    document.getElementById('displayFirstName').textContent = escapeHtml(user.firstName);
    document.getElementById('displayLastName').textContent = escapeHtml(user.lastName);
    document.getElementById('displayEmail').textContent = escapeHtml(user.email);
    document.getElementById('displayBusinessName').textContent = escapeHtml(user.businessName);
    document.getElementById('displayFullName').textContent = `${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}`;
    document.getElementById('displayBusinessNameCard').textContent = escapeHtml(user.businessName);
    document.getElementById('registrationDate').textContent = escapeHtml(user.registrationDate);
    
    // Load documents
    loadUserDocuments(user);
}

function loadUserDocuments(user) {
    const docsList = document.getElementById('docsList');
    docsList.innerHTML = '';
    
    const storedUser = SessionManager.getUser(user.email);
    if (!storedUser.documents || storedUser.documents.length === 0) {
        docsList.innerHTML = '<p class="empty-state">No documents uploaded yet.</p>';
        return;
    }
    
    storedUser.documents.forEach((doc, index) => {
        const docItem = document.createElement('div');
        docItem.className = 'doc-item';
        docItem.innerHTML = `
            <div class="doc-icon">📄</div>
            <div class="doc-name">${escapeHtml(doc.name)}</div>
            <div class="doc-type">${escapeHtml(doc.type)}</div>
            <button class="doc-delete" onclick="deleteDocument(${index})">Delete</button>
        `;
        docsList.appendChild(docItem);
    });
    
    document.getElementById('docCount').textContent = storedUser.documents.length;
}

function switchDashboardTab(tabName, event) {
    event.preventDefault();
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    
    const tabMap = {
        'overview': ['overviewTab', 'Dashboard'],
        'registration': ['registrationTab', 'Business Registration'],
        'documents': ['documentsTab', 'Document Management'],
        'compliance': ['complianceTab', 'Compliance Management'],
        'support': ['supportTab', 'Support Resources']
    };
    
    if (tabMap[tabName]) {
        document.getElementById(tabMap[tabName][0]).classList.add('active');
        document.getElementById('pageTitle').textContent = tabMap[tabName][1];
    }
}

document.getElementById('documentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const docType = document.getElementById('docType').value;
    const docFile = document.getElementById('docFile');
    
    document.getElementById('docTypeError').textContent = '';
    document.getElementById('docFileError').textContent = '';
    
    let isValid = true;
    if (!docType) {
        document.getElementById('docTypeError').textContent = 'Please select a document type';
        isValid = false;
    }
    
    if (!docFile.files || docFile.files.length === 0) {
        document.getElementById('docFileError').textContent = 'Please select a file to upload';
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Validate file size (5MB max)
    if (docFile.files[0].size > 5 * 1024 * 1024) {
        document.getElementById('docFileError').textContent = 'File size must be less than 5MB';
        return;
    }
    
    const user = SessionManager.getCurrentUser();
    const storedUser = SessionManager.getUser(user.email);
    const fileName = docFile.files[0].name;
    
    if (!storedUser.documents) {
        storedUser.documents = [];
    }
    
    storedUser.documents.push({
        name: sanitizeInput(fileName),
        type: docType,
        uploadDate: new Date().toLocaleDateString(),
        size: docFile.files[0].size
    });
    
    SessionManager.saveUser(user.email, storedUser);
    
    this.reset();
    loadUserDocuments(user);
    
    showNotification('Document uploaded successfully!', 'success');
});

function deleteDocument(index) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    const user = SessionManager.getCurrentUser();
    const storedUser = SessionManager.getUser(user.email);
    
    storedUser.documents.splice(index, 1);
    SessionManager.saveUser(user.email, storedUser);
    
    loadUserDocuments(user);
    showNotification('Document deleted successfully!', 'success');
}

function logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    SessionManager.logout();
    
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.success-message').forEach(el => el.textContent = '');
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
    
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById('loginForm').classList.add('active');
}

// ============ MODAL FUNCTIONS ============

const MODAL_CONTENT = {
    step1: {
        title: 'Step 1: Company Information',
        content: `
            <h3>Provide Your Company Details</h3>
            <p>To register your business, you'll need to provide:</p>
            <ul>
                <li><strong>Legal Business Name:</strong> The official registered name of your business</li>
                <li><strong>Business Address:</strong> Physical address of your business</li>
                <li><strong>Mailing Address:</strong> Where official documents should be sent</li>
                <li><strong>Contact Phone Number:</strong> Primary contact number</li>
                <li><strong>Business Email:</strong> Official business email address</li>
            </ul>
            <p><strong>Tip:</strong> Have your business documents ready before you start.</p>
        `
    },
    step2: {
        title: 'Step 2: Legal Structure',
        content: `
            <h3>Choose Your Business Entity Type</h3>
            <p>Select the legal structure that best fits your business:</p>
            <ul>
                <li><strong>Sole Proprietorship:</strong> You are the only owner</li>
                <li><strong>Partnership:</strong> Business owned by 2 or more people</li>
                <li><strong>Limited Liability Company (LLC):</strong> Provides liability protection</li>
                <li><strong>Corporation:</strong> Separate legal entity (C-Corp or S-Corp)</li>
                <li><strong>Non-Profit Organization:</strong> For charitable/educational purposes</li>
            </ul>
            <p><strong>Important:</strong> This choice affects your taxes, liability, and compliance requirements.</p>
        `
    },
    step3: {
        title: 'Step 3: Registration',
        content: `
            <h3>Submit Your Registration</h3>
            <p>Once you've prepared your information, you'll submit:</p>
            <ul>
                <li>Articles of Incorporation or Organization</li>
                <li>Bylaws or Operating Agreement</li>
                <li>Proof of Address</li>
                <li>Owner/Member Identification</li>
                <li>Any required state-specific forms</li>
            </ul>
            <p><strong>Processing Time:</strong> Most registrations are processed within 5-10 business days.</p>
        `
    },
    step4: {
        title: 'Step 4: Tax Registration',
        content: `
            <h3>Complete Tax Registration</h3>
            <p>After business registration, you'll need to:</p>
            <ul>
                <li>Obtain an Employer Identification Number (EIN) from the IRS</li>
                <li>Register for State Sales Tax (if applicable)</li>
                <li>Register for Payroll Taxes (if you have employees)</li>
                <li>Register for Unemployment Insurance</li>
                <li>Obtain any industry-specific licenses</li>
            </ul>
            <p><strong>Benefit:</strong> Tax registration can often be completed online and is usually free.</p>
        `
    }
};

function openModal(step) {
    const content = MODAL_CONTENT[step];
    if (content) {
        document.getElementById('modalTitle').textContent = content.title;
        document.getElementById('modalBody').innerHTML = content.content;
        document.getElementById('detailModal').style.display = 'flex';
    }
}

function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// ============ CHAT FUNCTIONS ============

function openChat() {
    document.getElementById('chatModal').style.display = 'flex';
    document.getElementById('chatMessages').innerHTML = `
        <div class="chat-message support">
            <p><strong>Support Agent:</strong> Hello! How can I help you today?</p>
        </div>
    `;
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('chatMessages');
    
    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = `<p>${escapeHtml(message)}</p>`;
    chatMessages.appendChild(userMsg);
    
    // Clear input
    chatInput.value = '';
    
    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate support response
    setTimeout(() => {
        const responses = [
            'Thank you for your message. Our team will review your inquiry and get back to you shortly.',
            'I understand. Let me help you with that. Could you provide more details?',
            'Great question! This is a common question we receive. Please check our Knowledge Base for detailed information.',
            'I\'ll connect you with a specialist who can better assist you.',
            'Thank you for using our support system. Your message has been logged.'
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        const supportMsg = document.createElement('div');
        supportMsg.className = 'chat-message support';
        supportMsg.innerHTML = `<p><strong>Support Agent:</strong> ${response}</p>`;
        chatMessages.appendChild(supportMsg);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// ============ SUPPORT RESOURCES ============

const SUPPORT_RESOURCES = {
    'knowledge-base': {
        title: 'Knowledge Base',
        content: `
            <h3>Business Registration Knowledge Base</h3>
            <p>Find answers to frequently asked questions:</p>
            <ul>
                <li><a href="#">How do I register my business?</a></li>
                <li><a href="#">What documents do I need?</a></li>
                <li><a href="#">What are the registration fees?</a></li>
                <li><a href="#">How long does registration take?</a></li>
                <li><a href="#">Can I change my business structure later?</a></li>
                <li><a href="#">What is an EIN and do I need one?</a></li>
            </ul>
        `
    },
    'live-chat': {
        title: 'Live Chat Support',
        action: 'openChat'
    },
    'phone-support': {
        title: 'Phone Support',
        content: `
            <h3>Phone Support</h3>
            <p><strong>Available Hours:</strong> Monday - Friday, 9 AM - 5 PM EST</p>
            <p><strong>Phone Number:</strong> +1-800-BUSINESS (248-9377)</p>
            <p><strong>Extension:</strong> 1 for Registration, 2 for Compliance, 3 for Billing</p>
            <p>Our support team is ready to assist you with any questions about business registration and compliance.</p>
        `
    },
    'email-support': {
        title: 'Email Support',
        content: `
            <h3>Email Support</h3>
            <p><strong>Email Address:</strong> support@iconicuniversity.edu</p>
            <p><strong>Response Time:</strong> Within 24 business hours</p>
            <p>Please include the following in your email:</p>
            <ul>
                <li>Your account email address</li>
                <li>A clear description of your issue</li>
                <li>Any relevant documents or screenshots</li>
            </ul>
        `
    },
    'webinars': {
        title: 'Training Webinars',
        content: `
            <h3>Upcoming Webinars</h3>
            <p>Join our expert-led webinars to learn about business topics:</p>
            <ul>
                <li><strong>Webinar 1:</strong> Business Registration 101 - June 25, 2:00 PM EST</li>
                <li><strong>Webinar 2:</strong> Tax Planning for New Businesses - July 2, 3:00 PM EST</li>
                <li><strong>Webinar 3:</strong> Compliance and Legal Requirements - July 9, 2:00 PM EST</li>
                <li><strong>Webinar 4:</strong> Growing Your Business - July 16, 3:00 PM EST</li>
            </ul>
            <p>All webinars are free and recorded for later viewing.</p>
        `
    },
    'legal-resources': {
        title: 'Legal Resources',
        content: `
            <h3>Legal Documents and Templates</h3>
            <p>Access templates and legal documents for your business:</p>
            <ul>
                <li><a href="#">Operating Agreement Template</a></li>
                <li><a href="#">Partnership Agreement Template</a></li>
                <li><a href="#">Employee Handbook Template</a></li>
                <li><a href="#">Confidentiality Agreement</a></li>
                <li><a href="#">Independent Contractor Agreement</a></li>
                <li><a href="#">Business Loan Agreement</a></li>
            </ul>
            <p><strong>Disclaimer:</strong> These templates are for reference only. Consult with a legal professional for your specific needs.</p>
        `
    }
};

function openResource(resourceType) {
    const resource = SUPPORT_RESOURCES[resourceType];
    
    if (resource && resource.action === 'openChat') {
        openChat();
    } else if (resource) {
        document.getElementById('modalTitle').textContent = resource.title;
        document.getElementById('modalBody').innerHTML = resource.content;
        document.getElementById('detailModal').style.display = 'flex';
    }
}

// ============ NOTIFICATION SYSTEM ============

function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#27AE60' : type === 'error' ? '#E74C3C' : '#2E5090'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============ PROFILE PICTURE FUNCTIONS ============

function handleProfilePicChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePicPreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function handleNewProfilePicChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('newProfilePicPreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function changeProfilePicture() {
    document.getElementById('profilePicModal').style.display = 'flex';
}

function closeProfilePicModal() {
    document.getElementById('profilePicModal').style.display = 'none';
}

function saveNewProfilePic() {
    const newPic = document.getElementById('newProfilePicPreview').src;
    if (newPic && newPic !== document.getElementById('profileDisplayPic').src) {
        document.getElementById('profileDisplayPic').src = newPic;
        document.getElementById('dashboardAvatar').src = newPic;
        showNotification('Profile picture updated successfully!', 'success');
        closeProfilePicModal();
    }
}

// ============ INITIALIZE APP ============

window.addEventListener('load', function() {
    const session = SessionManager.getSession();
    
    if (session) {
        showDashboard();
    } else {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('dashboardPage').style.display = 'none';
    }
});

// ============ SECURITY: Auto-logout on inactivity ============

let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        const session = SessionManager.getSession();
        if (session) {
            SessionManager.logout();
            window.location.reload();
            showNotification('Session expired due to inactivity. Please login again.', 'error');
        }
    }, SessionManager.SESSION_TIMEOUT);
}

document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);

// ============ SECURITY: Close modals on ESC key ============

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.getElementById('detailModal').style.display = 'none';
        document.getElementById('chatModal').style.display = 'none';
        document.getElementById('profilePicModal').style.display = 'none';
    }
});
