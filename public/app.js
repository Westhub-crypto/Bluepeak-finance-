// --- CONFIGURATION ---
const API_URL = window.location.origin;
let currentTab = 'login'; 
let isLoggedIn = false;
const app = document.getElementById('app');

// Live Data Store
let userData = { username: "", balance: 0, earned: 0, referrals: 0, refEarnings: 0 };
let activePlans = [];

// --- CORE ENGINE ---
async function switchTab(tab) {
    if (!isLoggedIn && tab !== 'login' && tab !== 'register') {
        notify("Authentication Required", "red");
        return;
    }
    
    // Fetch fresh data from DB every time a tab is switched!
    if (isLoggedIn) {
        await fetchLiveData();
    }
    
    currentTab = tab;
    render();
    window.scrollTo(0,0);
}

function notify(msg, type = "gold") {
    const oldToast = document.querySelector('.toast-msg');
    if(oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = `toast-msg fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl font-black text-[10px] shadow-2xl animate-in fade-in slide-in-from-top duration-300 ${type === 'gold' ? 'bg-[#C9A227] text-black' : 'bg-red-600 text-white'}`;
    toast.innerText = msg.toUpperCase();
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- DATA FETCHING (THE FIX) ---
async function fetchLiveData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // 1. Fetch live balance
        const resUser = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resUser.ok) {
            const user = await resUser.json();
            userData.username = user.username;
            userData.balance = user.depositBalance || 0; // Maps your admin top-up!
            userData.earned = user.earnedBalance || 0;
            userData.referrals = user.referralCount || 0;
            userData.refEarnings = user.referralBalance || 0;
        }

        // 2. Fetch live plans
        const resPlans = await fetch(`${API_URL}/api/auth/plans`);
        if (resPlans.ok) {
            activePlans = await resPlans.json(); // Gets plans published by admin!
        }
    } catch (err) {
        console.log("Sync Error");
    }
}

// --- API ACTIONS ---
async function handleLogin() {
    const email = document.getElementById('log_id').value;
    const password = document.getElementById('log_pass').value;

    if (!email || !password) return notify("Missing Credentials", "red");
    notify("Authenticating...", "gold");

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
            await fetchLiveData(); // Pull real data before showing dashboard
            notify("Access Granted");
            switchTab('home');
        } else {
            notify(result.message || "Invalid Credentials", "red");
        }
    } catch (err) {
        notify("Server Offline", "red");
    }
}

async function handleRegister() {
    const fields = ['r_fn', 'r_ln', 'r_user', 'r_email', 'r_pass', 'r_cpass'];
    let valid = true;
    fields.forEach(id => { if(!document.getElementById(id).value) valid = false; });
    if(!valid) return notify("All fields required", "red");
    if(document.getElementById('r_pass').value !== document.getElementById('r_cpass').value) return notify("Passwords mismatch", "red");

    notify("Securing Account...", "gold");

    const data = {
        firstName: document.getElementById('r_fn').value,
        surname: document.getElementById('r_ln').value,
        username: document.getElementById('r_user').value,
        email: document.getElementById('r_email').value,
        country: document.getElementById('r_country').value,
        password: document.getElementById('r_pass').value,
    };

    try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            notify("Vault Created. Please Sign In.");
            switchTab('login');
        } else {
            const result = await res.json();
            notify(result.message, "red");
        }
    } catch (err) {
        notify("Server Error", "red");
    }
}

async function processDeposit() {
    const amtInput = document.getElementById('deposit_amount').value;
    if (!amtInput) return notify("Please enter an amount", "red");
    const amount = Number(amtInput);
    if (amount < 3000) return notify("Minimum deposit is ₦3,000", "red");

    notify("Connecting to Secure Gateway...", "gold");

    try {
        const res = await fetch(`${API_URL}/api/payment/initiate`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount })
        });
        const result = await res.json();
        if (res.ok && result.checkout_url) window.location.href = result.checkout_url;
        else notify("Payment Gateway Failed", "red");
    } catch (err) {
        notify("Payment Server Offline", "red");
    }
}

