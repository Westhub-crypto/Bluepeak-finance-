// --- APP STATE ---
let currentTab = 'login'; 
let isLoggedIn = false;
const app = document.getElementById('app');

// Local Data Store
let userData = {
    username: "", balance: 0, earned: 0, referrals: 0, refEarnings: 0,
    firstName: "", lastName: "", phone: "", country: "", state: "", lga: "",
    bankName: "", accountNum: "", isLocked: false, transactions: []
};

let activePlans = []; // EMPTY BY DEFAULT

// --- CORE ENGINE ---
function switchTab(tab) {
    if (!isLoggedIn && tab !== 'login' && tab !== 'register') {
        notify("Authentication Required", "red");
        return;
    }
    currentTab = tab;
    render();
    window.scrollTo(0,0);
}

function notify(msg, type = "gold") {
    const toast = document.createElement('div');
    toast.className = `fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl font-black text-[10px] shadow-2xl animate-bounce ${type === 'gold' ? 'bg-[#C9A227] text-black' : 'bg-red-600 text-white'}`;
    toast.innerText = msg.toUpperCase();
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// --- LOGIC HANDLERS ---
function handleLogin() {
    const user = document.getElementById('l_user').value;
    const pass = document.getElementById('l_pass').value;
    if (!user || !pass) return notify("Missing Credentials", "red");
    
    // Logic for Login
    isLoggedIn = true;
    userData.username = user;
    notify("Access Granted");
    switchTab('home');
}

function handleRegister() {
    const fields = ['r_fn', 'r_ln', 'r_user', 'r_email', 'r_phone', 'r_state', 'r_lga', 'r_pass', 'r_cpass'];
    let valid = true;
    fields.forEach(id => { if(!document.getElementById(id).value) valid = false; });
    
    if(!valid) return notify("All fields required", "red");
    if(document.getElementById('r_pass').value !== document.getElementById('r_cpass').value) return notify("Passwords mismatch", "red");

    notify("Vault Created. Please Sign In.");
    switchTab('login');
}

// --- UI COMPONENTS ---
const Navigation = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#0B0B0B]/90 backdrop-blur-2xl border-t border-white/5 p-4 flex justify-around items-center z-50">
        ${['home', 'plans', 'track', 'invite', 'profile'].map(t => `
            <button onclick="switchTab('${t}')" class="flex flex-col items-center ${currentTab === t ? 'text-[#1E90FF]' : 'text-gray-600'}">
                <span class="text-[8px] font-black uppercase tracking-widest">${t}</span>
            </button>
        `).join('')}
    </div>
`;

// --- PAGES ---
function LoginPage() {
    return `
        <div class="pt-20 animate-in zoom-in">
            <div class="text-center mb-16">
                <h1 class="text-5xl font-black text-white italic tracking-tighter">BLUEPEAK<span class="text-[#1E90FF]">.</span></h1>
                <p class="text-gray-500 text-[9px] uppercase tracking-[0.4em] font-bold mt-2">Elite African Finance</p>
            </div>
            <div class="space-y-4">
                <input type="text" id="l_user" placeholder="Username or Email" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF]">
                <input type="password" id="l_pass" placeholder="Password" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF]">
                <button onclick="handleLogin()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all mt-4">SIGN IN</button>
                <p class="text-center text-gray-500 text-[9px] mt-8 uppercase font-bold tracking-widest cursor-pointer" onclick="switchTab('register')">Create Elite Account</p>
            </div>
        </div>
    `;
}

function RegisterPage() {
    return `
        <div class="pt-10 pb-24 animate-in slide-in-from-bottom">
            <h2 class="text-2xl font-black text-white italic mb-8 uppercase">Establish <span class="text-[#1E90FF]">Vault</span></h2>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <input type="text" id="r_fn" placeholder="First Name" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="text" id="r_ln" placeholder="Last Name" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="text" id="r_user" placeholder="Username" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="email" id="r_email" placeholder="Email" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="tel" id="r_phone" placeholder="Phone" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <select id="r_country" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none"><option>Nigeria</option><option>Ghana</option></select>
                <input type="text" id="r_state" placeholder="State" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="text" id="r_lga" placeholder="LGA" class="col-span-2 bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="password" id="r_pass" placeholder="Password" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
                <input type="password" id="r_cpass" placeholder="Confirm" class="bg-[#111827] border border-white/5 p-4 rounded-xl text-white text-xs outline-none">
            </div>
            <button onclick="handleRegister()" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl">Register Account</button>
            <p onclick="switchTab('login')" class="text-center text-gray-500 text-[9px] mt-6 uppercase font-bold underline">Back to Login</p>
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

            <div class="bg-gradient-to-br from-[#111827] to-[#0B0B0B] p-10 rounded-[45px] border border-white/10 shadow-2xl mb-10">
                <p class="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em] mb-4">Earned Profit</p>
                <h2 class="text-5xl font-black text-white tracking-tighter mb-12">₦ ${userData.earned.toLocaleString()}</h2>
                <div class="flex gap-4">
                    <button onclick="notify('Deposit Initialized')" class="flex-1 bg-[#1E90FF] py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/30 active:scale-95">Deposit</button>
                    <button onclick="notify('Withdrawal Initialized')" class="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase active:scale-95">Withdraw</button>
                </div>
            </div>

            <div class="bg-[#111827] p-6 rounded-3xl border border-white/5 flex justify-between">
                <div><p class="text-[8px] text-gray-500 uppercase font-black">Deposit Bal.</p><p class="text-white font-black text-lg italic">₦ ${userData.balance}</p></div>
                <div class="text-right"><p class="text-[8px] text-gray-500 uppercase font-black">Status</p><p class="text-[#C9A227] font-black text-[10px] uppercase italic">Elite</p></div>
            </div>
        </div>
    `;
}

function PlansPage() {
    return `
        <div class="flex flex-col items-center justify-center py-32 text-center opacity-50">
            <div class="text-4xl mb-6 italic">💎</div>
            <h2 class="text-xl font-black text-white mb-2 uppercase">Awaiting Plans</h2>
            <p class="text-[10px] text-gray-500 px-12 leading-relaxed tracking-widest">NO ACTIVE PLANS PUBLISHED BY ADMIN. PLEASE CHECK BACK LATER.</p>
        </div>
    `;
}

function ProfilePage() {
    return `
        <div class="animate-in fade-in space-y-8">
            <h2 class="text-2xl font-black text-white italic uppercase tracking-tighter">Account <span class="text-[#1E90FF]">Vault</span></h2>
            <div class="bg-[#111827] p-6 rounded-3xl border border-white/5">
                <p class="text-[9px] text-gray-500 font-black uppercase mb-4 tracking-widest italic">Personal Data</p>
                <div class="space-y-3 text-[11px]">
                    <div class="flex justify-between border-b border-white/5 pb-2"><span class="text-gray-600 uppercase">User</span><span class="text-white font-bold">${userData.username}</span></div>
                    <div class="flex justify-between border-b border-white/5 pb-2"><span class="text-gray-600 uppercase">Status</span><span class="text-green-500 font-bold uppercase tracking-tighter">Active</span></div>
                </div>
            </div>
            <div class="bg-[#111827] p-6 rounded-3xl border border-white/5">
                <p class="text-[9px] text-[#C9A227] font-black uppercase mb-4 tracking-widest italic">Bank Lockdown</p>
                <div class="space-y-4">
                    <input type="text" placeholder="Bank Name" class="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white text-[10px] outline-none">
                    <input type="number" placeholder="Account Number" class="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-white text-[10px] outline-none">
                    <button class="w-full bg-[#C9A227] text-black font-black py-4 rounded-xl text-[9px] uppercase">Lock Account Details</button>
                </div>
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
    else if (currentTab === 'plans') content = PlansPage();
    else if (currentTab === 'profile') content = ProfilePage();
    else if (currentTab === 'invite') content = `
        <div class="text-center pt-20 animate-in zoom-in">
            <h2 class="text-4xl font-black text-white italic mb-4 uppercase">INVITE <span class="text-[#C9A227]">& EARN</span></h2>
            <div class="bg-[#111827] p-8 rounded-[40px] border border-dashed border-white/10 mx-6">
                <p class="text-[9px] text-gray-600 font-bold uppercase mb-4 tracking-widest">Ref Link</p>
                <div class="bg-black/50 p-4 rounded-xl border border-white/5 text-[#1E90FF] font-mono text-[9px] truncate">bluepeak.com/ref?id=${userData.username}</div>
            </div>
        </div>
    `;
    else if (currentTab === 'track') content = `
        <div class="py-20 text-center opacity-30">
            <p class="text-xs font-black uppercase tracking-widest">No active investments found.</p>
        </div>
    `;

    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen bg-[#0B0B0B] text-white p-6 pb-32">
            ${content}
            ${isLoggedIn ? Navigation() : ''}
        </div>
    `;
}

render();
