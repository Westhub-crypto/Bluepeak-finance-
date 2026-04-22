// --- APP STATE ---
let currentTab = 'login'; 
let isLoggedIn = false;
const app = document.getElementById('app');

// Local Data (Initially Empty)
let userData = {
    firstName: '', lastName: '', username: '', email: '', 
    phone: '', country: '', state: '', lga: '',
    balance: 0, earned: 0, bankSet: false, bankName: '', accountNum: '', transactions: []
};

let activePlans = []; // Empty: Only Admin can add these via DB

// --- NAVIGATION ENGINE ---
function switchTab(tab) {
    if (!isLoggedIn && tab !== 'login' && tab !== 'register') {
        notify("Access Denied: Please Sign In", "red");
        return;
    }
    currentTab = tab;
    render();
    window.scrollTo(0,0);
}

// Custom Premium Notification (No URL shown)
function notify(msg, type = "gold") {
    const oldToast = document.querySelector('.toast-msg');
    if(oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-msg fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl font-bold text-xs shadow-2xl animate-bounce ${type === 'gold' ? 'bg-[#C9A227] text-black' : 'bg-red-600 text-white'}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- UI COMPONENTS ---
const Navigation = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#0B0B0B]/90 backdrop-blur-xl border-t border-white/5 p-5 flex justify-around items-center z-50">
        ${['home', 'plans', 'invite', 'support', 'profile'].map(t => `
            <button onclick="switchTab('${t}')" class="flex flex-col items-center transition-all ${currentTab === t ? 'text-[#1E90FF] scale-110' : 'text-gray-600'}">
                <span class="text-[10px] font-black uppercase tracking-tighter">${t}</span>
            </button>
        `).join('')}
    </div>
`;

// --- PAGES ---

function LoginPage() {
    return `
        <div class="pt-20 animate-in fade-in zoom-in duration-500">
            <div class="text-center mb-16">
                <h1 class="text-5xl font-black text-white italic tracking-tighter">BLUEPEAK<span class="text-[#1E90FF]">.</span></h1>
                <p class="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">Elite African Finance</p>
            </div>
            
            <div class="space-y-5">
                <input type="text" id="log_id" placeholder="Username or Email" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF]">
                <input type="password" id="log_pass" placeholder="Password" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF]">
                
                <button onclick="handleLogin()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white shadow-2xl shadow-blue-500/30 active:scale-95 transition-all mt-4">SIGN IN</button>
                
                <p class="text-center text-gray-500 text-xs mt-8">New Investor? <span onclick="switchTab('register')" class="text-[#C9A227] font-bold underline cursor-pointer">Register Here</span></p>
            </div>
        </div>
    `;
}

function RegisterPage() {
    return `
        <div class="pt-10 pb-20 animate-in slide-in-from-bottom duration-500">
            <h2 class="text-3xl font-black text-white italic mb-8 uppercase">Create <span class="text-[#1E90FF]">Account</span></h2>
            
            <div class="grid grid-cols-1 gap-4">
                <div class="flex gap-4">
                    <input type="text" id="r_fn" placeholder="First Name" class="w-1/2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                    <input type="text" id="r_ln" placeholder="Last Name" class="w-1/2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                </div>
                <input type="text" id="r_user" placeholder="Username" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="email" id="r_email" placeholder="Email Address" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="tel" id="r_phone" placeholder="Phone Number" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                
                <div class="flex gap-4">
                    <select id="r_country" class="w-1/2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                        <option value="">Country</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana</option>
                    </select>
                    <input type="text" id="r_state" placeholder="State" class="w-1/2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                </div>
                <input type="text" id="r_lga" placeholder="LGA (Local Government)" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                
                <input type="password" id="r_pass" placeholder="Password" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="password" id="r_cpass" placeholder="Confirm Password" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
            </div>

            <button onclick="handleRegister()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white shadow-xl shadow-blue-500/20 mt-10 active:scale-95 transition-all">ESTABLISH ACCOUNT</button>
            <p onclick="switchTab('login')" class="text-center text-gray-500 text-xs mt-6 cursor-pointer font-bold uppercase underline decoration-[#C9A227]">Back to Login</p>
        </div>
    `;
}

function HomePage() {
    return `
        <div class="animate-in fade-in duration-700">
            <div class="flex justify-between items-center mb-10">
                <div class="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-3">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest">Market Live</span>
                </div>
                <div class="text-right">
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Member</p>
                    <p class="text-[#C9A227] font-black text-xs uppercase">${userData.username}</p>
                </div>
            </div>

            <div class="bg-gradient-to-br from-[#111827] to-[#0B0B0B] p-10 rounded-[45px] border border-white/10 shadow-2xl mb-10 relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-[#1E90FF]/10 blur-[100px] rounded-full"></div>
                <p class="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Total Earnings</p>
                <h2 class="text-5xl font-black text-white tracking-tighter mb-12">₦ ${userData.earned.toLocaleString()}</h2>
                
                <div class="flex gap-4">
                    <button onclick="handlePayment('Deposit')" class="flex-1 bg-[#1E90FF] py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/30 active:scale-95 transition-all">Deposit</button>
                    <button onclick="handlePayment('Withdraw')" class="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all">Withdraw</button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-[#111827] p-6 rounded-3xl border border-white/5">
                    <p class="text-[9px] text-gray-500 font-black uppercase mb-1">Balance</p>
                    <p class="text-white font-black text-lg italic">₦ ${userData.balance.toLocaleString()}</p>
                </div>
                <div class="bg-[#111827] p-6 rounded-3xl border border-white/5">
                    <p class="text-[9px] text-gray-500 font-black uppercase mb-1">Status</p>
                    <p class="text-[#C9A227] font-black text-xs uppercase italic tracking-tighter">Elite Standard</p>
                </div>
            </div>
        </div>
    `;
}

function PlansPage() {
    if (activePlans.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center py-32 text-center">
                <div class="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-8 text-3xl italic">!</div>
                <h2 class="text-2xl font-black text-white mb-3 italic">PLANNING IN PROGRESS</h2>
                <p class="text-gray-500 text-xs px-12 leading-relaxed">Admin has not published new plans. Please check back when the market opens.</p>
            </div>
        `;
    }
    // Plan list logic here...
}