// --- UI SCREENS ---
const Navigation = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#0B0B0B]/95 backdrop-blur-2xl border-t border-white/5 p-4 flex justify-around items-center z-50">
        ${['home', 'plans', 'track', 'invite', 'profile'].map(t => `
            <button onclick="switchTab('${t}')" class="flex flex-col items-center ${currentTab === t ? 'text-[#1E90FF]' : 'text-gray-600'}">
                <span class="text-[8px] font-black uppercase tracking-widest">${t}</span>
            </button>
        `).join('')}
    </div>
`;

function LoginPage() {
    return `
        <div class="pt-20 animate-in zoom-in">
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

function RegisterPage() {
    return `
        <div class="pt-10 pb-24 animate-in slide-in-from-bottom">
            <h2 class="text-2xl font-black text-white italic mb-8 uppercase tracking-tighter">Establish <span class="text-[#1E90FF]">Vault</span></h2>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <input type="text" id="r_fn" placeholder="First Name" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="text" id="r_ln" placeholder="Last Name" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="text" id="r_user" placeholder="Username" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="email" id="r_email" placeholder="Email" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <select id="r_country" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none"><option value="Nigeria">Nigeria</option><option value="Ghana">Ghana</option></select>
                <input type="password" id="r_pass" placeholder="Password" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="password" id="r_cpass" placeholder="Confirm Password" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
            </div>
            <button onclick="handleRegister()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl">Register Account</button>
            <p onclick="switchTab('login')" class="text-center text-gray-500 text-[9px] mt-6 uppercase font-bold underline cursor-pointer">Back to Login</p>
        </div>
    `;
}

function HomePage() {
    return `
        <div class="animate-in fade-in">
            <div class="flex justify-between items-center mb-10">
                <div class="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-3">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-[8px] font-black text-gray-300 uppercase tracking-widest">Market Online</span>
                </div>
                <p class="text-[#C9A227] font-black text-[10px] uppercase italic tracking-widest">${userData.username}</p>
            </div>

            <div class="bg-gradient-to-br from-[#111827] to-[#0B0B0B] p-10 rounded-[45px] border border-white/10 shadow-2xl mb-10 relative">
                <p class="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em] mb-4">Earned Profit</p>
                <h2 class="text-5xl font-black text-white tracking-tighter mb-12">₦ ${userData.earned.toLocaleString()}</h2>
                <div class="flex gap-4">
                    <button onclick="switchTab('deposit')" class="flex-1 bg-[#1E90FF] py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/30 active:scale-95">Deposit</button>
                    <button onclick="notify('Withdrawal limit not reached', 'red')" class="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase active:scale-95">Withdraw</button>
                </div>
            </div>

            <div class="bg-[#111827] p-6 rounded-3xl border border-white/5 flex justify-between">
                <div><p class="text-[8px] text-gray-500 uppercase font-black">Deposit Bal.</p><p class="text-white font-black text-lg italic">₦ ${userData.balance.toLocaleString()}</p></div>
                <div class="text-right"><p class="text-[8px] text-gray-500 uppercase font-black">Status</p><p class="text-[#C9A227] font-black text-[10px] uppercase italic">Elite</p></div>
            </div>
        </div>
    `;
}

