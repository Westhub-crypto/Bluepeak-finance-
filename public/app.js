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
    };

    try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            notify("Vault Created Successfully. Please Sign In.");
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

async function processWithdraw() {
    const amtInput = document.getElementById('withdraw_amount').value;
    if (!amtInput) return notify("Please enter an amount to withdraw", "red");
    const amount = Number(amtInput);
    const totalBalance = userData.balance + userData.earned;
    
    if (amount < 3000) return notify("Minimum withdrawal is ₦3,000", "red");
    if (amount > totalBalance) return notify("Insufficient Funds", "red");

    notify("Processing Withdrawal Request...", "gold");

    setTimeout(() => {
        notify("Withdrawal Queued Successfully. Check Ledger.", "gold");
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
    let content = '';

    if (kycStep === 1) {
        content = `
            <div class="animate-in slide-in-from-right duration-300">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Step 1 of 3: Personal Info</p>
                <div class="space-y-5 mb-8">
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">Full Legal Name</label>
                        <input type="text" id="kyc_name" placeholder="As it appears on your ID" value="${userData.username ? userData.username + ' Doe' : ''}" class="w-full bg-black/40 border border-white/10 p-4 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all">
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">Date of Birth</label>
                        <div class="relative">
                            <input type="date" id="kyc_dob" class="w-full bg-black/40 border border-white/10 p-4 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all [color-scheme:dark]">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">Residential Address</label>
                        <textarea id="kyc_address" placeholder="Enter your full home address" rows="3" class="w-full bg-black/40 border border-white/10 p-4 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all resize-none"></textarea>
                    </div>
                </div>
                <button onclick="
                    if(!document.getElementById('kyc_name').value || !document.getElementById('kyc_dob').value || !document.getElementById('kyc_address').value) return notify('Please complete all fields', 'red');
                    kycStep = 2; render();
                " class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all relative overflow-hidden group">
                    <span class="relative z-10">Continue to ID Upload</span>
                </button>
            </div>
        `;
    } else if (kycStep === 2) {
        content = `
            <div class="animate-in slide-in-from-right duration-300">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Step 2 of 3: Document Upload</p>
                <div class="space-y-5 mb-8">
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">Select ID Type</label>
                        <select id="kyc_id_type" class="w-full bg-black/40 border border-white/10 p-4 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all appearance-none">
                            <option value="national" class="bg-gray-900">National ID Card</option>
                            <option value="driver" class="bg-gray-900">Driver's License</option>
                            <option value="passport" class="bg-gray-900">International Passport</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div onclick="notify('Camera interface initialized', 'gold')" class="bg-white/[0.02] border-2 border-dashed border-white/20 rounded-[16px] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#1E90FF] hover:bg-[#1E90FF]/5 transition-all group">
                            <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#1E90FF] text-xl mb-3 group-hover:scale-110 transition-transform">📸</div>
                            <span class="text-[10px] font-bold text-white uppercase tracking-widest">Front Side</span>
                            <span class="text-[8px] text-gray-500 mt-1">Tap to capture</span>
                        </div>
                        <div onclick="notify('Camera interface initialized', 'gold')" class="bg-white/[0.02] border-2 border-dashed border-white/20 rounded-[16px] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#1E90FF] hover:bg-[#1E90FF]/5 transition-all group">
                            <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#1E90FF] text-xl mb-3 group-hover:scale-110 transition-transform">📸</div>
                            <span class="text-[10px] font-bold text-white uppercase tracking-widest">Back Side</span>
                            <span class="text-[8px] text-gray-500 mt-1">Tap to capture</span>
                        </div>
                    </div>
                </div>
                <button onclick="kycStep = 3; render();" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all relative overflow-hidden group">
                    <span class="relative z-10">Continue to Biometrics</span>
                </button>
            </div>
        `;
    } else if (kycStep === 3) {
        content = `
            <div class="animate-in slide-in-from-right duration-300 flex flex-col items-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 w-full text-left">Step 3 of 3: Biometric Selfie</p>
                <div class="relative w-48 h-64 mb-8">
                    <div class="absolute inset-0 rounded-[100px] border-4 border-dashed border-[#1E90FF]/50 animate-[spin_10s_linear_infinite]"></div>
                    <div class="absolute inset-2 bg-black/40 rounded-[92px] border border-[#1E90FF] overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(30,144,255,0.2)]">
                        <div class="text-[60px] opacity-20">👤</div>
                    </div>
                    <div class="absolute inset-2 overflow-hidden rounded-[92px]">
                        <div class="w-full h-1 bg-[#1E90FF] shadow-[0_0_15px_#1E90FF] absolute top-0 left-0 animate-[ping-pong_3s_ease-in-out_infinite]" style="animation: scan 2s linear infinite alternate;"></div>
                    </div>
                </div>
                <style>
                    @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
                </style>
                <p class="text-center text-[12px] text-white font-medium mb-1">Ensure your face is clear and well-lit.</p>
                <p class="text-center text-[9px] text-gray-500 mb-8">Remove glasses, hats, or face coverings.</p>
                <div class="w-full flex gap-3">
                    <button onclick="notify('Live camera accessed', 'gold')" class="w-14 h-14 rounded-[16px] bg-white/[0.05] border border-white/10 flex items-center justify-center text-xl hover:bg-white/10 active:scale-95 transition-all">🔄</button>
                    <button onclick="
                        kycStep = 4; render(); notify('Submitting encrypted data...', 'gold');
                    " class="flex-1 bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all">
                        Capture & Submit
                    </button>
                </div>
            </div>
        `;
    } else if (kycStep === 4) {
        content = `
            <div class="animate-in zoom-in duration-500 flex flex-col items-center text-center py-6">
                <div class="w-24 h-24 bg-[#C9A227]/10 rounded-full border-2 border-[#C9A227]/30 flex items-center justify-center mb-6 relative">
                    <div class="absolute inset-0 rounded-full border-t-2 border-[#C9A227] animate-spin"></div>
                    <span class="text-4xl text-[#C9A227]">⏳</span>
                </div>
                <h2 class="text-2xl font-black text-white tracking-tight mb-2">Pending Review</h2>
                <div class="bg-[#C9A227]/10 text-[#C9A227] px-3 py-1 rounded-full border border-[#C9A227]/20 text-[9px] font-bold uppercase tracking-widest mb-6">Status: Processing</div>
                <p class="text-gray-400 text-[11px] leading-relaxed max-w-[85%] mb-8">Your identity documents have been securely uploaded. Our compliance team is verifying your data. Verification typically takes <span class="text-white font-bold">5 minutes – 24 hours</span>.</p>
                <button onclick="switchTab('profile')" class="w-full bg-white/[0.05] border border-white/10 text-white py-4 rounded-[16px] font-bold text-[11px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all shadow-lg">
                    Return to Profile
                </button>
            </div>
        `;
    }

    return `
        <div class="min-h-screen flex flex-col justify-center pt-4 pb-12">
            <div class="w-full max-w-sm mx-auto mb-6 flex items-center justify-between px-2">
                <button onclick="if(kycStep > 1 && kycStep < 4) { kycStep--; render(); } else { switchTab('profile'); }" class="w-10 h-10 bg-white/[0.05] rounded-[14px] border border-white/10 text-white font-bold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shadow-lg">←</button>
                ${kycStep < 4 ? `
                <div class="flex gap-2">
                    <div class="w-8 h-1 rounded-full ${kycStep >= 1 ? 'bg-[#1E90FF] shadow-[0_0_8px_rgba(30,144,255,0.5)]' : 'bg-white/10'} transition-all duration-300"></div>
                    <div class="w-8 h-1 rounded-full ${kycStep >= 2 ? 'bg-[#1E90FF] shadow-[0_0_8px_rgba(30,144,255,0.5)]' : 'bg-white/10'} transition-all duration-300"></div>
                    <div class="w-8 h-1 rounded-full ${kycStep >= 3 ? 'bg-[#1E90FF] shadow-[0_0_8px_rgba(30,144,255,0.5)]' : 'bg-white/10'} transition-all duration-300"></div>
                </div>
                ` : '<div></div>'}
            </div>
            ${kycStep < 4 ? `
            <div class="text-center mb-8 px-4">
                <h2 class="text-3xl font-black text-white tracking-tight mb-2">Identity Verification</h2>
                <p class="text-gray-400 text-[11px] font-medium leading-relaxed">Complete verification to unlock full financial features and secure your account.</p>
            </div>
            ` : ''}
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] border border-white/10 p-7 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden mb-8">
                <div class="absolute -top-16 -right-16 w-48 h-48 bg-[#1E90FF]/10 blur-[60px] rounded-full pointer-events-none"></div>
                <div class="relative z-10">
                    ${content}
                </div>
            </div>
            <div class="bg-black/30 rounded-[16px] p-4 border border-white/5 flex justify-around items-center mb-8 mx-2 shadow-inner">
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#10B981] text-[16px] mb-1 font-bold">✓</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Your data is<br>सुरक्षित (secure)</span>
                </div>
                <div class="w-px h-6 bg-white/10"></div>
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#1E90FF] text-[16px] mb-1">🔐</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Encrypted &<br>Protected</span>
                </div>
                <div class="w-px h-6 bg-white/10"></div>
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#C9A227] text-[16px] mb-1">🛡️</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Used only<br>for verification</span>
                </div>
            </div>
        </div>
    `;
}

function ForgotPasswordPage() {
    let content = '';
    
    if (resetStep === 1) {
        content = `
            <div class="animate-in slide-in-from-right duration-300">
                <h2 class="text-3xl font-black text-white tracking-tight mb-2">Reset Password</h2>
                <p class="text-gray-400 text-[11px] mb-8 font-medium">Enter your email or phone number to receive a secure verification code.</p>
                <div class="mb-6">
                    <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">Email or Phone</label>
                    <div class="relative group">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-[#1E90FF]">📧</span>
                        <input type="text" id="reset_contact" placeholder="Registered Email/Phone" class="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all">
                    </div>
                </div>
                <button onclick="
                    if(!document.getElementById('reset_contact').value) return notify('Please enter email or phone', 'red');
                    resetStep = 2; render(); notify('Secure OTP sent successfully', 'gold');
                " class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all relative overflow-hidden group">
                    <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span class="relative z-10">Send Code</span>
                </button>
            </div>
        `;
    } else if (resetStep === 2) {
        content = `
            <div class="animate-in slide-in-from-right duration-300">
                <h2 class="text-3xl font-black text-white tracking-tight mb-2">Verify Code</h2>
                <p class="text-gray-400 text-[11px] mb-8 font-medium">Enter the 6-digit secure code sent to your device.</p>
                <div class="flex justify-between gap-2 mb-6" id="otp_container">
                    ${[1,2,3,4,5,6].map((i) => `
                        <input type="text" maxlength="1" class="w-12 h-14 bg-black/40 border border-white/10 rounded-[12px] text-center text-white text-2xl font-black outline-none focus:border-[#1E90FF] focus:shadow-[0_0_15px_rgba(30,144,255,0.3)] transition-all"
                        onkeyup="if(this.value.length === 1) { this.nextElementSibling?.focus(); }"
                        onkeydown="if(event.key === 'Backspace' && !this.value) { this.previousElementSibling?.focus(); }">
                    `).join('')}
                </div>
                <div class="flex justify-between items-center mb-8 px-1">
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Resend code in <span class="text-[#1E90FF]">30s</span></p>
                    <button onclick="notify('A new code has been sent', 'gold')" class="text-[10px] text-gray-500 font-bold hover:text-white transition-colors">Resend</button>
                </div>
                <button onclick="
                    let code = '';
                    document.querySelectorAll('#otp_container input').forEach(inp => code += inp.value);
                    if(code.length < 6) return notify('Enter full 6-digit code', 'red');
                    resetStep = 3; render(); notify('Identity Verified', 'gold');
                " class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all relative overflow-hidden group">
                    <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span class="relative z-10">Verify Code</span>
                </button>
            </div>
        `;
    } else if (resetStep === 3) {
        content = `
            <div class="animate-in slide-in-from-right duration-300">
                <h2 class="text-3xl font-black text-white tracking-tight mb-2">Create Password</h2>
                <p class="text-gray-400 text-[11px] mb-8 font-medium">Protect your vault with a strong new password.</p>
                <div class="space-y-5 mb-8">
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">New Password</label>
                        <div class="relative">
                            <input type="password" id="reset_new_pass" placeholder="Create strong password" class="w-full bg-black/40 border border-white/10 p-4 pr-12 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all"
                            oninput="
                                const val = this.value.length;
                                const bar = document.getElementById('reset_strength');
                                if(val === 0) bar.style.width = '0%';
                                else if(val < 6) { bar.style.width = '33%'; bar.className = 'h-full bg-red-500 rounded-full transition-all duration-300'; }
                                else if(val < 9) { bar.style.width = '66%'; bar.className = 'h-full bg-[#F59E0B] rounded-full transition-all duration-300'; }
                                else { bar.style.width = '100%'; bar.className = 'h-full bg-[#10B981] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]'; }
                            ">
                            <button onclick="const p=document.getElementById('reset_new_pass');p.type=p.type==='password'?'text':'password';this.innerText=p.type==='password'?'👁️':'🙈'" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-sm focus:outline-none">👁️</button>
                        </div>
                        <div class="h-1 w-full bg-black/50 rounded-full mt-2 overflow-hidden flex">
                            <div id="reset_strength" class="h-full w-0 transition-all duration-300"></div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 px-1">Confirm Password</label>
                        <div class="relative">
                            <input type="password" id="reset_confirm_pass" placeholder="Repeat new password" class="w-full bg-black/40 border border-white/10 p-4 pr-12 rounded-[16px] text-white text-[13px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all">
                            <button onclick="const p=document.getElementById('reset_confirm_pass');p.type=p.type==='password'?'text':'password';this.innerText=p.type==='password'?'👁️':'🙈'" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-sm focus:outline-none">👁️</button>
                        </div>
                    </div>
                </div>
                <button onclick="
                    const p1 = document.getElementById('reset_new_pass').value;
                    const p2 = document.getElementById('reset_confirm_pass').value;
                    if(!p1 || !p2) return notify('Please fill all fields', 'red');
                    if(p1 !== p2) return notify('Passwords do not match', 'red');
                    notify('Vault Secured. Redirecting to login...', 'gold');
                    setTimeout(() => { switchTab('login'); }, 1500);
                " class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all relative overflow-hidden group">
                    <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span class="relative z-10">Reset Password</span>
                </button>
            </div>
        `;
    }

    return `
        <div class="min-h-screen flex flex-col justify-center pt-4 pb-12">
            <div class="w-full max-w-sm mx-auto mb-6 flex items-center justify-between px-2">
                <button onclick="if(resetStep > 1) { resetStep--; render(); } else { switchTab('login'); }" class="w-10 h-10 bg-white/[0.05] rounded-[14px] border border-white/10 text-white font-bold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shadow-lg">←</button>
                <div class="flex gap-2">
                    <div class="w-8 h-1 rounded-full ${resetStep >= 1 ? 'bg-[#1E90FF] shadow-[0_0_8px_rgba(30,144,255,0.5)]' : 'bg-white/10'} transition-all duration-300"></div>
                    <div class="w-8 h-1 rounded-full ${resetStep >= 2 ? 'bg-[#1E90FF] shadow-[0_0_8px_rgba(30,144,255,0.5)]' : 'bg-white/10'} transition-all duration-300"></div>
                    <div class="w-8 h-1 rounded-full ${resetStep >= 3 ? 'bg-[#1E90FF] shadow-[0_0_8px_rgba(30,144,255,0.5)]' : 'bg-white/10'} transition-all duration-300"></div>
                </div>
            </div>
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] border border-white/10 p-7 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden mb-8">
                <div class="absolute -top-16 -right-16 w-48 h-48 bg-[#1E90FF]/10 blur-[60px] rounded-full"></div>
                <div class="relative z-10">
                    ${content}
                </div>
            </div>
            <div class="bg-black/30 rounded-[16px] p-4 border border-white/5 flex justify-around items-center mb-8 mx-2 shadow-inner">
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#10B981] text-[16px] mb-1 font-bold">✓</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Secure<br>Verification</span>
                </div>
                <div class="w-px h-6 bg-white/10"></div>
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#1E90FF] text-[16px] mb-1">🔐</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Encrypted<br>Process</span>
                </div>
                <div class="w-px h-6 bg-white/10"></div>
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#C9A227] text-[16px] mb-1">🛡️</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Protected<br>Recovery</span>
                </div>
            </div>
            <p class="text-center text-gray-500 text-[11px] font-medium cursor-pointer transition-all hover:text-white" onclick="switchTab('login')">Return to <span class="text-[#1E90FF] font-bold border-b border-[#1E90FF]/30 pb-0.5">Login</span></p>
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
                        <p class="text-center text-[9px] text-[#10B981] font-bold tracking-[0.2em] uppercase mt-4 flex justify-center items-center gap-1.5">
                            <span class="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                            Fast • Secure Access
                        </p>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-center gap-4 mb-10">
                <button onclick="notify('OTP feature currently in maintenance', 'red')" class="bg-white/[0.03] border border-white/10 px-5 py-3.5 rounded-[14px] text-[10px] text-gray-300 font-bold uppercase tracking-widest hover:bg-white/[0.05] hover:text-white active:scale-95 transition-all shadow-lg flex items-center gap-2">
                    <span>📱</span> Login with OTP
                </button>
                <button onclick="notify('Biometrics authenticated successfully!', 'gold')" class="w-12 h-12 rounded-[14px] bg-[#1E90FF]/10 border border-[#1E90FF]/30 flex items-center justify-center text-[#1E90FF] text-xl shadow-[0_0_15px_rgba(30,144,255,0.2)] hover:bg-[#1E90FF]/20 active:scale-95 transition-all">
                    🖐️
                </button>
            </div>
            <div class="bg-black/30 rounded-[16px] p-4 border border-white/5 flex justify-around items-center mb-8 mx-2 shadow-inner">
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#10B981] text-[16px] mb-1 font-bold">✓</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Secure<br>Login</span>
                </div>
                <div class="w-px h-6 bg-white/10"></div>
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#1E90FF] text-[16px] mb-1">🔐</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Encrypted<br>Data</span>
                </div>
                <div class="w-px h-6 bg-white/10"></div>
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#C9A227] text-[16px] mb-1">🛡️</span>
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Protected<br>Account</span>
                </div>
            </div>
            <div class="text-center space-y-4">
                <p class="text-gray-500 text-[11px] font-medium cursor-pointer transition-all" onclick="switchTab('register')">Don't have an account? <span class="text-[#1E90FF] font-bold border-b border-[#1E90FF]/30 pb-0.5 hover:border-[#1E90FF] hover:text-white">Sign Up</span></p>
                <p class="text-gray-600 text-[8px] uppercase tracking-widest max-w-[80%] mx-auto leading-relaxed mt-4">By continuing, you agree to BluePeak's <a href="#" class="text-gray-500 hover:text-white transition-colors">Terms</a> & <a href="#" class="text-gray-500 hover:text-white transition-colors">Privacy Policy</a></p>
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
            <div class="flex gap-3 mb-6">
                <button onclick="notify('Connecting to Google...', 'gold')" class="flex-1 bg-white/[0.03] border border-white/10 py-3 rounded-[16px] text-[11px] text-white font-bold flex items-center justify-center gap-2 hover:bg-white/[0.06] active:scale-95 transition-all">
                    <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                </button>
                <button onclick="notify('Connecting to Apple...', 'gold')" class="flex-1 bg-white/[0.03] border border-white/10 py-3 rounded-[16px] text-[11px] text-white font-bold flex items-center justify-center gap-2 hover:bg-white/[0.06] active:scale-95 transition-all">
                    <svg class="w-4 h-4" fill="white" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.05 2.95.72 3.94 1.84-3.46 2.06-2.89 6.67.62 8.09-.76 1.25-1.76 2.5-3.21 3.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.31-1.8 4.31-3.74 4.25z"/></svg>
                    Apple
                </button>
            </div>
            <div class="flex items-center gap-3 mb-6 opacity-60">
                <div class="flex-1 h-px bg-white/10"></div>
                <span class="text-[9px] font-bold text-white uppercase tracking-widest">Or Register Manually</span>
                <div class="flex-1 h-px bg-white/10"></div>
            </div>
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] border border-white/10 p-6 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden mb-6">
                <div class="absolute -top-16 -left-16 w-40 h-40 bg-[#1E90FF]/10 blur-[50px] rounded-full"></div>
                <div class="space-y-4 relative z-10">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">First Name</label>
                            <input type="text" id="r_fn" placeholder="John" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all">
                        </div>
                        <div>
                            <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Last Name</label>
                            <input type="text" id="r_ln" placeholder="Doe" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Username</label>
                        <input type="text" id="r_user" placeholder="Choose a unique ID" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Email Address</label>
                        <div class="relative">
                            <input type="email" id="r_email" placeholder="john@example.com" class="w-full bg-black/40 border border-white/10 p-3.5 pr-10 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all peer">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[#10B981] opacity-0 peer-valid:opacity-100 transition-opacity">✓</span>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Region / Country</label>
                        <select id="r_country" class="w-full bg-black/40 border border-white/10 p-3.5 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all appearance-none">
                            <option value="Nigeria" class="bg-gray-900">🇳🇬 Nigeria (+234)</option>
                            <option value="Ghana" class="bg-gray-900">🇬🇭 Ghana (+233)</option>
                            <option value="Kenya" class="bg-gray-900">🇰🇪 Kenya (+254)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Password</label>
                        <div class="relative">
                            <input type="password" id="r_pass" placeholder="Create strong password" class="w-full bg-black/40 border border-white/10 p-3.5 pr-10 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all" oninput="
                                const val = this.value.length;
                                const bar = document.getElementById('pass_strength');
                                if(val === 0) bar.style.width = '0%';
                                else if(val < 6) { bar.style.width = '33%'; bar.className = 'h-full bg-red-500 rounded-full transition-all duration-300'; }
                                else if(val < 9) { bar.style.width = '66%'; bar.className = 'h-full bg-[#F59E0B] rounded-full transition-all duration-300'; }
                                else { bar.style.width = '100%'; bar.className = 'h-full bg-[#10B981] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]'; }
                            ">
                            <button onclick="const p=document.getElementById('r_pass');p.type=p.type==='password'?'text':'password';" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">👁️</button>
                        </div>
                        <div class="h-1 w-full bg-black/50 rounded-full mt-2 overflow-hidden flex">
                            <div id="pass_strength" class="h-full w-0 transition-all duration-300"></div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 px-1">Confirm Password</label>
                        <div class="relative">
                            <input type="password" id="r_cpass" placeholder="Repeat password" class="w-full bg-black/40 border border-white/10 p-3.5 pr-10 rounded-[14px] text-white text-[12px] font-medium outline-none focus:border-[#1E90FF] focus:bg-[#1E90FF]/5 transition-all">
                            <button onclick="const p=document.getElementById('r_cpass');p.type=p.type==='password'?'text':'password';" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">👁️</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 px-1">Referral Code (Optional)</label>
                        <input type="text" id="r_ref" value="${refCode}" placeholder="Enter invite code" class="w-full bg-transparent border border-white/5 border-dashed p-3 rounded-[14px] text-gray-400 text-[12px] outline-none focus:border-[#C9A227] focus:text-[#C9A227] transition-all">
                    </div>
                    <div class="pt-4">
                        <button onclick="handleRegister()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all relative overflow-hidden group">
                            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span class="relative z-10">Create Account</span>
                        </button>
                        <p class="text-center text-[8px] text-gray-500 font-bold tracking-widest uppercase mt-3">Secure & Fast Registration</p>
                    </div>
                </div>
            </div>
            <p class="text-center text-[10px] text-[#C9A227] bg-[#C9A227]/10 border border-[#C9A227]/20 py-2.5 rounded-[12px] mb-8 font-medium">
                ℹ️ You may be required to verify your email or phone
            </p>
            <div class="flex justify-center gap-6 mb-8 opacity-80">
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[#10B981] text-lg">🛡️</span>
                    <span class="text-[7px] text-gray-400 font-bold uppercase tracking-widest text-center">Your data<br>is secure</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[#1E90FF] text-lg">🔐</span>
                    <span class="text-[7px] text-gray-400 font-bold uppercase tracking-widest text-center">Encrypted &<br>Protected</span>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <span class="text-[#C9A227] text-lg">⭐</span>
                    <span class="text-[7px] text-gray-400 font-bold uppercase tracking-widest text-center">Trusted<br>Platform</span>
                </div>
            </div>
            <div class="text-center space-y-4">
                <p class="text-gray-500 text-[11px] font-medium cursor-pointer transition-all" onclick="switchTab('login')">Already have an account? <span class="text-[#1E90FF] font-bold border-b border-[#1E90FF]/30 pb-0.5 hover:border-[#1E90FF] hover:text-white">Login</span></p>
                <p class="text-gray-600 text-[8px] uppercase tracking-widest max-w-[85%] mx-auto leading-relaxed mt-4">By signing up, you agree to BluePeak's <a href="#" class="text-gray-500 hover:text-white transition-colors">Terms of Service</a> & <a href="#" class="text-gray-500 hover:text-white transition-colors">Privacy Policy</a></p>
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
                <div class="flex gap-3 items-center">
                    <div class="relative w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                        <span class="text-lg">🔔</span>
                        <div class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#020617]"></div>
                    </div>
                    <div class="w-10 h-10 rounded-full border border-[#1E90FF]/30 p-[2px] cursor-pointer" onclick="switchTab('profile')">
                        <div class="w-full h-full bg-[#111827] rounded-full flex items-center justify-center text-[#1E90FF] font-bold shadow-[0_0_15px_rgba(30,144,255,0.3)]">
                            ${userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
                        </div>
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
                        <p class="text-[13px] font-bold text-[#10B981] flex items-center gap-1">+₦${userData.earned.toLocaleString()} <span class="text-[9px] bg-[#10B981]/10 px-1 rounded">+8.5%</span></p>
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
                <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Market Overview <span class="text-[#1E90FF] lowercase tracking-normal">(Live Demo)</span></h3>
                <div class="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5">
                    
                    <div class="min-w-[150px] bg-white/[0.02] backdrop-blur-xl p-4 rounded-[20px] border border-white/5 shadow-lg">
                        <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[10px] border border-[#F59E0B]/20">🪙</div>
                                <span class="text-[10px] text-gray-300 font-bold">Gold</span>
                            </div>
                            <span class="text-[9px] text-[#10B981] font-bold bg-[#10B981]/10 px-1.5 py-0.5 rounded">+1.2%</span>
                        </div>
                        <p class="text-white font-black text-[13px] mb-2">$2,345.50</p>
                        <svg viewBox="0 0 100 20" class="w-full h-5 opacity-80" preserveAspectRatio="none"><path d="M0,15 Q10,5 20,10 T40,5 T60,15 T80,5 T100,2" fill="none" stroke="#10B981" stroke-width="2" /></svg>
                    </div>
                    <div class="min-w-[150px] bg-white/[0.02] backdrop-blur-xl p-4 rounded-[20px] border border-white/5 shadow-lg">
                        <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-[#F7931A]/10 flex items-center justify-center text-[10px] border border-[#F7931A]/20">₿</div>
                                <span class="text-[10px] text-gray-300 font-bold">Bitcoin</span>
                            </div>
                            <span class="text-[9px] text-[#10B981] font-bold bg-[#10B981]/10 px-1.5 py-0.5 rounded">+2.5%</span>
                        </div>
                        <p class="text-white font-black text-[13px] mb-2">$64,200.00</p>
                        <svg viewBox="0 0 100 20" class="w-full h-5 opacity-80" preserveAspectRatio="none"><path d="M0,18 Q15,10 30,15 T60,5 T80,10 T100,0" fill="none" stroke="#10B981" stroke-width="2" /></svg>
                    </div>
                    <div class="min-w-[150px] bg-white/[0.02] backdrop-blur-xl p-4 rounded-[20px] border border-white/5 shadow-lg">
                        <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-[#1E90FF]/10 flex items-center justify-center text-[10px] border border-[#1E90FF]/20">💶</div>
                                <span class="text-[10px] text-gray-300 font-bold">EUR/USD</span>
                            </div>
                            <span class="text-[9px] text-red-400 font-bold bg-red-400/10 px-1.5 py-0.5 rounded">-0.4%</span>
                        </div>
                        <p class="text-white font-black text-[13px] mb-2">1.0845</p>
                        <svg viewBox="0 0 100 20" class="w-full h-5 opacity-80" preserveAspectRatio="none"><path d="M0,5 Q15,15 30,10 T60,18 T80,12 T100,20" fill="none" stroke="#F87171" stroke-width="2" /></svg>
                    </div>
                </div>
            </div>
            <div class="mb-8">
                <div class="flex justify-between items-center mb-3 px-1">
                    <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Performance</h3>
                    <div class="flex gap-1 text-[8px] font-bold">
                        <button class="text-gray-500 px-2 py-1">1D</button>
                        <button class="text-gray-500 px-2 py-1">7D</button>
                        <button class="bg-[#1E90FF]/20 text-[#1E90FF] rounded px-2 py-1 border border-[#1E90FF]/30">30D</button>
                    </div>
                </div>
                <div class="bg-white/[0.02] p-5 rounded-[24px] border border-white/5 shadow-lg">
                    <div class="h-24 w-full bg-gradient-to-t from-[#10B981]/10 to-transparent rounded-[16px] relative flex items-end overflow-hidden">
                        <svg viewBox="0 0 100 30" class="w-full h-full preserve-3d" preserveAspectRatio="none">
                            <path d="M0,25 Q15,10 30,20 T60,5 T100,15" fill="none" stroke="#10B981" stroke-width="1.5" style="filter: drop-shadow(0px 4px 8px rgba(16,185,129,0.6));" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="mb-8">
                <div class="flex justify-between items-center mb-3 px-1">
                    <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Active Plans</h3>
                    <span class="text-[9px] text-[#1E90FF] cursor-pointer font-bold" onclick="switchTab('plans')">View All</span>
                </div>
                ${activePlans.length > 0 ? `
                    <div class="bg-white/[0.02] p-5 rounded-[24px] border border-white/5 shadow-lg relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-16 h-16 bg-[#C9A227]/10 blur-[20px] rounded-full"></div>
                        <div class="flex justify-between items-center mb-3 relative z-10">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-[8px] bg-[#C9A227]/10 flex items-center justify-center text-sm border border-[#C9A227]/30">👑</div>
                                <div>
                                    <p class="text-white font-bold text-[12px]">${activePlans[0].name}</p>
                                    <p class="text-[9px] text-[#10B981] font-semibold mt-0.5">ROI: ${activePlans[0].dailyRoi}% / Day</p>
                                </div>
                            </div>
                            <p class="text-[10px] text-white font-bold bg-white/10 px-2 py-1 rounded">Active</p>
                        </div>
                        <div class="w-full bg-black/50 rounded-full h-1.5 mb-1 relative z-10">
                            <div class="bg-gradient-to-r from-[#10B981] to-[#34D399] h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style="width: 45%"></div>
                        </div>
                        <p class="text-[8px] text-gray-500 font-bold text-right tracking-widest uppercase">14 Days Remaining</p>
                    </div>
                ` : `
                    <div class="bg-white/[0.02] p-6 rounded-[24px] border border-white/5 text-center shadow-lg cursor-pointer" onclick="switchTab('plans')">
                        <p class="text-[10px] text-gray-400 font-medium">No active portfolios found.</p>
                        <p class="text-[10px] text-[#1E90FF] font-bold mt-2">Explore Market Plans →</p>
                    </div>
                `}
            </div>
            <div class="mb-6">
                <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Recent Activity</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-[20px]">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-[10px] bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center text-sm border border-[#1E90FF]/20">📥</div>
                            <div>
                                <p class="text-[11px] font-bold text-white">Deposit Processed</p>
                                <p class="text-[9px] text-gray-500 mt-0.5">Just now</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[11px] font-bold text-white">+₦${userData.balance > 0 ? userData.balance.toLocaleString() : '0.00'}</p>
                            <p class="text-[8px] text-[#10B981] font-bold uppercase tracking-widest mt-1">Completed</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-center pb-2">
                <p class="text-[8px] text-gray-600 font-bold tracking-[0.2em] uppercase flex justify-center items-center gap-2">
                    <span>🔒 Secure</span> • <span>✓ Verified</span> • <span>🛡️ Encrypted</span>
                </p>
            </div>
        </div>
    `;
}

function WithdrawPage() {
    const totalBalance = userData.balance + userData.earned;

    return `
        <div class="animate-in slide-in-from-right duration-500 pb-24 pt-4">
            <div class="flex items-center gap-4 mb-8">
                <button onclick="switchTab('home')" class="w-10 h-10 bg-white/[0.05] rounded-[14px] border border-white/10 text-white font-bold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shadow-lg">←</button>
                <h2 class="text-2xl font-black text-white tracking-tight">Withdraw Funds</h2>
            </div>
            
            <div class="relative bg-gradient-to-br from-[#111827] to-[#0A101C] backdrop-blur-xl p-6 rounded-[24px] border border-[#10B981]/20 shadow-[0_15px_40px_rgba(0,0,0,0.5)] mb-6 overflow-hidden">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-[#10B981]/10 blur-[40px] rounded-full"></div>
                
                <div class="relative z-10 flex flex-col items-center">
                    <p class="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-widest">Available Balance</p>
                    <h2 class="text-[36px] font-black text-white tracking-tighter mb-1">₦${totalBalance.toLocaleString()}</h2>
                    <p class="text-[9px] text-[#10B981] font-semibold flex items-center gap-1 bg-[#10B981]/10 px-2 py-1 rounded-full uppercase tracking-widest"><span class="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></span> Withdrawable Balance</p>
                </div>
            </div>
            
            <div class="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[24px] border border-white/10 shadow-lg mb-6">
                <p class="text-[10px] text-gray-500 mb-4 font-bold uppercase tracking-widest">Enter Amount</p>
                <div class="relative mb-4 flex items-center border-b border-white/10 pb-4">
                    <span class="text-white font-black text-4xl mr-2">₦</span>
                    <input type="number" id="withdraw_amount" placeholder="3000" class="w-full bg-transparent text-white font-black text-4xl outline-none placeholder-gray-600">
                </div>
                
                <div class="flex justify-between items-center">
                    <p class="text-[9px] text-gray-500 font-semibold uppercase tracking-widest">Minimum withdrawal: ₦3,000</p>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-2 mb-8">
                ${[5000, 10000, 20000, 50000].map(amt => `
                    <button onclick="document.getElementById('withdraw_amount').value = ${amt}" class="flex-1 min-w-[20%] bg-white/[0.02] border border-white/10 py-3 rounded-[12px] font-bold text-[11px] text-gray-300 hover:border-[#1E90FF] hover:text-white active:scale-95 transition-all shadow-md">₦${amt.toLocaleString()}</button>
                `).join('')}
                <button onclick="document.getElementById('withdraw_amount').value = ${totalBalance}" class="flex-1 min-w-[25%] bg-[#1E90FF]/10 border border-[#1E90FF]/30 py-3 rounded-[12px] font-black text-[10px] text-[#1E90FF] uppercase tracking-widest hover:bg-[#1E90FF]/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(30,144,255,0.15)]">Max</button>
            </div>
            <p class="text-[10px] text-gray-500 mb-3 font-bold uppercase tracking-widest px-1">Withdrawal Method</p>
            <div class="space-y-3 mb-8">
                <div class="bg-white/[0.04] p-4 rounded-[16px] border border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-[#10B981]/10 rounded-[10px] flex items-center justify-center text-lg border border-[#10B981]/20">🏦</div>
                        <div>
                            <p class="text-white font-bold text-[13px] tracking-tight">Access Bank</p>
                            <p class="text-gray-400 text-[10px] mt-0.5 font-medium font-mono">**** 1234 • ${userData.username || 'User'}</p>
                        </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-4 border-[#10B981] bg-[#020617] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
                <div onclick="notify('Bank verification module offline', 'red')" class="bg-white/[0.01] p-4 rounded-[16px] border border-white/5 border-dashed flex items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.03] transition-colors">
                    <span class="text-[#1E90FF] text-lg font-bold">+</span>
                    <p class="text-gray-400 font-bold text-[11px] uppercase tracking-widest">Add New Bank Account</p>
                </div>
            </div>
            <div class="bg-black/40 rounded-[16px] p-5 border border-white/5 mb-8">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-[10px] text-gray-500 font-semibold">Processing Time</span>
                    <span class="text-[10px] text-white font-bold">Instant - 24 Hours</span>
                </div>
                <div class="flex justify-between items-center mb-3">
                    <span class="text-[10px] text-gray-500 font-semibold">Network Fee</span>
                    <span class="text-[10px] text-[#10B981] font-bold">₦0.00 (Free)</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-[10px] text-gray-500 font-semibold">Security</span>
                    <span class="text-[10px] text-[#C9A227] font-bold flex items-center gap-1">🔒 256-bit Encryption</span>
                </div>
            </div>
            
            <button onclick="processWithdraw()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all mb-4">
                Withdraw Now
            </button>
            <p class="text-center text-[10px] text-gray-500 font-bold tracking-widest mb-4 flex justify-center gap-3">
                <span>FAST</span> • <span>SECURE</span> • <span>RELIABLE</span>
            </p>
        </div>
    `;
}

function DepositPage() {
    return `
        <div class="animate-in slide-in-from-right duration-500 pb-24 pt-4">
            <div class="flex items-center gap-4 mb-8">
                <button onclick="switchTab('home')" class="w-10 h-10 bg-white/[0.05] rounded-[14px] border border-white/10 text-white font-bold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shadow-lg">←</button>
                <h2 class="text-2xl font-black text-white tracking-tight">Fund Vault</h2>
            </div>
            
            <div class="bg-gradient-to-br from-[#111827] to-[#0A101C] backdrop-blur-xl p-6 rounded-[24px] border border-[#1E90FF]/20 shadow-[0_15px_40px_rgba(0,0,0,0.5)] mb-6 relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-[#1E90FF]/10 blur-[40px] rounded-full"></div>
                
                <p class="text-[10px] text-gray-400 mb-4 font-bold uppercase tracking-widest">Enter Amount</p>
                <div class="relative mb-4 flex items-center border-b border-white/10 pb-4">
                    <span class="text-[#1E90FF] font-black text-4xl mr-2">₦</span>
                    <input type="number" id="deposit_amount" placeholder="3000" class="w-full bg-transparent text-white font-black text-4xl outline-none placeholder-gray-600">
                </div>
                
                <div class="flex justify-between items-center">
                    <p class="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Minimum: ₦3,000</p>
                    <p class="text-[9px] text-[#10B981] font-bold bg-[#10B981]/10 px-2 py-1 rounded uppercase">No Hidden Fees</p>
                </div>
            </div>
            
            <p class="text-[10px] text-gray-500 mb-3 font-bold uppercase tracking-widest px-1">Quick Select</p>
            <div class="flex flex-wrap gap-2 mb-8">
                ${[5000, 10000, 20000, 50000, 100000].map(amt => `
                    <button onclick="document.getElementById('deposit_amount').value = ${amt}" class="flex-1 min-w-[30%] bg-white/[0.02] border border-white/10 py-3 rounded-[12px] font-bold text-[11px] text-gray-300 hover:border-[#1E90FF] hover:bg-[#1E90FF]/5 hover:text-white active:scale-95 transition-all shadow-md">₦${amt.toLocaleString()}</button>
                `).join('')}
            </div>
            <p class="text-[10px] text-gray-500 mb-3 font-bold uppercase tracking-widest px-1">Payment Method</p>
            <div class="space-y-3 mb-8">
                <div class="bg-white/[0.04] p-4 rounded-[16px] border border-[#1E90FF]/40 shadow-[0_0_15px_rgba(30,144,255,0.1)] flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-[#1E90FF]/10 rounded-[10px] flex items-center justify-center text-lg border border-[#1E90FF]/20">💳</div>
                        <div>
                            <p class="text-white font-bold text-[13px] tracking-tight">Bank Card / Transfer</p>
                            <p class="text-gray-400 text-[10px] mt-0.5 font-medium">Instant gateway processing</p>
                        </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-4 border-[#1E90FF] bg-[#020617] shadow-[0_0_10px_rgba(30,144,255,0.5)]"></div>
                </div>
                
                <div class="bg-white/[0.01] p-4 rounded-[16px] border border-white/5 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-white/5 rounded-[10px] flex items-center justify-center text-lg border border-white/10">📱</div>
                        <div>
                            <p class="text-white font-bold text-[13px] tracking-tight">USSD Mobile</p>
                            <p class="text-gray-400 text-[10px] mt-0.5 font-medium">Currently down for maintenance</p>
                        </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-white/10 bg-transparent"></div>
                </div>
            </div>
            
            <button onclick="processDeposit()" class="w-full bg-gradient-to-r from-[#1E90FF] to-[#0070F3] py-4 rounded-[16px] font-black text-white text-[13px] uppercase tracking-widest shadow-[0_0_25px_rgba(30,144,255,0.4)] active:scale-95 transition-all mb-4 relative overflow-hidden group">
                <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span class="relative z-10">Proceed to Secure Payment</span>
            </button>
            <p class="text-center text-[10px] text-gray-500 font-bold tracking-widest mb-8">FAST & SECURE TRANSACTIONS</p>
            
            <div class="bg-black/30 rounded-[16px] p-4 border border-white/5 flex justify-around items-center">
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#1E90FF] text-xl mb-1">🛡️</span>
                    <span class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Secured by<br>SquadCo</span>
                </div>
                <div class="w-px h-8 bg-white/10"></div>
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#10B981] text-xl mb-1">🔐</span>
                    <span class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">SSL<br>Encrypted</span>
                </div>
                <div class="w-px h-8 bg-white/10"></div>
                <div class="text-center flex flex-col items-center">
                    <span class="text-[#C9A227] text-xl mb-1">💳</span>
                    <span class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">PCI-DSS<br>Protected</span>
                </div>
            </div>
        </div>
    `;
}

// --------------------------------------------------------
// THE REFINED PLANS PAGE (Fixes "Error Message" image)
// --------------------------------------------------------
function PlansPage() {
    if (activePlans.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in duration-500">
                <div class="w-20 h-20 rounded-[24px] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(30,144,255,0.1)]">
                    <span class="text-3xl">🗃️</span> </div>
                <h2 class="text-xl font-bold text-white mb-2 tracking-tight">System Update</h2>
                <p class="text-[11px] text-gray-500 px-8 leading-relaxed">System optimizations are currently underway. We appreciate your patience during this time.</p>
            </div>
        `;
    }

    return `
        <div class="animate-in fade-in pt-4 pb-24">
            <h2 class="text-3xl font-black text-white mb-1 tracking-tight">Portfolios</h2>
            <p class="text-gray-400 text-[11px] mb-6 font-medium">Select a premium plan to accelerate your wealth.</p>
            <div class="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                <button class="px-5 py-2 bg-[#1E90FF]/20 border border-[#1E90FF]/50 text-[#1E90FF] rounded-full text-[10px] font-bold whitespace-nowrap shadow-[0_0_10px_rgba(30,144,255,0.2)]">All Plans</button>
                <button class="px-5 py-2 bg-white/[0.03] border border-white/10 text-gray-400 rounded-full text-[10px] font-semibold whitespace-nowrap hover:text-white hover:bg-white/[0.05] transition-all">Short-term</button>
                <button class="px-5 py-2 bg-white/[0.03] border border-white/10 text-gray-400 rounded-full text-[10px] font-semibold whitespace-nowrap hover:text-white hover:bg-white/[0.05] transition-all">Mid-term</button>
                <button class="px-5 py-2 bg-white/[0.03] border border-white/10 text-gray-400 rounded-full text-[10px] font-semibold whitespace-nowrap hover:text-white hover:bg-white/[0.05] transition-all">Long-term</button>
            </div>
            <div class="space-y-6">
                ${activePlans.map((plan, index) => {
                    const isPopular = index === 1 || (activePlans.length === 1 && index === 0);
                    const borderGlow = isPopular ? 'border-[#C9A227]/40 shadow-[0_0_25px_rgba(201,162,39,0.15)]' : 'border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.4)]';
                    const iconBg = isPopular ? 'bg-[#C9A227]/10 border-[#C9A227]/30 text-[#C9A227]' : 'bg-[#1E90FF]/10 border-[#1E90FF]/30 text-[#1E90FF]';
                    const icon = isPopular ? '👑' : '💎';
                    const btnStyle = isPopular 
                        ? 'bg-gradient-to-r from-[#C9A227] to-[#eab308] text-black shadow-[0_0_20px_rgba(201,162,39,0.3)]' 
                        : 'bg-gradient-to-r from-[#1E90FF] to-[#0070F3] text-white shadow-[0_0_20px_rgba(30,144,255,0.4)]';

                    return `
                    <div class="relative bg-white/[0.02] backdrop-blur-xl p-6 rounded-[24px] border ${borderGlow} transition-all duration-300 hover:scale-[1.02]">
                        
                        ${isPopular ? `
                            <div class="absolute -top-3 right-5 bg-gradient-to-r from-[#C9A227] to-[#FCD34D] text-black text-[9px] font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(201,162,39,0.5)] flex items-center gap-1 uppercase tracking-widest z-10">
                                <span>⭐ Most Popular</span>
                            </div>
                        ` : ''}
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-12 h-12 rounded-[16px] ${iconBg} border flex items-center justify-center text-xl shadow-inner">
                                ${icon}
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-tight">${plan.name}</h3>
                                <p class="text-[10px] text-[#10B981] mt-1 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                                    <span class="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> 
                                    Daily ROI: ${plan.dailyRoi}%
                                </p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-6">
                            <div class="bg-black/40 p-3.5 rounded-[16px] border border-white/5 relative overflow-hidden group">
                                <div class="absolute -right-2 -bottom-2 opacity-5 text-4xl group-hover:scale-110 transition-transform">💰</div>
                                <p class="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Min Deposit</p>
                                <p class="text-white font-black text-sm">₦${plan.minDeposit.toLocaleString()}</p>
                            </div>
                            <div class="bg-black/40 p-3.5 rounded-[16px] border border-white/5 relative overflow-hidden group">
                                <div class="absolute -right-2 -bottom-2 opacity-5 text-4xl group-hover:scale-110 transition-transform">⏳</div>
                                <p class="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Duration</p>
                                <p class="text-white font-black text-sm">${plan.duration} Days</p>
                            </div>
                        </div>
                        <button onclick="notify('Processing Contract Logic...', 'gold')" class="w-full ${btnStyle} py-4 rounded-[14px] font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all">
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
            <h2 class="text-3xl font-black text-white mb-1 tracking-tight">Performance</h2>
            <p class="text-gray-400 text-[11px] mb-6 font-medium">Analyze your wealth accumulation.</p>
            <div class="grid grid-cols-3 gap-3 mb-6">
                <div class="bg-white/[0.03] p-4 rounded-[20px] border border-white/10 shadow-lg relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-[#10B981]/10 rounded-full blur-xl"></div>
                    <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Daily Profit</p>
                    <p class="text-[#10B981] font-black text-sm">+2.5%</p>
                </div>
                <div class="bg-white/[0.03] p-4 rounded-[20px] border border-white/10 shadow-lg relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-[#1E90FF]/10 rounded-full blur-xl"></div>
                    <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Weekly</p>
                    <p class="text-[#1E90FF] font-black text-sm">+18.4%</p>
                </div>
                <div class="bg-gradient-to-br from-[#C9A227]/20 to-transparent p-4 rounded-[20px] border border-[#C9A227]/30 shadow-[0_0_15px_rgba(201,162,39,0.15)] relative overflow-hidden">
                    <p class="text-[9px] text-[#C9A227] font-bold uppercase tracking-widest mb-1">Total ROI</p>
                    <p class="text-white font-black text-sm">145%</p>
                </div>
            </div>
            <div class="bg-white/[0.02] backdrop-blur-xl p-5 rounded-[24px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.4)] mb-8">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xs font-bold text-white tracking-wide">Yield Curve</h3>
                    <div class="flex gap-2 text-[9px]">
                        <button class="text-gray-500 hover:text-white transition-colors">1D</button>
                        <button class="text-gray-500 hover:text-white transition-colors">7D</button>
                        <button class="bg-white/[0.1] text-white px-2 py-1 rounded-md border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]">30D</button>
                        <button class="text-gray-500 hover:text-white transition-colors">ALL</button>
                    </div>
                </div>
                
                <div class="h-40 w-full relative">
                    <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div class="border-t border-white/5 w-full h-0"></div>
                        <div class="border-t border-white/5 w-full h-0"></div>
                        <div class="border-t border-white/5 w-full h-0"></div>
                        <div class="border-t border-white/5 w-full h-0"></div>
                    </div>
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-[#10B981]/20 to-transparent rounded-lg flex items-end overflow-hidden">
                        <svg viewBox="0 0 100 40" class="w-full h-full preserve-3d" preserveAspectRatio="none">
                            <path d="M0,35 Q10,25 20,28 T40,15 T60,20 T80,5 T100,10" fill="none" stroke="#10B981" stroke-width="1.5" style="filter: drop-shadow(0px 4px 6px rgba(16,185,129,0.8));" />
                            <path d="M0,35 Q10,25 20,28 T40,15 T60,20 T80,5 T100,10 L100,40 L0,40 Z" fill="url(#gradTrack)" opacity="0.3" />
                            <defs>
                                <linearGradient id="gradTrack" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stop-color="#10B981" stop-opacity="1" />
                                    <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div class="absolute top-[10%] right-[18%] bg-black/80 border border-white/10 px-2 py-1 rounded backdrop-blur-md shadow-xl flex flex-col items-center">
                        <span class="text-[8px] text-gray-400 font-bold uppercase">Peak Value</span>
                        <span class="text-[#10B981] text-[10px] font-black">+₦45,200</span>
                    </div>
                    <div class="absolute top-[15%] right-[20%] w-2 h-2 bg-[#10B981] rounded-full shadow-[0_0_10px_#10B981] border-2 border-black"></div>
                </div>
            </div>
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xs font-bold text-white tracking-wide">Contract Ledger</h3>
                <button class="text-[9px] text-[#1E90FF] bg-[#1E90FF]/10 px-3 py-1 rounded-full border border-[#1E90FF]/20 active:scale-95 transition-all">Download CSV</button>
            </div>
            
            <div class="space-y-3">
                <div class="bg-white/[0.02] p-4 rounded-[16px] border border-white/5 flex justify-between items-center hover:bg-white/[0.04] transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-lg shadow-inner">📈</div>
                        <div>
                            <p class="text-white font-bold text-[11px] tracking-tight">Daily Profit Payout</p>
                            <p class="text-gray-500 text-[9px] mt-0.5">Today, 02:45 PM</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[#10B981] font-black text-xs">+₦2,500.00</p>
                        <p class="text-[8px] text-[#10B981] font-bold uppercase tracking-widest mt-1 bg-[#10B981]/10 inline-block px-1.5 py-0.5 rounded border border-[#10B981]/20">Completed</p>
                    </div>
                </div>
                <div class="bg-white/[0.02] p-4 rounded-[16px] border border-white/5 flex justify-between items-center hover:bg-white/[0.04] transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-[12px] bg-[#1E90FF]/10 border border-[#1E90FF]/20 flex items-center justify-center text-lg shadow-inner">📥</div>
                        <div>
                            <p class="text-white font-bold text-[11px] tracking-tight">Squad Deposit</p>
                            <p class="text-gray-500 text-[9px] mt-0.5">Apr 21, 10:12 AM</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-white font-black text-xs">₦50,000.00</p>
                        <p class="text-[8px] text-[#10B981] font-bold uppercase tracking-widest mt-1 bg-[#10B981]/10 inline-block px-1.5 py-0.5 rounded border border-[#10B981]/20">Completed</p>
                    </div>
                </div>
                <div class="bg-white/[0.02] p-4 rounded-[16px] border border-white/5 flex justify-between items-center hover:bg-white/[0.04] transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-[12px] bg-[#C9A227]/10 border border-[#C9A227]/20 flex items-center justify-center text-lg shadow-inner">⏳</div>
                        <div>
                            <p class="text-white font-bold text-[11px] tracking-tight">Withdrawal Request</p>
                            <p class="text-gray-500 text-[9px] mt-0.5">Apr 20, 08:30 PM</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-white font-black text-xs">-₦15,000.00</p>
                        <p class="text-[8px] text-[#C9A227] font-bold uppercase tracking-widest mt-1 bg-[#C9A227]/10 inline-block px-1.5 py-0.5 rounded border border-[#C9A227]/20">Pending</p>
                    </div>
                </div>
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
            <div class="relative bg-gradient-to-br from-[#1E90FF]/20 to-[#10B981]/10 p-6 rounded-[24px] border border-[#1E90FF]/30 shadow-[0_15px_40px_rgba(30,144,255,0.15)] mb-6 overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/20 blur-[50px] rounded-full"></div>
                <div class="flex items-center gap-4 relative z-10 mb-4">
                    <div class="w-12 h-12 rounded-full bg-white/[0.1] border border-white/20 flex items-center justify-center text-2xl backdrop-blur-md">🤝</div>
                    <div>
                        <h3 class="text-lg font-bold text-white tracking-tight">Earn 15% Commission</h3>
                        <p class="text-[10px] text-[#10B981] font-semibold mt-0.5">On all direct network deposits</p>
                    </div>
                </div>
                <p class="text-[10px] text-gray-300 leading-relaxed relative z-10">Invite friends to BluePeak Finance and earn premium rewards every time they fund their vault.</p>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-white/[0.02] backdrop-blur-xl p-4 rounded-[20px] border border-white/10 shadow-lg">
                    <div class="w-8 h-8 rounded-[10px] bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center mb-3 text-lg border border-[#1E90FF]/20">👥</div>
                    <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Invites</p>
                    <p class="text-white font-black text-xl">${userData.referrals}</p>
                </div>
                <div class="bg-white/[0.02] backdrop-blur-xl p-4 rounded-[20px] border border-white/10 shadow-lg">
                    <div class="w-8 h-8 rounded-[10px] bg-[#C9A227]/10 text-[#C9A227] flex items-center justify-center mb-3 text-lg border border-[#C9A227]/20">💰</div>
                    <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Earned Bonus</p>
                    <p class="text-[#C9A227] font-black text-xl">₦${userData.refEarnings.toLocaleString()}</p>
                </div>
            </div>
            <div class="bg-white/[0.02] backdrop-blur-xl p-5 rounded-[24px] border border-white/10 shadow-xl mb-6">
                <p class="text-[10px] text-gray-400 mb-3 font-bold uppercase tracking-widest">Your Private Link</p>
                <div class="flex items-center gap-2 bg-black/40 border border-white/10 p-2 rounded-[16px]">
                    <div class="flex-1 overflow-hidden">
                        <p class="text-[#1E90FF] font-mono text-[10px] whitespace-nowrap overflow-hidden text-ellipsis px-2 opacity-80">${refLink}</p>
                    </div>
                    <button onclick="navigator.clipboard.writeText('${refLink}'); notify('Link Copied to Clipboard', 'gold');" class="bg-[#1E90FF] text-white p-3 rounded-[12px] shadow-[0_0_15px_rgba(30,144,255,0.4)] active:scale-95 transition-all">📋</button>
                </div>
            </div>
            <div>
                <p class="text-[10px] text-gray-500 mb-4 font-bold uppercase tracking-widest text-center">Quick Share</p>
                <div class="flex justify-center gap-4">
                    <button onclick="notify('Opening WhatsApp...')" class="w-12 h-12 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] text-xl shadow-[0_0_15px_rgba(37,211,102,0.15)] hover:scale-110 transition-all">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </button>
                    <button onclick="notify('Opening Telegram...')" class="w-12 h-12 rounded-full bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-center text-[#0088cc] text-xl shadow-[0_0_15px_rgba(0,136,204,0.15)] hover:scale-110 transition-all">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" opacity=".05"/><path d="M11.96 23.951C5.4 23.951 0 18.62 0 12 0 5.38 5.4 0 11.96 0c6.559 0 11.959 5.38 11.959 12 0 6.62-5.4 12-11.959 12zM6.936 11.362l10.375-4.103c.48-.198.897.108.73.834l-1.764 8.358c-.148.665-.541.83-1.09.52l-3.013-2.222-1.454 1.402c-.161.161-.296.296-.607.296l.216-3.064 5.576-5.038c.243-.217-.053-.338-.377-.123l-6.892 4.34-2.969-.928c-.645-.202-.657-.645.134-.955z"/></svg>
                    </button>
                    <button onclick="notify('Opening Twitter/X...')" class="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-xl shadow-lg hover:scale-110 transition-all">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function ProfilePage() {
    return `
        <div class="animate-in fade-in pt-4 pb-24">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-black text-white tracking-tight">Vault Profile</h2>
                <div class="bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <div class="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></div>
                    <span class="text-[9px] text-[#10B981] font-bold uppercase tracking-widest">Protected</span>
                </div>
            </div>
            <div class="relative bg-gradient-to-br from-[#111827] to-[#0A101C] p-6 rounded-[24px] border border-[#C9A227]/30 shadow-[0_15px_40px_rgba(0,0,0,0.5)] mb-6 overflow-hidden">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-[#C9A227]/10 blur-[40px] rounded-full"></div>
                
                <div class="flex items-center gap-4 relative z-10">
                    <div class="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#1E90FF] to-[#0070F3] p-[2px] shadow-[0_0_20px_rgba(30,144,255,0.3)]">
                        <div class="w-full h-full bg-[#020617] rounded-[16px] flex items-center justify-center text-2xl font-black text-white">
                            ${userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white tracking-tight">${userData.username}</h3>
                        <p class="text-[10px] text-[#C9A227] font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                            <span>👑 Elite Status</span>
                        </p>
                    </div>
                </div>
            </div>
            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 px-2">Account Data</p>
            <div class="bg-white/[0.02] backdrop-blur-xl rounded-[20px] border border-white/10 shadow-lg mb-6 overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-white/5">
                    <span class="text-[11px] text-gray-400 font-semibold">User ID</span>
                    <span class="text-[11px] text-white font-bold">@${userData.username}</span>
                </div>
                <div class="flex justify-between items-center p-4 border-b border-white/5">
                    <span class="text-[11px] text-gray-400 font-semibold">Total Assets</span>
                    <span class="text-[11px] text-[#1E90FF] font-black">₦${(userData.balance + userData.earned).toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center p-4">
                    <span class="text-[11px] text-gray-400 font-semibold">Security Level</span>
                    <span class="text-[11px] text-gray-500 font-bold border border-gray-600 px-2 py-0.5 rounded-full">Tier 1 Unverified</span>
                </div>
            </div>
            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 px-2">Settings & Control</p>
            <div class="bg-white/[0.02] backdrop-blur-xl rounded-[20px] border border-white/10 shadow-lg mb-8 overflow-hidden">
                <button onclick="switchTab('kyc')" class="w-full flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors active:scale-[0.98]">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-[10px] bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center text-sm border border-[#1E90FF]/20">🆔</div>
                        <span class="text-[12px] text-white font-semibold">KYC Verification</span>
                    </div>
                    <span class="text-gray-500 font-bold">→</span>
                </button>
                <button onclick="notify('Security Module Loading...')" class="w-full flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors active:scale-[0.98]">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-[10px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-sm border border-[#10B981]/20">🔒</div>
                        <span class="text-[12px] text-white font-semibold">Security Settings</span>
                    </div>
                    <span class="text-gray-500 font-bold">→</span>
                </button>
                <button onclick="switchTab('track')" class="w-full flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors active:scale-[0.98]">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-[10px] bg-white/5 text-gray-300 flex items-center justify-center text-sm border border-white/10">📜</div>
                        <span class="text-[12px] text-white font-semibold">Transaction History</span>
                    </div>
                    <span class="text-gray-500 font-bold">→</span>
                </button>
                <button onclick="notify('Connecting to Live Agent...', 'gold')" class="w-full flex justify-between items-center p-4 hover:bg-white/[0.02] transition-colors active:scale-[0.98]">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-[10px] bg-[#C9A227]/10 text-[#C9A227] flex items-center justify-center text-sm border border-[#C9A227]/20">🎧</div>
                        <span class="text-[12px] text-white font-semibold">Support Center</span>
                    </div>
                    <span class="text-gray-500 font-bold">→</span>
                </button>
            </div>
            <button onclick="localStorage.removeItem('token'); location.reload();" class="w-full bg-red-500/10 border border-red-500/30 text-red-500 py-4 rounded-[16px] font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.15)] active:scale-95 transition-all">
                Terminate Session
            </button>
        </div>
    `;
}

// --- SAFE RENDER WRAPPER ---
function render() {
    try {
        const appElem = document.getElementById('app');
        if (!appElem) {
            document.body.innerHTML = `<div style="color:red; padding:40px; text-align:center; font-family:sans-serif;"><b>CRITICAL UI ERROR:</b><br>Your index.html file is missing the &lt;div id="app"&gt;&lt;/div&gt; tag.</div>`;
            return;
        }

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
            <div class="max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#020617] to-[#0A101C] text-white p-5 pb-24 font-sans overflow-x-hidden selection:bg-[#1E90FF]/30">
                ${content}
                ${isLoggedIn && currentTab !== 'deposit' && currentTab !== 'withdraw' && currentTab !== 'kyc' ? Navigation() : ''}
            </div>
        `;
    } catch (e) {
        document.body.innerHTML = `<div style="color:red; padding:40px; text-align:center; font-family:sans-serif;"><b>JAVASCRIPT CRASH:</b><br>${e.message}</div>`;
    }
}

// --- SAFE INITIALIZATION (UPDATED FOR HASH ROUTING) ---
window.addEventListener('DOMContentLoaded', async () => {
    // Determine the deep-linked tab, e.g., from example.com/#plans
    const hash = window.location.hash.substring(1); // remove '#'
    const requestedTab = hash || 'login'; // default to login

    if(localStorage.getItem('token')) {
        isLoggedIn = true;
        // Deep link should work, switchTab handles the auth check & data fetch
        await switchTab(requestedTab);
    } else {
        // If not logged in, force an auth tab. switchTab handles the block
        // on sub-tabs and will force the requestedTab (e.g., login or register)
        await switchTab(requestedTab);
    }
});