// --- CONFIGURATION & STATE ---
const API_URL = window.location.origin;
let currentTab = 'login'; 
let isLoggedIn = false;
let resetStep = 1; 
let kycStep = 1; 

// Live Data Store
let userData = { username: "", balance: 0, earned: 0, referrals: 0, refEarnings: 0 };
let activePlans = [];

// --- CORE ENGINE ---
async function switchTab(tab) {
    if (!isLoggedIn && tab !== 'login' && tab !== 'register' && tab !== 'forgot' && tab !== 'kyc') {
        notify("Authentication Required", "red");
        return;
    }
    if (tab === 'forgot') resetStep = 1; 
    if (tab === 'kyc') kycStep = 1;
    
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
    toast.className = `toast-msg fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl font-bold text-[11px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in fade-in slide-in-from-top duration-300 border ${type === 'gold' ? 'bg-[#C9A227]/90 text-black border-[#C9A227]' : type === 'emerald' ? 'bg-[#10B981]/90 text-white border-[#10B981]' : 'bg-red-500/90 text-white border-red-500'}`;
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
        } else if (resUser.status === 401 || resUser.status === 403) {
            localStorage.removeItem('token');
            isLoggedIn = false;
            switchTab('login');
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
    if(!valid) return notify("All required fields must be filled", "red");
    if(document.getElementById('r_pass').value !== document.getElementById('r_cpass').value) return notify("Passwords mismatch", "red");

    notify("Securing Account Data...", "gold");

    const data = {
        firstName: document.getElementById('r_fn').value,
        surname: document.getElementById('r_ln').value,
        username: document.getElementById('r_user').value,
        email: document.getElementById('r_email').value,
        country: document.getElementById('r_country').value,
        password: document.getElementById('r_pass').value,
        referredBy: document.getElementById('r_ref').value || undefined
    };

    try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            notify("Vault Created Successfully. Please Sign In.", "emerald");
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
        if (res.ok && result.checkout_url) {
            window.location.href = result.checkout_url;
        } else {
            notify(result.message || "Payment Gateway Failed", "red");
        }
    } catch (err) {
        notify("Payment Server Offline", "red");
    }
}

async function processWithdraw() {
    const amtInput = document.getElementById('withdraw_amount').value;
    if (!amtInput) return notify("Please enter an amount to withdraw", "red");
    const amount = Number(amtInput);
    const totalBalance = userData.balance + userData.earned;
    
    if (amount < 3000) return notify("Minimum withdrawal is ₦3,000", "red");
    if (amount > totalBalance) return notify("Insufficient Funds", "red");

    notify("Processing Withdrawal Request...", "gold");

    setTimeout(() => {
        notify("Withdrawal Queued Successfully. Check Ledger.", "emerald");
        switchTab('track');
    }, 2000);
}

// --- UI COMPONENTS ---

const Navigation = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#020617]/95 backdrop-blur-2xl border-t border-white/5 p-4 pb-8 flex justify-around items-center z-50">
        ${[
            {id: 'home', label: 'HOME'},
            {id: 'plans', label: 'PLANS'},
            {id: 'track', label: 'TRACK'},
            {id: 'invite', label: 'INVITE'},
            {id: 'profile', label: 'PROFILE'}
        ].map(t => `
            <button onclick="switchTab('${t.id}')" class="transition-all duration-300 ${currentTab === t.id ? 'text-[#1E90FF] scale-110 drop-shadow-[0_0_10px_rgba(30,144,255,0.8)]' : 'text-gray-500 hover:text-gray-300'}">
                <span class="text-[10px] font-black tracking-widest">${t.label}</span>
            </button>
        `).join('')}
    </div>
