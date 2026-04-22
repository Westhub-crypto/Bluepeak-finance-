// --- CONFIGURATION ---
const API_URL = window.location.origin; // Dynamically points to your Render URL
let currentTab = 'login'; 
let isLoggedIn = false;
let token = localStorage.getItem('token') || null;
const app = document.getElementById('app');

// --- APP ENGINE ---
async function switchTab(tab) {
    if (!isLoggedIn && tab !== 'login' && tab !== 'register') return;
    currentTab = tab;
    render();
}

function notify(msg, type = "gold") {
    const toast = document.createElement('div');
    toast.className = `fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl font-bold text-[10px] shadow-2xl animate-in fade-in slide-in-from-top duration-300 ${type === 'gold' ? 'bg-[#C9A227] text-black' : 'bg-red-600 text-white'}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- API ACTIONS ---

async function handleRegister() {
    const data = {
        firstName: document.getElementById('r_fn').value,
        surname: document.getElementById('r_ln').value,
        username: document.getElementById('r_user').value,
        email: document.getElementById('r_email').value,
        country: document.getElementById('r_country').value,
        password: document.getElementById('r_pass').value,
        confirmPassword: document.getElementById('r_cpass').value,
        agreedToTerms: true
    };

    if (data.password !== data.confirmPassword) return notify("Passwords do not match", "red");

    try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            notify("Account Secured. Please Login.");
            switchTab('login');
        } else {
            notify(result.message, "red");
        }
    } catch (err) {
        notify("Server Connection Failed", "red");
    }
}

async function handleLogin() {
    const email = document.getElementById('log_id').value;
    const password = document.getElementById('log_pass').value;

    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await res.json();
        if (res.ok) {
            localStorage.setItem('token', result.token);
            isLoggedIn = true;
            notify("Access Granted. Welcome.");
            switchTab('home');
        } else {
            notify("Invalid Credentials", "red");
        }
    } catch (err) {
        notify("Vault Offline", "red");
    }
}

// --- UI SCREENS ---

function LoginPage() {
    return `
        <div class="pt-20 animate-in zoom-in duration-500">
            <div class="text-center mb-16">
                <h1 class="text-5xl font-black text-white italic tracking-tighter">BLUEPEAK<span class="text-[#1E90FF]">.</span></h1>
                <p class="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">Premium West Africa</p>
            </div>
            <div class="space-y-4">
                <input type="text" id="log_id" placeholder="Email or Username" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF]">
                <input type="password" id="log_pass" placeholder="Password" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF]">
                <button onclick="handleLogin()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">SIGN IN</button>
                <p class="text-center text-gray-500 text-[10px] mt-8 uppercase font-bold tracking-widest cursor-pointer" onclick="switchTab('register')">Create Elite Account</p>
            </div>
        </div>
    `;
}

function HomePage() {
    return `
        <div class="animate-in fade-in duration-500">
            <div class="flex justify-between items-center mb-10">
                <div class="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-[8px] font-black text-gray-300 uppercase">Live</span>
                </div>
                <h2 class="text-[#C9A227] font-black text-[10px] uppercase tracking-widest italic">BluePeak Elite</h2>
            </div>
            <div class="bg-gradient-to-br from-[#111827] to-[#0B0B0B] p-10 rounded-[45px] border border-white/10 shadow-2xl mb-8 relative">
                <p class="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em] mb-4">Total Balance</p>
                <h2 class="text-5xl font-black text-white tracking-tighter mb-10">₦ 0.00</h2>
                <div class="flex gap-4">
                    <button class="flex-1 bg-[#1E90FF] py-4 rounded-2xl font-black text-[10px] uppercase">Deposit</button>
                    <button class="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase">Withdraw</button>
                </div>
            </div>
        </div>
    `;
}

function RegisterPage() {
    return `
        <div class="pt-10 pb-24 animate-in slide-in-from-bottom duration-500">
            <h2 class="text-3xl font-black text-white italic mb-10 uppercase tracking-tighter">New <span class="text-[#1E90FF]">Account</span></h2>
            <div class="space-y-4">
                <div class="flex gap-4">
                    <input type="text" id="r_fn" placeholder="First Name" class="w-1/2 bg-[#111827] border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="text" id="r_ln" placeholder="Surname" class="w-1/2 bg-[#111827] border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                </div>
                <input type="text" id="r_user" placeholder="Username" class="w-full bg-[#111827] border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                <input type="email" id="r_email" placeholder="Email Address" class="w-full bg-[#111827] border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                <select id="r_country" class="w-full bg-[#111827] border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                </select>
                <input type="password" id="r_pass" placeholder="Password" class="w-full bg-[#111827] border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                <input type="password" id="r_cpass" placeholder="Confirm Password" class="w-full bg-[#111827] border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                <button onclick="handleRegister()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white mt-4 uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20">Create Vault</button>
            </div>
        </div>
    `;
}

// --- RENDER ---
function render() {
    let content = '';
    if (currentTab === 'login') content = LoginPage();
    else if (currentTab === 'register') content = RegisterPage();
    else if (currentTab === 'home') content = HomePage();
    
    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen p-6 font-sans">
            ${content}
        </div>
    `;
}

render();