function ProfilePage() {
    return `
        <div class="animate-in fade-in duration-500 space-y-8">
            <h2 class="text-2xl font-black text-white italic uppercase tracking-tighter">User <span class="text-[#1E90FF]">Vault</span></h2>
            
            <div class="bg-[#111827] p-6 rounded-3xl border border-white/5">
                <p class="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest">Identity Details</p>
                <div class="space-y-3 text-sm">
                    <div class="flex justify-between border-b border-white/5 pb-2"><span class="text-gray-600">Name</span><span class="text-white font-bold">${userData.firstName} ${userData.lastName}</span></div>
                    <div class="flex justify-between border-b border-white/5 pb-2"><span class="text-gray-600">Email</span><span class="text-white font-bold">${userData.email}</span></div>
                    <div class="flex justify-between pb-2"><span class="text-gray-600">Location</span><span class="text-white font-bold">${userData.lga}, ${userData.state}</span></div>
                </div>
            </div>

            <div class="bg-[#111827] p-6 rounded-3xl border border-white/5">
                <p class="text-[10px] text-[#C9A227] font-black uppercase mb-4 tracking-widest">Recent Transactions</p>
                <div class="text-center py-6 text-gray-600 text-[10px] italic font-bold">No history available in vault.</div>
            </div>

            <button onclick="location.reload()" class="w-full border border-red-500/20 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-red-500/5">Terminate Session</button>
        </div>
    `;
}

// --- LOGIC ---
function handleLogin() {
    const id = document.getElementById('log_id').value;
    const pass = document.getElementById('log_pass').value;

    if (!id || !pass) {
        notify("Authorization Failed: Input Required", "red");
        return;
    }

    // Temporary logic until Backend API is called
    isLoggedIn = true;
    userData.username = id;
    switchTab('home');
    notify("Authentication Successful");
}

function handleRegister() {
    const fields = ['r_fn', 'r_ln', 'r_user', 'r_email', 'r_phone', 'r_country', 'r_state', 'r_lga', 'r_pass', 'r_cpass'];
    let valid = true;
    fields.forEach(f => { if(!document.getElementById(f).value) valid = false; });

    if(!valid) {
        notify("Error: All fields are required", "red");
        return;
    }
    
    if(document.getElementById('r_pass').value !== document.getElementById('r_cpass').value) {
        notify("Error: Passwords do not match", "red");
        return;
    }

    notify("Vault Account Created. Please Sign In.");
    switchTab('login');
}

function handlePayment(type) {
    notify(`${type} Gateway is currently processing...`, "gold");
}

// --- INITIALIZER ---
function render() {
    let content = '';
    if (currentTab === 'login') content = LoginPage();
    else if (currentTab === 'register') content = RegisterPage();
    else if (currentTab === 'home') content = HomePage();
    else if (currentTab === 'plans') content = PlansPage();
    else if (currentTab === 'profile') content = ProfilePage();
    else if (currentTab === 'invite') content = `
        <div class="text-center pt-20 animate-in zoom-in">
            <h2 class="text-4xl font-black text-white italic mb-4 uppercase italic">INVITE <span class="text-[#C9A227]">& EARN</span></h2>
            <p class="text-gray-500 text-xs px-10 leading-relaxed mb-12 uppercase tracking-widest">Get 15% commission instantly in your vault.</p>
            <div class="bg-[#111827] p-8 rounded-[40px] border border-dashed border-white/10 mx-6">
                <p class="text-[9px] text-gray-600 font-bold uppercase mb-4">Your Private Ref ID</p>
                <div class="bg-black/50 p-4 rounded-xl border border-white/5 text-[#1E90FF] font-mono text-[10px] truncate">BP-001-${userData.username}</div>
            </div>
        </div>
    `;
    else if (currentTab === 'support') content = `
        <div class="animate-in fade-in pt-10">
            <h2 class="text-3xl font-black text-white italic mb-10 uppercase">Concierge <span class="text-[#1E90FF]">Support</span></h2>
            <div class="bg-[#111827] p-6 rounded-3xl border border-white/5 h-64 flex flex-col justify-end italic text-gray-600 text-[10px] text-center">
                Security encrypted channel active.
            </div>
        </div>
    `;

    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen bg-[#0B0B0B] text-white p-6 pb-32 font-sans overflow-x-hidden selection:bg-[#1E90FF]">
            ${content}
            ${isLoggedIn ? Navigation() : ''}
        </div>
    `;
}

// First Launch
render();
