// --- CONFIGURATION & STATE ---
let currentTab = 'login'; // Start users at the login screen
const app = document.getElementById('app');

// User State (In a real app, this data comes from your MongoDB via API)
let userData = {
    username: "Westpablo",
    balance: 0.00,
    earned: 0.00,
    bankSet: false, // Set to true once they save bank details
    bankName: "",
    accountNumber: "",
    referralCode: "BP-99281"
};

const investmentPlans = [
    { id: 1, name: 'Starter Peak', roi: '15%', duration: '7 Days', min: '3,000', best: false, daily: '₦214' },
    { id: 2, name: 'Summit Gold', roi: '40%', duration: '14 Days', min: '50,000', best: true, daily: '₦1,428' },
    { id: 3, name: 'Apex Ridge', roi: '90%', duration: '30 Days', min: '200,000', best: false, daily: '₦6,000' }
];

// --- NAVIGATION ENGINE ---
function switchTab(tab) {
    currentTab = tab;
    render();
    window.scrollTo(0,0);
}

// --- COMPONENTS ---

const Navigation = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#111827]/95 backdrop-blur-xl border-t border-gray-800 p-4 flex justify-around items-center z-50">
        <button onclick="switchTab('home')" class="flex flex-col items-center ${currentTab === 'home' ? 'text-[#1E90FF]' : 'text-gray-500'}">
            <span class="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </button>
        <button onclick="switchTab('plans')" class="flex flex-col items-center ${currentTab === 'plans' ? 'text-[#1E90FF]' : 'text-gray-500'}">
            <span class="text-[10px] font-bold uppercase tracking-tighter">Plans</span>
        </button>
        <button onclick="switchTab('invite')" class="flex flex-col items-center ${currentTab === 'invite' ? 'text-[#1E90FF]' : 'text-gray-500'}">
            <span class="text-[10px] font-bold uppercase tracking-tighter">Invite</span>
        </button>
        <button onclick="switchTab('profile')" class="flex flex-col items-center ${currentTab === 'profile' ? 'text-[#1E90FF]' : 'text-gray-500'}">
            <span class="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
        </button>
    </div>