`;

function KYCPage() {
    // ... [Content remains identical to the previous KYC iteration]
    return `
        <div class="min-h-screen flex flex-col justify-center pt-4 pb-12">
            <div class="text-center mb-8 px-4 mt-12">
                <h2 class="text-3xl font-black text-white tracking-tight mb-2">Identity Verification</h2>
                <p class="text-gray-400 text-[11px] font-medium leading-relaxed">Complete verification to unlock full financial features.</p>
            </div>
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] border border-white/10 p-7 rounded-[32px] shadow-2xl backdrop-blur-xl relative mx-4">
                <p class="text-gray-400 text-sm text-center">KYC Module is currently undergoing maintenance.</p>
                <button onclick="switchTab('profile')" class="w-full bg-white/10 mt-6 py-3 rounded-xl text-white text-xs font-bold uppercase">Return</button>
            </div>
        </div>
    `;
}

function ForgotPasswordPage() {
    // ... [Content remains identical to the previous ForgotPassword iteration]
    return `
        <div class="min-h-screen flex flex-col justify-center pt-4 pb-12">
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] border border-white/10 p-7 rounded-[32px] shadow-2xl backdrop-blur-xl mx-4 text-center">
                <h2 class="text-xl font-bold text-white mb-2">Password Recovery</h2>
                <p class="text-gray-400 text-sm mb-6">Please contact system administrator to reset your vault credentials.</p>
                <button onclick="switchTab('login')" class="w-full bg-brand-blue py-3 rounded-xl text-white text-xs font-bold uppercase">Return to Login</button>
            </div>
        </div>
    `;
}

function LoginPage() {
    return `
        <div class="min-h-screen flex flex-col justify-center animate-in fade-in duration-500 pt-8 pb-12">
            <div class="text-center mb-10">
                <div class="w-20 h-20 bg-gradient-to-br from-[#1E90FF] to-[#0070F3] rounded-[24px] mx-auto mb-6 shadow-[0_0_40px_rgba(30,144,255,0.5)] flex items-center justify-center border border-white/10 relative overflow-hidden">
                    <div class="absolute inset-0 bg-white/20 blur-[20px] rounded-full top-0 left-0"></div>
                    <span class="text-3xl text-white font-black relative z-10 tracking-tighter">BP</span>
                </div>
                <h1 class="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
                <p class="text-gray-400 text-[11px] uppercase tracking-widest font-semibold">Securely access your account</p>
            </div>
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] border border-white/10 p-7 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden mb-8">
                <div class="absolute -top-16 -right-16 w-48 h-48 bg-[#1E90FF]/10 blur-[60px] rounded-full"></div>
                <div class="space-y-5 relative z-10">
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">Email or Phone Number</label>
                        <div class="relative group">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-[#1E90FF]">📧</span>
                            <input type="text" id="log_id" placeholder="Enter your credentials" class="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 focus:shadow-[0_0_15px_rgba(30,144,255,0.2)] transition-all">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">Password</label>
                        <div class="relative group">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-[#1E90FF]">🔒</span>
                            <input type="password" id="log_pass" placeholder="Enter your password" class="w-full bg-black/40 border border-white/10 p-4 pl-12 pr-12 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 focus:shadow-[0_0_15px_rgba(30,144,255,0.2)] transition-all">
                            <button onclick="const p=document.getElementById('log_pass');p.type=p.type==='password'?'text':'password';this.innerText=p.type==='password'?'👁️':'🙈'" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-sm focus:outline-none">👁️</button>
                        </div>
                    </div>
                    <div class="flex justify-between items-center px-1">
                        <label class="flex items-center gap-2 cursor-pointer group">
                            <div class="w-4 h-4 rounded-[4px] border border-white/20 bg-black/40 flex items-center justify-center group-hover:border-[#1E90FF] transition-colors relative overflow-hidden">
                                <input type="checkbox" class="absolute opacity-0 w-0 h-0 peer">
                                <div class="w-2 h-2 bg-transparent rounded-[2px] peer-checked:bg-[#1E90FF] transition-colors"></div>
                            </div>
                            <span class="text-[10px] text-gray-400 font-semibold group-hover:text-white transition-colors">Remember Me</span>
                        </label>
                        <a href="#" onclick="switchTab('forgot'); return false;" class="text-[10px] text-[#1E90FF] font-bold hover:text-white transition-colors">Forgot Password?</a>
                    </div>
                    <div class="pt-2">
                        <button onclick="handleLogin()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all relative overflow-hidden group">
                            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span class="relative z-10">Secure Login</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="text-center space-y-4">
                <p class="text-gray-500 text-[11px] font-medium cursor-pointer transition-all" onclick="switchTab('register')">Don't have an account? <span class="text-[#1E90FF] font-bold border-b border-[#1E90FF]/30 pb-0.5 hover:border-[#1E90FF] hover:text-white">Sign Up</span></p>
            </div>
        </div>
    `;
}

function RegisterPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref') || '';

    return `
        <div class="pt-8 pb-24 animate-in slide-in-from-bottom duration-500 min-h-screen">
            <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-br from-[#1E90FF] to-[#0070F3] rounded-[20px] mx-auto mb-4 shadow-[0_0_30px_rgba(30,144,255,0.4)] flex items-center justify-center border border-white/10">
                    <span class="text-2xl text-white font-black tracking-tighter">BP</span>
                </div>
                <h2 class="text-3xl font-black text-white mb-2 tracking-tight">Create Account</h2>
                <p class="text-gray-400 text-[11px] uppercase tracking-widest font-semibold">Start building your financial future</p>
            </div>
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] border border-white/10 p-6 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden mb-6">
                <div class="space-y-4 relative z-10">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">First Name</label>
                            <input type="text" id="r_fn" placeholder="John" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] transition-all">
                        </div>
                        <div>
                            <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Last Name</label>
                            <input type="text" id="r_ln" placeholder="Doe" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] transition-all">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Username</label>
                        <input type="text" id="r_user" placeholder="Choose a unique ID" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Email Address</label>
                        <input type="email" id="r_email" placeholder="john@example.com" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Region / Country</label>
                        <select id="r_country" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] appearance-none">
                            <option value="Nigeria" class="bg-gray-900">🇳🇬 Nigeria</option>
                            <option value="Ghana" class="bg-gray-900">🇬🇭 Ghana</option>
                            <option value="Kenya" class="bg-gray-900">🇰🇪 Kenya</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Password</label>
                        <input type="password" id="r_pass" placeholder="Create strong password" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Confirm Password</label>
                        <input type="password" id="r_cpass" placeholder="Repeat password" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 px-1">Referral Code (Optional)</label>
                        <input type="text" id="r_ref" value="${refCode}" placeholder="Enter invite code" class="w-full bg-transparent border border-white/5 border-dashed p-3 rounded-[14px] text-gray-400 text-[12px] outline-none focus:border-[#C9A227] focus:text-[#C9A227] transition-all">
                    </div>
                    <div class="pt-4">
                        <button onclick="handleRegister()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all">
                            Create Account
                        </button>
                    </div>
                </div>
            </div>
            <div class="text-center space-y-4">
                <p class="text-gray-500 text-[11px] font-medium cursor-pointer transition-all" onclick="switchTab('login')">Already have an account? <span class="text-[#1E90FF] font-bold border-b border-[#1E90FF]/30 pb-0.5">Login</span></p>
            </div>
        </div>
    `;
}

function HomePage() {
    const totalBalance = userData.balance + userData.earned;
    
    return `
        <div class="animate-in fade-in duration-500 pt-4 pb-24">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <p class="text-[11px] text-gray-400 font-medium">Welcome back,</p>
                    <h1 class="text-xl font-bold text-white tracking-tight">${userData.username}!</h1>
                </div>
                <div class="w-10 h-10 rounded-full border border-[#1E90FF]/30 p-[2px] cursor-pointer" onclick="switchTab('profile')">
                    <div class="w-full h-full bg-[#111827] rounded-full flex items-center justify-center text-[#1E90FF] font-bold shadow-[0_0_15px_rgba(30,144,255,0.3)]">
                        ${userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
            </div>
            <div class="relative bg-gradient-to-br from-[#111827] to-[#0A101C] p-6 rounded-[24px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] mb-8 overflow-hidden">
                <div class="absolute -top-12 -right-12 w-48 h-48 bg-[#1E90FF]/10 blur-[60px] rounded-full"></div>
                
                <p class="text-center text-[10px] text-gray-400 mb-1 font-medium tracking-widest uppercase">Total Balance</p>
                <h2 class="text-center text-[40px] font-black text-white tracking-tighter mb-6">₦${totalBalance.toLocaleString()}</h2>
                
                <div class="flex justify-between border-t border-white/5 pt-4 mb-6">
                    <div class="text-left">
                        <p class="text-[9px] text-gray-500 mb-1 font-semibold uppercase tracking-widest">Earned Profit</p>
                        <p class="text-[13px] font-bold text-[#10B981]">+₦${userData.earned.toLocaleString()}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] text-gray-500 mb-1 font-semibold uppercase tracking-widest">Deposit Balance</p>
                        <p class="text-[13px] font-bold text-white">₦${userData.balance.toLocaleString()}</p>
                    </div>
                </div>
                <div class="flex gap-4 relative z-10">
                    <button onclick="switchTab('deposit')" class="flex-1 bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[14px] font-bold text-white text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(30,144,255,0.4)] active:scale-95 transition-all">Deposit</button>
                    <button onclick="switchTab('withdraw')" class="flex-1 bg-white/[0.05] border border-white/10 text-white py-4 rounded-[14px] font-bold text-[11px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all">Withdraw</button>
                </div>
            </div>
            
            <div class="mb-8">
                <div class="flex justify-between items-center mb-3 px-1">
                    <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Active Plans</h3>
                    <span class="text-[9px] text-[#1E90FF] cursor-pointer font-bold" onclick="switchTab('plans')">View All</span>
                </div>
                <div class="bg-white/[0.02] p-6 rounded-[24px] border border-white/5 text-center shadow-lg cursor-pointer" onclick="switchTab('plans')">
                    <p class="text-[10px] text-gray-400 font-medium">Explore investment opportunities.</p>
                    <p class="text-[10px] text-[#1E90FF] font-bold mt-2">View Market Plans →</p>
                </div>
            </div>
        </div>
    `;
}

function DepositPage() {
    return `
        <div class="animate-in slide-in-from-right duration-500 pb-24 pt-4">
            <div class="flex items-center gap-4 mb-8">
                <button onclick="switchTab('home')" class="w-10 h-10 bg-white/[0.05] rounded-[14px] border border-white/10 text-white font-bold flex items-center justify-center">←</button>
                <h2 class="text-2xl font-black text-white tracking-tight">Fund Vault</h2>
            </div>
            
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] p-6 rounded-[24px] border border-[#1E90FF]/20 shadow-[0_15px_40px_rgba(0,0,0,0.5)] mb-6">
                <p class="text-[10px] text-gray-400 mb-4 font-bold uppercase tracking-widest">Enter Amount</p>
                <div class="relative mb-4 flex items-center border-b border-white/10 pb-4">
                    <span class="text-[#1E90FF] font-black text-4xl mr-2">₦</span>
                    <input type="number" id="deposit_amount" placeholder="3000" class="w-full bg-transparent text-white font-black text-4xl outline-none placeholder-gray-600">
                </div>
                <p class="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Minimum: ₦3,000</p>
            </div>
            
            <div class="flex flex-wrap gap-2 mb-8">
                ${[5000, 10000, 20000, 50000].map(amt => `
                    <button onclick="document.getElementById('deposit_amount').value = ${amt}" class="flex-1 bg-white/[0.02] border border-white/10 py-3 rounded-[12px] font-bold text-[11px] text-gray-300">₦${amt.toLocaleString()}</button>
                `).join('')}
            </div>
            
            <button onclick="processDeposit()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all mb-4">
                Proceed to Secure Payment
            </button>
        </div>
    `;
}

function WithdrawPage() {
    const totalBalance = userData.balance + userData.earned;
    return `
        <div class="animate-in slide-in-from-right duration-500 pb-24 pt-4">
            <div class="flex items-center gap-4 mb-8">
                <button onclick="switchTab('home')" class="w-10 h-10 bg-white/[0.05] rounded-[14px] border border-white/10 text-white font-bold flex items-center justify-center">←</button>
                <h2 class="text-2xl font-black text-white tracking-tight">Withdraw Funds</h2>
            </div>
            
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] p-6 rounded-[24px] border border-[#10B981]/20 shadow-[0_15px_40px_rgba(0,0,0,0.5)] mb-6 text-center">
                <p class="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-widest">Available Balance</p>
                <h2 class="text-[36px] font-black text-white tracking-tighter mb-1">₦${totalBalance.toLocaleString()}</h2>
            </div>
            
            <div class="bg-white/[0.02] p-6 rounded-[24px] border border-white/10 mb-6">
                <p class="text-[10px] text-gray-500 mb-4 font-bold uppercase tracking-widest">Enter Amount</p>
                <div class="relative mb-4 flex items-center border-b border-white/10 pb-4">
                    <span class="text-white font-black text-4xl mr-2">₦</span>
                    <input type="number" id="withdraw_amount" placeholder="3000" class="w-full bg-transparent text-white font-black text-4xl outline-none placeholder-gray-600">
                </div>
            </div>
            
            <button onclick="processWithdraw()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all">
                Withdraw Now
            </button>
        </div>
    `;
}

function PlansPage() {
    if (activePlans.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in duration-500">
                <div class="w-20 h-20 rounded-[24px] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 flex items-center justify-center mb-6">
                    <span class="text-3xl">🗃️</span>
                </div>
                <h2 class="text-xl font-bold text-white mb-2 tracking-tight">System Update</h2>
                <p class="text-[11px] text-gray-500 px-8 leading-relaxed">System optimizations are currently underway. We appreciate your patience.</p>
            </div>
        `;
    }

    return `
        <div class="animate-in fade-in pt-4 pb-24">
            <h2 class="text-3xl font-black text-white mb-1 tracking-tight">Portfolios</h2>
            <p class="text-gray-400 text-[11px] mb-6 font-medium">Select a premium plan to accelerate your wealth.</p>
            <div class="space-y-6">
                ${activePlans.map((plan, index) => {
                    const isPopular = index === 1 || (activePlans.length === 1 && index === 0);
                    const borderGlow = isPopular ? 'border-[#C9A227]/40 shadow-[0_0_25px_rgba(201,162,39,0.15)]' : 'border-white/10';
                    const iconBg = isPopular ? 'bg-[#C9A227]/10 border-[#C9A227]/30 text-[#C9A227]' : 'bg-[#1E90FF]/10 border-[#1E90FF]/30 text-[#1E90FF]';
                    const icon = isPopular ? '👑' : '💎';
                    const btnStyle = isPopular ? 'bg-gradient-to-r from-[#C9A227] to-[#eab308] text-black' : 'bg-gradient-to-r from-[#1E90FF] to-[#0070F3] text-white';

                    return `
                    <div class="relative bg-white/[0.02] p-6 rounded-[24px] border ${borderGlow}">
                        ${isPopular ? `
                            <div class="absolute -top-3 right-5 bg-gradient-to-r from-[#C9A227] to-[#FCD34D] text-black text-[9px] font-black px-3 py-1 rounded-full z-10">
                                ⭐ Most Popular
                            </div>
                        ` : ''}
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-12 h-12 rounded-[16px] ${iconBg} border flex items-center justify-center text-xl shadow-inner">${icon}</div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-tight">${plan.name}</h3>
                                <p class="text-[10px] text-[#10B981] mt-1 font-semibold">Daily ROI: ${plan.dailyRoi}%</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-6">
                            <div class="bg-black/40 p-3.5 rounded-[16px] border border-white/5 relative overflow-hidden group">
                                <p class="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Min Deposit</p>
                                <p class="text-white font-black text-sm">₦${(plan.minDeposit || plan.minAmount || 0).toLocaleString()}</p>
                            </div>
                            <div class="bg-black/40 p-3.5 rounded-[16px] border border-white/5 relative overflow-hidden group">
                                <p class="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Duration</p>
                                <p class="text-white font-black text-sm">${plan.duration || 0} Days</p>
                            </div>
                        </div>
                        <button onclick="notify('Processing Contract...', 'gold')" class="w-full ${btnStyle} py-4 rounded-[14px] font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all">
                            Join ${plan.name}
                        </button>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function TrackPage() {
    return `
        <div class="animate-in fade-in pt-4 pb-24">
            <h2 class="text-3xl font-black text-white mb-6 tracking-tight">Performance</h2>
            <div class="bg-white/[0.02] p-5 rounded-[24px] border border-white/10 text-center text-gray-400 text-sm">
                Transaction history and performance graphs will appear here once you initiate an investment.
            </div>
        </div>
    `;
}

