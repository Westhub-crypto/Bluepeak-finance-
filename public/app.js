// --- STATE MANAGEMENT ---
let currentTab = 'login'; 
let isLoggedIn = false;
const app = document.getElementById('app');

// Local Data Store
let userData = {
    firstName: "", last name: "", username: "", email: "", 
    contact: "", country: "", state: "", lga: "",
    balance: 0, earned: 0, bankSet: false
};

let activePlans = []; // Empty until Admin adds them

// --- CORE ENGINE ---
function switchTab(tab) {
    if (!isLoggedIn && tab !== 'login' && tab !== 'register') return;
    currentTab = tab;
    render();
    window.scrollTo(0,0);
}

// Custom Notification (Replaces ugly browser alerts)
function notify(msg, type = "gold") {
    const toast = document.createElement('div');
    toast.className = `fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold text-xs shadow-2xl animate-bounce ${type === 'gold' ? 'bg-[#C9A227] text-black' : 'bg-red-600 text-white'}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- UI COMPONENTS ---
const Navigation = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#0B0B0B]/80 backdrop-blur-2xl border-t border-white/5 p-4 flex justify-around items-center z-50">
        ${['home', 'plans', 'invite', 'support', 'profile'].map(t => `
            <button onclick="switchTab('${t}')" class="flex flex-col items-center ${currentTab === t ? 'text-[#1E90FF]' : 'text-gray-500'}">
                <span class="text-[9px] font-black uppercase tracking-tighter">${t}</span>
            </button>
        `).join('')}
    </div>
`;

// --- PAGES ---

function RegisterPage() {
    return `
        <div class="pt-8 pb-20 animate-in fade-in duration-500">
            <h1 class="text-3xl font-black text-white italic mb-2">CREATE <span class="text-[#1E90FF]">ACCOUNT</span></h1>
            <p class="text-gray-500 text-[10px] uppercase tracking-widest mb-8">Join the elite investment circle</p>
            
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="reg_fn" placeholder="First Name" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="text" id="reg_ln" placeholder="Last Name" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="text" id="reg_user" placeholder="Username" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="email" id="reg_email" placeholder="Email Address" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="tel" id="reg_phone" placeholder="Phone (e.g. +234)" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                
                <select id="reg_country" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                    <option value="">Country</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                </select>
                <input type="text" id="reg_state" placeholder="State" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="text" id="reg_lga" placeholder="LGA" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                
                <input type="password" id="reg_pass" placeholder="Password" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
                <input type="password" id="reg_confirm" placeholder="Confirm" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-sm outline-none">
            </div>

            <button onclick="handleRegister()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white shadow-xl shadow-blue-500/20 mt-8 active:scale-95 transition-all">REGISTER NOW</button>
            <p onclick="switchTab('login')" class="text-center text-gray-500 text-xs mt-6">Already a member? <span class="text-[#C9A227] font-bold underline">Login</span></p>
        </div>
    `;
}

function LoginPage() {
    return `
        <div class="pt-24 animate-in zoom-in duration-500 max-w-sm mx-auto">
            <div class="text-center mb-12">
                <h1 class="text-5xl font-black text-white italic tracking-tighter">BLUEPEAK<span class="text-[#1E90FF]">.</span></h1>
                <p class="text-gray-500 text-[9px] uppercase tracking-[0.4em] mt-2 font-bold">Elite West Africa Finance</p>
            </div>
            
            <div class="space-y-4">
                <div class="relative">
                    <input type="text" id="login_id" placeholder="Username or Email" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF] transition-all">
                </div>
                <div class="relative">
                    <input type="password" id="login_pass" placeholder="Password" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF] transition-all">
                </div>
                
                <button onclick="handleLogin()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white shadow-2xl shadow-blue-500/40 active:scale-95 transition-all mt-4">SECURE SIGN IN</button>
                
                <p onclick="switchTab('register')" class="text-center text-gray-500 text-xs mt-8">New to BluePeak? <span class="text-[#C9A227] font-bold underline">Create Elite Account</span></p>
            </div>
        </div>
    `;
}

function HomePage() {
    return `
        <div class="animate-in fade-in duration-700">
            <div class="flex justify-between items-center mb-10">
                <div class="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-[9px] font-black text-gray-300 uppercase">Live Market</span>
                </div>
                <span class="text-[10px] font-black text-[#C9A227] uppercase tracking-widest">${userData.username}</span>
            </div>

            <div class="bg-gradient-to-br from-[#111827] to-[#0B0B0B] p-10 rounded-[40px] border border-white/10 shadow-2xl mb-8 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-[#1E90FF]/10 blur-[80px]"></div>
                <p class="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Total Earnings</p>
                <h2 class="text-5xl font-black text-white tracking-tighter mb-10">₦ ${userData.earned.toLocaleString()}</h2>
                
                <div class="flex gap-4">
                    <button onclick="handleAction('Deposit')" class="flex-1 bg-[#1E90FF] py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Deposit</button>
                    <button onclick="handleAction('Withdraw')" class="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all">Withdraw</button>
                </div>
            </div>

            <div class="bg-[#111827]/50 p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                <div>
                    <p class="text-[9px] text-gray-500 font-black uppercase mb-1">Available Balance</p>
                    <p class="text-white font-black text-xl">₦ ${userData.balance.toLocaleString()}</p>
                </div>
                <div class="text-right">
                    <p class="text-[9px] text-gray-500 font-black uppercase mb-1">Status</p>
                    <p class="text-[#C9A227] font-black text-xs uppercase italic">VIP ${userData.balance > 100000 ? 'GOLD' : 'STANDARD'}</p>
                </div>
            </div>
        </div>
    `;
}

function PlansPage() {
    if (activePlans.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center py-20 text-center">
                <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 italic text-2xl">?</div>
                <h2 class="text-xl font-black text-white mb-2">No Active Plans</h2>
                <p class="text-gray-500 text-xs px-10">Our analysts are currently preparing new elite investment opportunities. Check back shortly.</p>
            </div>
        `;
    }
    // ... Plan rendering logic here (will only show if activePlans has data)
}

// --- LOGIC HANDLERS ---

function handleLogin() {
    const id = document.getElementById('login_id').value;
    const pass = document.getElementById('login_pass').value;

    if (!id || !pass) {
        notify("Access Denied: Missing Credentials", "red");
        return;
    }

    // This is where you'd call your actual backend API
    isLoggedIn = true;
    userData.username = id;
    switchTab('home');
    notify(`Welcome back, ${id}`);
}

function handleRegister() {
    const fields = ['reg_fn', 'reg_ln', 'reg_user', 'reg_email', 'reg_phone', 'reg_country', 'reg_pass'];
    let empty = false;
    fields.forEach(f => { if(!document.getElementById(f).value) empty = true; });

    if(empty) {
        notify("Error: All fields are mandatory", "red");
        return;
    }

    notify("Registration Successful! Please Login.");
    switchTab('login');
}

function handleAction(type) {
    notify(`${type} Gateway is being initialized...`, "gold");
}

// Initial Render
render();
function render() {
    let content = '';
    if (currentTab === 'login') content = LoginPage();
    else if (currentTab === 'register') content = RegisterPage();
    else if (currentTab === 'home') content = HomePage();
    else if (currentTab === 'plans') content = PlansPage();
    // ... other tabs

    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen p-6 pb-32">
            ${content}
            ${isLoggedIn ? Navigation() : ''}
        </div>
    `;
}