`;

// --- PAGES ---

function LoginPage() {
    return `
        <div class="pt-12 animate-in fade-in zoom-in duration-500">
            <h1 class="text-4xl font-black text-white mb-2 italic">BLUEPEAK<span class="text-[#1E90FF]">.</span></h1>
            <p class="text-gray-500 text-sm mb-12 uppercase tracking-widest font-bold">West Africa's Elite Finance</p>
            
            <div class="space-y-4">
                <input type="text" placeholder="Username" class="w-full bg-[#111827] border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF] transition-all">
                <input type="password" placeholder="Password" class="w-full bg-[#111827] border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF] transition-all">
                <button onclick="switchTab('home')" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">LOGIN</button>
                
                <div class="flex items-center py-4">
                    <div class="flex-1 h-[1px] bg-gray-800"></div>
                    <span class="px-4 text-gray-600 text-[10px] font-bold uppercase">Safe Access</span>
                    <div class="flex-1 h-[1px] bg-gray-800"></div>
                </div>

                <button class="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3">
                    <img src="https://www.svgrepo.com/show/355037/google.svg" class="w-5 h-5"> Google Login
                </button>
            </div>
        </div>
    `;
}

function HomePage() {
    return `
        <div class="animate-in fade-in duration-500">
            <div class="flex justify-between items-center mb-10">
                <h2 class="font-black text-xl italic text-white underline decoration-[#1E90FF]">DASHBOARD</h2>
                <div class="h-10 w-10 bg-[#111827] border border-gray-800 rounded-full flex items-center justify-center text-[#C9A227] font-bold">WP</div>
            </div>

            <div class="bg-[#111827] p-8 rounded-[32px] border border-gray-800 mb-8 shadow-2xl relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-[#1E90FF]/10 blur-3xl rounded-full"></div>
                <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Portfolio Value</p>
                <h3 class="text-4xl font-black text-white mb-8">₦ ${userData.balance.toLocaleString()}</h3>
                <div class="flex gap-4">
                    <button class="flex-1 bg-[#1E90FF] py-4 rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all">DEPOSIT</button>
                    <button class="flex-1 bg-white text-black py-4 rounded-2xl font-bold text-xs active:scale-95 transition-all">WITHDRAW</button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="bg-[#111827] p-5 rounded-2xl border border-gray-800">
                    <p class="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Earned</p>
                    <p class="text-[#C9A227] font-black italic">₦ ${userData.earned}</p>
                </div>
                <div class="bg-[#111827] p-5 rounded-2xl border border-gray-800">
                    <p class="text-[10px] text-gray-500 font-bold uppercase mb-1">Active Plans</p>
                    <p class="text-white font-black italic text-lg">0</p>
                </div>
            </div>
        </div>
    `;
}

function PlansPage() {
    return `
        <div class="animate-in slide-in-from-bottom duration-500">
            <h2 class="text-3xl font-black text-white mb-2 italic">PEAK <span class="text-[#C9A227]">PLANS</span></h2>
            <p class="text-gray-500 text-xs mb-10 font-bold uppercase">Locked Profit Opportunities</p>

            <div class="space-y-8">
                ${investmentPlans.map(plan => `
                    <div class="bg-[#111827] p-6 rounded-[32px] border-2 ${plan.best ? 'border-[#C9A227] shadow-[0_0_30px_rgba(201,162,39,0.15)]' : 'border-gray-800'} relative">
                        ${plan.best ? '<div class="absolute -top-4 right-8 bg-[#C9A227] text-black text-[10px] font-black px-6 py-1 rounded-full uppercase tracking-tighter">Elite Pick</div>' : ''}
                        <h4 class="text-2xl font-black text-white mb-1">${plan.name}</h4>
                        <p class="text-[#1E90FF] font-black text-3xl mb-6">${plan.roi} <span class="text-[10px] text-gray-500 font-normal uppercase italic tracking-widest">Net Return</span></p>
                        
                        <div class="flex justify-between border-t border-gray-800 pt-6 mb-6">
                            <div><p class="text-[9px] text-gray-500 uppercase">Daily</p><p class="font-bold text-white">${plan.daily}</p></div>
                            <div><p class="text-[9px] text-gray-500 uppercase">Term</p><p class="font-bold text-white">${plan.duration}</p></div>
                            <div><p class="text-[9px] text-gray-500 uppercase">Min</p><p class="font-bold text-white">₦${plan.min}</p></div>
                        </div>

                        <button class="w-full ${plan.best ? 'bg-[#C9A227] text-black' : 'bg-white text-black'} py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Purchase Plan</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function ProfilePage() {
    return `
        <div class="animate-in fade-in duration-500">
            <h2 class="text-2xl font-black text-white mb-8 italic">USER <span class="text-[#1E90FF]">PROFILE</span></h2>
            
            <div class="bg-[#111827] p-6 rounded-3xl border border-gray-800 mb-6">
                <h3 class="text-xs font-black text-[#C9A227] uppercase mb-6 tracking-widest">Bank Verification (LOCKED)</h3>
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] text-gray-500 uppercase mb-2 block">Bank Name</label>
                        <input type="text" id="bankName" ${userData.bankSet ? 'disabled' : ''} value="${userData.bankName}" placeholder="e.g. GTBank" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white outline-none disabled:opacity-50">
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-500 uppercase mb-2 block">Account Number</label>
                        <input type="number" id="accNum" ${userData.bankSet ? 'disabled' : ''} value="${userData.accountNumber}" placeholder="0000000000" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white outline-none disabled:opacity-50">
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-500 uppercase mb-2 block">Withdrawal PIN</label>
                        <input type="password" maxlength="4" placeholder="4-Digit PIN" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white outline-none">
                    </div>
                    
                    ${!userData.bankSet ? `
                        <button onclick="saveBank()" class="w-full bg-[#C9A227] text-black font-black py-4 rounded-xl text-xs mt-4">SAVE & LOCK DETAILS</button>
                    ` : `
                        <div class="text-center py-2 px-4 bg-red-500/10 rounded-lg border border-red-500/20">
                            <p class="text-red-500 text-[10px] font-bold">Details are locked. Contact support to change.</p>
                        </div>
                    `}
                </div>
            </div>
            
            <button onclick="switchTab('login')" class="w-full border border-gray-800 text-gray-500 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest mt-4">Logout Account</button>
        </div>
    `;
}

function InvitePage() {
    return `
        <div class="text-center py-10 animate-in zoom-in duration-300">
            <div class="w-24 h-24 bg-[#C9A227]/5 border border-[#C9A227]/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <span class="text-4xl">💎</span>
            </div>
            <h2 class="text-3xl font-black text-white mb-4">REFERRAL <span class="text-[#C9A227]">ELITE</span></h2>
            <p class="text-gray-500 text-sm mb-12 px-6">Invite your network and secure <span class="text-white font-bold">15% instant commission</span> on their deposits.</p>
            
            <div class="bg-[#111827] p-6 rounded-3xl border border-dashed border-gray-700 mx-4 mb-10">
                <p class="text-[10px] text-gray-500 font-bold uppercase mb-4 tracking-tighter">Copy Exclusive Invite Link</p>
                <div class="bg-black/50 p-4 rounded-xl flex justify-between items-center border border-gray-800">
                    <span class="text-[10px] font-mono text-blue-400 truncate">bluepeak.com/ref/${userData.referralCode}</span>
                    <button onclick="alert('Copied to Clipboard')" class="text-[#C9A227] font-black text-[10px] uppercase pl-4">Copy</button>
                </div>
            </div>
            
            <div class="flex justify-around px-10">
                <div><p class="text-2xl font-black text-white">0</p><p class="text-[9px] text-gray-600 uppercase">Invites</p></div>
                <div class="w-[1px] bg-gray-800"></div>
                <div><p class="text-2xl font-black text-[#C9A227]">₦0</p><p class="text-[9px] text-gray-600 uppercase">Earned</p></div>
            </div>
        </div>
    `;
}

// --- LOGIC ---
function saveBank() {
    const name = document.getElementById('bankName').value;
    const num = document.getElementById('accNum').value;
    if(!name || !num) return alert("Please fill all details");
    
    // Simulate saving to DB
    userData.bankName = name;
    userData.accountNumber = num;
    userData.bankSet = true;
    
    alert("Bank Details Secured & Locked Successfully");
    render();
}

// --- RENDER ENGINE ---
function render() {
    let content = '';
    if (currentTab === 'login') content = LoginPage();
    if (currentTab === 'home') content = HomePage();
    if (currentTab === 'plans') content = PlansPage();
    if (currentTab === 'profile') content = ProfilePage();
    if (currentTab === 'invite') content = InvitePage();

    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen bg-[#0B0B0B] text-white p-6 pb-32">
            ${content}
            ${currentTab !== 'login' ? Navigation() : ''}
        </div>
    `;
}

// Launch
render();
