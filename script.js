const countEl = document.getElementById('count');
const stamps = document.querySelectorAll('.stamp');
const freeMsg = document.getElementById('free-message');
const birthdayMsg = document.getElementById('birthday-message');
const addBtn = document.getElementById('add-button');
const registerForm = document.getElementById('registerForm');
const registrationForm = document.getElementById('registration-form');
const qrSection = document.getElementById('qr-section');
const loyaltyCard = document.getElementById('loyalty-card');

let count = parseInt(localStorage.getItem('coffeeCount')) || 0;
let isRegistered = localStorage.getItem('userRegistered') === 'true';
let userId = localStorage.getItem('userId') || generateUserId();

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function isBirthdayToday(dob) {
    if (!dob) return false;

    const today = new Date();
    const birthDate = new Date(dob);

    return today.getDate() === birthDate.getDate() &&
           today.getMonth() === birthDate.getMonth();
}

function updateDisplay() {
    countEl.textContent = `Coffees collected: ${count} / 4`;
    stamps.forEach((stamp, i) => {
        if (i < count) {
            stamp.classList.add('filled');
        } else {
            stamp.classList.remove('filled');
        }
    });
    
    // Check for birthday
    const userDob = localStorage.getItem('userDob');
    if (isBirthdayToday(userDob)) {
        birthdayMsg.classList.remove('hidden');
    } else {
        birthdayMsg.classList.add('hidden');
    }
    
    if (count >= 4) {
        freeMsg.classList.remove('hidden');
        addBtn.textContent = 'Redeem Free Coffee';
    } else {
        freeMsg.classList.add('hidden');
        addBtn.textContent = 'Add Coffee';
    }
}

function showLoyaltyCard() {
    registrationForm.classList.add('hidden');
    qrSection.classList.add('hidden');
    loyaltyCard.classList.remove('hidden');
    
    // Display user ID
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay) {
        userIdDisplay.textContent = userId;
    }
    
    updateDisplay();
}

function showRegistrationForm() {
    registrationForm.classList.remove('hidden');
    qrSection.classList.remove('hidden');
    loyaltyCard.classList.add('hidden');
}

// Check registration status on page load
if (isRegistered) {
    showLoyaltyCard();
} else {
    showRegistrationForm();
}

// Handle registration form submission
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const dob = document.getElementById('userDob').value;
        const marketingConsent = document.getElementById('marketingConsent').checked;

        // Store user data locally
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userDob', dob);
        localStorage.setItem('marketingConsent', marketingConsent);
        localStorage.setItem('userRegistered', 'true');

        // Send registration data to cafe via email
        sendRegistrationEmail(name, email, dob, marketingConsent, userId);

        // Show loyalty card
        showLoyaltyCard();
    });
}

function sendRegistrationEmail(name, email, dob, marketingConsent, userId) {
    const registrationDate = new Date().toLocaleDateString();

    // Send email via EmailJS
    const templateParams = {
        name: name,
        email: email,
        dob: dob || 'Not provided',
        marketingConsent: marketingConsent ? 'Yes' : 'No',
        userId: userId,
        registrationDate: registrationDate
    };

    emailjs.send('service_79ke1ns', 'template_7c2wack', templateParams)
        .then(function(response) {
            console.log('Email sent successfully!', response.status, response.text);
        }, function(error) {
            console.log('Email failed to send:', error);
        });

    // Store in shared localStorage (for staff dashboard on same device)
    storeCustomerDataForStaff(name, email, dob, marketingConsent, userId, registrationDate);

    // Show success message
    showRegistrationSuccess(name);
}

function storeCustomerDataForStaff(name, email, dob, marketingConsent, userId, registrationDate) {
    // Get existing customers or initialize empty array
    let customers = JSON.parse(localStorage.getItem('registeredCustomers')) || [];

    // Check if customer already exists
    const existingIndex = customers.findIndex(c => c.userId === userId);
    const customerData = {
        userId,
        name,
        email,
        dob,
        marketingConsent,
        registrationDate,
        coffeeCount: parseInt(localStorage.getItem('coffeeCount')) || 0
    };

    if (existingIndex >= 0) {
        // Update existing customer
        customers[existingIndex] = customerData;
    } else {
        // Add new customer
        customers.push(customerData);
    }

    // Store updated customer list
    localStorage.setItem('registeredCustomers', JSON.stringify(customers));
}

function showRegistrationSuccess(name) {
    // Create and show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
    successMsg.innerHTML = `
        <div class="flex items-center">
            <span>🎉 Welcome ${name}! Your loyalty card is ready.</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">×</button>
        </div>
    `;
    document.body.appendChild(successMsg);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (successMsg.parentElement) {
            successMsg.remove();
        }
    }, 5000);
}

// Handle add coffee button (only for registered users)
if (addBtn) {
    addBtn.addEventListener('click', () => {
        if (!isRegistered) {
            alert('Please register first to use your digital loyalty card.');
            return;
        }

        if (count < 4) {
            count++;
        } else {
            count = 0;
        }
        localStorage.setItem('coffeeCount', count);
        updateDisplay();
    });
}