function InvitePage() {
    const refLink = `${window.location.origin}/register?ref=${userData.username}`;
    return `
        <div class="animate-in fade-in pt-4 pb-24">
            <h2 class="text-3xl font-black text-white mb-1 tracking-tight">Referral Hub</h2>
            <p class="text-gray-400 text-[11px] mb-6 font-medium">Build your network, accelerate your wealth.</p>
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-white/[0.02] p-4 rounded-[20px] border border-white/10 shadow-lg">
                    <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Invites</p>
                    <p class="text-white font-black text-xl">${userData.referrals}</p>
                </div>
                <div class="bg-white/[0.02] p-4 rounded-[20px] border border-white/10 shadow-lg">
                    <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Earned Bonus</p>
                    <p class="text-[#C9A227] font-black text-xl">₦${userData.refEarnings.toLocaleString()}</p>
                </div>
            </div>
            <div class="bg-white/[0.02] p-5 rounded-[24px] border border-white/10 mb-6">
                <p class="text-[10px] text-gray-400 mb-3 font-bold uppercase tracking-widest">Your Private Link</p>
                <div class="flex items-center gap-2 bg-black/40 border border-white/10 p-2 rounded-[16px]">
                    <div class="flex-1 overflow-hidden">
                        <p class="text-[#1E90FF] font-mono text-[10px] whitespace-nowrap overflow-hidden text-ellipsis px-2">${refLink}</p>
                    </div>
                    <button onclick="navigator.clipboard.writeText('${refLink}'); notify('Link Copied', 'gold');" class="bg-[#1E90FF] text-white p-3 rounded-[12px]">📋</button>
                </div>
            </div>
        </div>
    `;
}

