// --- CONFIGURATION & STATE ---
const API_URL = window.location.origin;
let currentTab = 'login'; 
let isLoggedIn = false;

// Live Data Store
let userData = { username: "", balance: 0, earned: 0, referrals: 0, refEarnings: 0 };
let activePlans = [];

// --- CORE ENGINE ---
async function switchTab(tab) {
    if (!isLoggedIn && tab !== 'login' && tab !== 'register') {
        notify("Authentication Required", "red");
        return;
    }
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
    toast.className = `toast-msg fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl font-bold text-[11px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in fade-in slide-in-from-top duration-300 border ${type === 'gold' ? 'bg-[#C9A227]/90 text-black border-[#C9A227]' : 'bg-red-500/90 text-white border-red-500'}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- DATA FETCHING ---
async function fetchLiveData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const resUser = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resUser.ok) {
            const user = await resUser.json();
            userData.username = user.username;
            userData.balance = user.depositBalance || 0; 
            userData.earned = user.earnedBalance || 0;
            userData.referrals = user.referralCount || 0;
            userData.refEarnings = user.referralBalance || 0;
        }

        const resPlans = await fetch(`${API_URL}/api/auth/plans`);
        if (resPlans.ok) {
            activePlans = await resPlans.json(); 
        }
    } catch (err) {
        console.log("Data Sync Error");
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
            await fetchLiveData();
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

// --- UI COMPONENTS ---
const Navigation = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#020617]/90 backdrop-blur-2xl border-t border-white/5 p-4 pb-6 flex justify-around items-center z-50">
        ${[
            {id: 'home', icon: '🏠', label: 'Home'},
            {id: 'plans', icon: '📊', label: 'Plans'},
            {id: 'track', icon: '📈', label: 'Track'},
            {id: 'invite', icon: '🎁', label: 'Invite'},
            {id: 'profile', icon: '👤', label: 'Profile'}
        ].map(t => `
            <button onclick="switchTab('${t.id}')" class="flex flex-col items-center transition-all duration-300 ${currentTab === t.id ? 'text-[#1E90FF] scale-110 drop-shadow-[0_0_10px_rgba(30,144,255,0.8)]' : 'text-gray-600'}">
                <span class="text-lg mb-1">${t.icon}</span>
                <span class="text-[9px] font-semibold">${t.label}</span>
            </button>
        `).join('')}
    </div>
`;

function LoginPage() {
    return `
        <div class="pt-24 animate-in fade-in duration-500">
            <div class="text-center mb-12">
                <div class="w-16 h-16 bg-gradient-to-br from-[#1E90FF] to-[#0070F3] rounded-2xl mx-auto mb-6 shadow-[0_0_30px_rgba(30,144,255,0.4)] flex items-center justify-center">
                    <span class="text-2xl text-white font-black">BP</span>
                </div>
                <h1 class="text-4xl font-bold text-white tracking-tight">BluePeak</h1>
                <p class="text-gray-400 text-xs mt-2">Premium Finance Platform</p>
            </div>
            <div class="bg-white/[0.02] border border-white/5 p-6 rounded-[24px] shadow-2xl backdrop-blur-xl">
                <div class="space-y-4">
                    <input type="text" id="log_id" placeholder="Email or Username" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-[#1E90FF] transition-all">
                    <input type="password" id="log_pass" placeholder="Password" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-[#1E90FF] transition-all">
                    <button onclick="handleLogin()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(30,144,255,0.4)] active:scale-95 transition-all mt-2">Sign In</button>
                </div>
            </div>
            <p class="text-center text-gray-500 text-[11px] mt-8 cursor-pointer hover:text-white transition-all" onclick="switchTab('register')">Don't have an account? <span class="text-[#1E90FF] font-semibold">Register</span></p>
        </div>
    `;
}

function RegisterPage() {
    return `
        <div class="pt-12 pb-24 animate-in slide-in-from-bottom duration-500">
            <h2 class="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
            <p class="text-gray-400 text-xs mb-8">Join the elite investment circle.</p>
            <div class="bg-white/[0.02] border border-white/5 p-6 rounded-[24px] shadow-2xl backdrop-blur-xl">
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <input type="text" id="r_fn" placeholder="First Name" class="bg-black/40 border border-white/10 p-3.5 rounded-xl text-white text-xs outline-none focus:border-[#1E90FF]">
                    <input type="text" id="r_ln" placeholder="Last Name" class="bg-black/40 border border-white/10 p-3.5 rounded-xl text-white text-xs outline-none focus:border-[#1E90FF]">
                    <input type="text" id="r_user" placeholder="Username" class="col-span-2 bg-black/40 border border-white/10 p-3.5 rounded-xl text-white text-xs outline-none focus:border-[#1E90FF]">
                    <input type="email" id="r_email" placeholder="Email Address" class="col-span-2 bg-black/40 border border-white/10 p-3.5 rounded-xl text-white text-xs outline-none focus:border-[#1E90FF]">
                    <select id="r_country" class="col-span-2 bg-black/40 border border-white/10 p-3.5 rounded-xl text-white text-xs outline-none focus:border-[#1E90FF]">
                        <option value="Nigeria" class="bg-gray-900">Nigeria</option>
                        <option value="Ghana" class="bg-gray-900">Ghana</option>
                    </select>
                    <input type="password" id="r_pass" placeholder="Password" class="col-span-2 bg-black/40 border border-white/10 p-3.5 rounded-xl text-white text-xs outline-none focus:border-[#1E90FF]">
                    <input type="password" id="r_cpass" placeholder="Confirm Password" class="col-span-2 bg-black/40 border border-white/10 p-3.5 rounded-xl text-white text-xs outline-none focus:border-[#1E90FF]">
                </div>
                <button onclick="handleRegister()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-xl font-bold text-white text-sm shadow-[0_0_20px_rgba(30,144,255,0.4)] mt-2 active:scale-95 transition-all">Establish Vault</button>
            </div>
            <p onclick="switchTab('login')" class="text-center text-gray-500 text-[11px] mt-6 cursor-pointer hover:text-white">Already registered? <span class="text-[#1E90FF] font-semibold">Sign In</span></p>
        </div>
    `;
}

function HomePage() {
    const totalBalance = userData.balance + userData.earned;
    
    return `
        <div class="animate-in fade-in duration-500 pt-4">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <p class="text-[11px] text-gray-400 font-medium">Welcome back,</p>
                    <h1 class="text-xl font-bold text-white tracking-tight">${userData.username}!</h1>
                </div>
                <div class="w-10 h-10 rounded-full border border-[#1E90FF]/30 p-[2px]">
                    <div class="w-full h-full bg-[#111827] rounded-full flex items-center justify-center text-[#1E90FF] font-bold shadow-[0_0_15px_rgba(30,144,255,0.3)]">
                        ${userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
            </div>

            <div class="relative bg-white/[0.03] backdrop-blur-xl p-6 rounded-[24px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.4)] mb-6 overflow-hidden">
                <div class="absolute -top-12 -right-12 w-48 h-48 bg-[#1E90FF]/10 blur-[60px] rounded-full"></div>
                
                <p class="text-center text-[10px] text-gray-400 mb-1 font-medium">Total Balance</p>
                <h2 class="text-center text-[38px] font-bold text-white tracking-tight mb-6">₦${totalBalance.toLocaleString()}</h2>
                
                <div class="flex justify-between border-t border-white/5 pt-4 mb-6">
                    <div class="text-left">
                        <p class="text-[9px] text-gray-500 mb-1">Earned Profit</p>
                        <p class="text-xs font-bold text-[#10B981] flex items-center gap-1">+₦${userData.earned.toLocaleString()} <span class="text-[8px]">▲</span></p>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] text-gray-500 mb-1">Deposit Balance</p>
                        <p class="text-xs font-bold text-white">₦${userData.balance.toLocaleString()}</p>
                    </div>
                </div>

                <div class="flex gap-4 relative z-10">
                    <button onclick="switchTab('deposit')" class="flex-1 bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-3.5 rounded-[14px] font-semibold text-white text-xs shadow-[0_0_20px_rgba(30,144,255,0.4)] active:scale-95 transition-all">Deposit</button>
                    <button onclick="notify('Withdrawal limit not reached', 'red')" class="flex-1 bg-white/[0.05] border border-white/10 text-white py-3.5 rounded-[14px] font-semibold text-xs hover:bg-white/10 active:scale-95 transition-all">Withdraw</button>
                </div>
            </div>

            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xs font-semibold text-white tracking-wide">Profit Analytics</h3>
                    <div class="flex gap-2 text-[9px] text-gray-500 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                        <span class="text-white font-medium">1W</span><span>1M</span><span>3M</span><span>ALL</span>
                    </div>
                </div>
                <div class="h-24 w-full bg-gradient-to-t from-[#10B981]/10 to-transparent rounded-[16px] border border-white/5 relative flex items-end overflow-hidden">
                    <svg viewBox="0 0 100 30" class="w-full h-full preserve-3d" preserveAspectRatio="none">
                        <path d="M0,25 Q15,10 30,20 T60,5 T100,15" fill="none" stroke="#10B981" stroke-width="1.5" style="filter: drop-shadow(0px 4px 8px rgba(16,185,129,0.6));" />
                    </svg>
                </div>
            </div>

            <div class="text-center pb-6">
                <p class="text-[8px] text-gray-500 font-medium tracking-[0.2em] uppercase flex justify-center items-center gap-2">
                    <span>🔒 Secure</span> • <span>✓ Verified</span> • <span>🛡️ Encrypted</span>
                </p>
            </div>
        </div>
    `;
}

function DepositPage() {
    return `
        <div class="animate-in slide-in-from-right duration-500 pb-20 pt-4">
            <div class="flex items-center gap-4 mb-8">
                <button onclick="switchTab('home')" class="w-8 h-8 bg-white/[0.05] rounded-full border border-white/10 text-white font-bold flex items-center justify-center hover:bg-white/10 transition-all">←</button>
                <h2 class="text-xl font-bold text-white tracking-tight">Fund Vault</h2>
            </div>
            
            <div class="bg-white/[0.03] backdrop-blur-xl p-6 rounded-[24px] border border-white/10 shadow-2xl mb-6">
                <p class="text-[10px] text-gray-400 mb-4 font-medium">Enter Amount to Deposit</p>
                <div class="relative mb-6">
                    <span class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₦</span>
                    <input type="number" id="deposit_amount" placeholder="3000" class="w-full bg-black/40 border border-white/10 p-5 pl-12 rounded-[16px] text-white font-bold text-2xl outline-none focus:border-[#1E90FF] transition-all">
                </div>
                
                <p class="text-[10px] text-gray-400 mb-3 font-medium">Quick Select</p>
                <div class="grid grid-cols-2 gap-3 mb-8">
                    ${[5000, 10000, 50000, 100000].map(amt => `
                        <button onclick="document.getElementById('deposit_amount').value = ${amt}" class="bg-white/[0.03] border border-white/10 py-3.5 rounded-[14px] font-semibold text-[11px] text-gray-300 hover:border-[#1E90FF] hover:text-white transition-all">₦${amt.toLocaleString()}</button>
                    `).join('')}
                </div>
                
                <button onclick="processDeposit()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[14px] font-bold text-white text-[12px] shadow-[0_0_20px_rgba(30,144,255,0.4)] active:scale-95 transition-all">Proceed to Secure Gateway</button>
            </div>
            <p class="text-center text-[10px] text-[#1E90FF] font-medium bg-[#1E90FF]/10 py-3 rounded-xl border border-[#1E90FF]/20">Strict Minimum Deposit: ₦3,000</p>
        </div>
    `;
}

function PlansPage() {
    if (activePlans.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center py-32 text-center">
                <div class="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4"><span class="text-2xl">📊</span></div>
                <h2 class="text-lg font-bold text-white mb-2 tracking-tight">Awaiting Portfolios</h2>
                <p class="text-[11px] text-gray-500 px-8">Our financial analysts are preparing new investment funds. Check back soon.</p>
            </div>
        `;
    }

    return `
        <div class="animate-in fade-in pt-4 pb-20">
            <h2 class="text-2xl font-bold text-white mb-6 tracking-tight">Investment Portfolios</h2>
            <div class="space-y-4">
                ${activePlans.map(plan => `
                    <div class="bg-white/[0.03] backdrop-blur-xl p-5 rounded-[20px] border border-white/10 shadow-xl">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-sm font-bold text-white">${plan.name}</h3>
                                <p class="text-[10px] text-[#10B981] mt-1 font-medium">ROI: ${plan.dailyRoi}% / Day</p>
                            </div>
                            <span class="bg-[#1E90FF]/10 text-[#1E90FF] text-[9px] font-bold px-2 py-1 rounded border border-[#1E90FF]/20">Active Fund</span>
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-5">
                            <div class="bg-black/30 p-3 rounded-[12px] border border-white/5">
                                <p class="text-[9px] text-gray-500 font-medium">Min Capital</p>
                                <p class="text-white font-semibold text-[11px] mt-0.5">₦${plan.minDeposit.toLocaleString()}</p>
                            </div>
                            <div class="bg-black/30 p-3 rounded-[12px] border border-white/5">
                                <p class="text-[9px] text-gray-500 font-medium">Duration</p>
                                <p class="text-white font-semibold text-[11px] mt-0.5">${plan.duration} Days</p>
                            </div>
                        </div>
                        <button onclick="notify('Insufficient Balance. Please Deposit.', 'red')" class="w-full bg-[#1E90FF] py-3 rounded-[12px] font-bold text-white text-[11px] shadow-[0_0_15px_rgba(30,144,255,0.3)] active:scale-95 transition-all">Invest Now</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function ProfilePage() {
    return `
        <div class="animate-in fade-in pt-4 pb-20 space-y-6">
            <h2 class="text-2xl font-bold text-white tracking-tight">Account Profile</h2>
            <div class="bg-white/[0.03] p-5 rounded-[20px] border border-white/10">
                <p class="text-[10px] text-gray-400 font-medium mb-4 uppercase tracking-widest">User Details</p>
                <div class="space-y-3 text-xs">
                    <div class="flex justify-betw