function DepositPage() {
    return `
        <div class="animate-in slide-in-from-right duration-500 pb-20">
            <div class="flex items-center gap-4 mb-8">
                <button onclick="switchTab('home')" class="w-10 h-10 bg-[#111827] rounded-full border border-white/10 text-white font-black hover:bg-white/5">←</button>
                <h2 class="text-2xl font-black text-white italic uppercase tracking-tighter">Fund <span class="text-[#1E90FF]">Vault</span></h2>
            </div>
            <div class="bg-[#111827] p-8 rounded-[35px] border border-white/5 mb-6 shadow-xl">
                <p class="text-[9px] text-gray-500 font-black uppercase mb-4 tracking-widest italic">Enter Amount</p>
                <div class="relative mb-8">
                    <span class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">₦</span>
                    <input type="number" id="deposit_amount" placeholder="3000" class="w-full bg-black/40 border border-white/10 p-5 pl-12 rounded-2xl text-white font-black text-2xl outline-none focus:border-[#1E90FF]">
                </div>
                <div class="grid grid-cols-2 gap-3 mb-8">
                    ${[5000, 10000, 50000, 100000].map(amt => `
                        <button onclick="document.getElementById('deposit_amount').value = ${amt}" class="bg-white/5 border border-white/10 py-4 rounded-xl font-black text-xs hover:border-[#1E90FF]">₦${amt.toLocaleString()}</button>
                    `).join('')}
                </div>
                <button onclick="processDeposit()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl">Proceed to Gateway</button>
            </div>
        </div>
    `;
}

function PlansPage() {
    if (activePlans.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center py-32 text-center opacity-50">
                <div class="text-4xl mb-6 italic">💎</div>
                <h2 class="text-xl font-black text-white mb-2 uppercase">Awaiting Plans</h2>
                <p class="text-[10px] text-gray-500 px-12 leading-relaxed tracking-widest">NO ACTIVE PLANS PUBLISHED BY ADMIN.</p>
            </div>
        `;
    }

    return `
        <div class="animate-in slide-in-from-bottom pb-20">
            <h2 class="text-2xl font-black text-white italic mb-8 uppercase tracking-tighter">Market <span class="text-[#1E90FF]">Plans</span></h2>
            <div class="space-y-6">
                ${activePlans.map(plan => `
                    <div class="bg-gradient-to-br from-[#111827] to-[#0B0B0B] p-6 rounded-3xl border border-white/10 shadow-xl">
                        <h3 class="text-lg font-black text-white italic mb-1">${plan.name}</h3>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Duration: ${plan.duration} Days</p>
                        
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                                <p class="text-[8px] text-gray-500 uppercase font-black">Min Deposit</p>
                                <p class="text-white font-black text-sm mt-1">₦ ${plan.minDeposit.toLocaleString()}</p>
                            </div>
                            <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                                <p class="text-[8px] text-gray-500 uppercase font-black">Daily ROI</p>
                                <p class="text-[#C9A227] font-black text-sm mt-1">${plan.dailyRoi}%</p>
                            </div>
                        </div>
                        <button onclick="notify('Insufficient Balance. Please Deposit.', 'red')" class="w-full bg-[#1E90FF] py-4 rounded-xl font-black text-white text-[10px] uppercase shadow-lg shadow-blue-500/20 active:scale-95">Invest Now</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function ProfilePage() {
    return `
        <div class="animate-in fade-in space-y-8">
            <h2 class="text-2xl font-black text-white italic uppercase tracking-tighter">Account <span class="text-[#1E90FF]">Vault</span></h2>
            <button onclick="localStorage.removeItem('token'); location.reload();" class="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Logout</button>
        </div>
    `;
}

function render() {
    let content = '';
    if (currentTab === 'login') content = LoginPage();
    else if (currentTab === 'register') content = RegisterPage();
    else if (currentTab === 'home') content = HomePage();
    else if (currentTab === 'deposit') content = DepositPage();
    else if (currentTab === 'plans') content = PlansPage();
    else if (currentTab === 'profile') content = ProfilePage();
    else if (currentTab === 'invite') content = `<div class="pt-20 text-center"><h2 class="text-2xl font-black">INVITE & EARN</h2></div>`;
    else if (currentTab === 'track') content = `<div class="py-20 text-center opacity-30 text-xs font-black uppercase">No active investments found.</div>`;

    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen bg-[#0B0B0B] text-white p-6 pb-32 font-sans overflow-x-hidden selection:bg-[#1E90FF]">
            ${content}
            ${isLoggedIn && currentTab !== 'deposit' ? Navigation() : ''}
        </div>
    `;
}

render();
// Auto-login check if token exists
if(localStorage.getItem('token')) {
    isLoggedIn = true;
    switchTab('home');
    }