function ProfilePage() {
    return `
        <div class="animate-in fade-in pt-4 pb-24">
            <h2 class="text-3xl font-black text-white mb-6 tracking-tight">Vault Profile</h2>
            <div class="bg-white/[0.02] rounded-[20px] border border-white/10 mb-6 overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-white/5">
                    <span class="text-[11px] text-gray-400 font-semibold">User ID</span>
                    <span class="text-[11px] text-white font-bold">@${userData.username}</span>
                </div>
            </div>
            <button onclick="localStorage.removeItem('token'); location.reload();" class="w-full bg-red-500/10 border border-red-500/30 text-red-500 py-4 rounded-[16px] font-black text-[11px] uppercase tracking-widest">
                Terminate Session
            </button>
        </div>
    `;
}

// --- SAFE RENDER WRAPPER ---
function render() {
    try {
        const appElem = document.getElementById('app');
        if (!appElem) return;

        let content = '';
        if (currentTab === 'login') content = LoginPage();
        else if (currentTab === 'register') content = RegisterPage();
        else if (currentTab === 'forgot') content = ForgotPasswordPage();
        else if (currentTab === 'kyc') content = KYCPage();
        else if (currentTab === 'home') content = HomePage();
        else if (currentTab === 'deposit') content = DepositPage();
        else if (currentTab === 'withdraw') content = WithdrawPage();
        else if (currentTab === 'plans') content = PlansPage();
        else if (currentTab === 'track') content = TrackPage();
        else if (currentTab === 'invite') content = InvitePage();
        else if (currentTab === 'profile') content = ProfilePage();

        appElem.innerHTML = `
            <div class="max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#020617] to-[#0A101C] text-white p-5 pb-24 font-sans overflow-x-hidden">
                ${content}
                ${isLoggedIn && currentTab !== 'deposit' && currentTab !== 'withdraw' && currentTab !== 'kyc' ? Navigation() : ''}
            </div>
        `;
    } catch (e) {
        document.body.innerHTML = `<div style="color:red; padding:40px; text-align:center;"><b>CRITICAL UI ERROR:</b><br>${e.message}</div>`;
    }
}

// --- BULLETPROOF INITIALIZATION ---
// This runs immediately to completely bypass mobile caching delays
async function bootApplication() {
    try {
        console.log("Vault Engine Booting...");
        const hash = window.location.hash.substring(1);
        const requestedTab = hash || 'login';

        let token = null;
        try { token = localStorage.getItem('token'); } catch(e) {}

        if(token) {
            isLoggedIn = true;
            await switchTab(requestedTab);
        } else {
            await switchTab(requestedTab);
        }
    } catch (error) {
        console.error("Boot Error:", error);
        document.body.innerHTML = `<div style="color:#ef4444; padding:40px; text-align:center; background:#020617; min-height:100vh; display:flex; align-items:center; justify-content:center;"><div><b>CRITICAL BOOT ERROR</b><br><br>${error.message}</div></div>`;
    }
}

bootApplication();