// --- CONFIGURATION & STATE ---
let currentTab = 'login'; 
const app = document.getElementById('app');

let userData = {
    username: "Investor",
    balance: 0.00,
    earned: 0.00,
    bankSet: false,
    bankName: "",
    accountNumber: "",
    referralCode: "BP-REFR-99",
    supportMessages: []
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
            <span class="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onclick="switchTab('plans')" class="flex flex-col items-center ${currentTab === 'plans' ? 'text-[#1E90FF]' : 'text-gray-500'}">
            <span class="text-[10px] font-black uppercase tracking-tighter">Plans</span>
        </button>
        <button onclick="switchTab('invite')" class="flex flex-col items-center ${currentTab === 'invite' ? 'text-[#1E90FF]' : 'text-gray-500'}">
            <span class="text-[10px] font-black uppercase tracking-tighter">Invite</span>
        </button>
        <button onclick="switchTab('support')" class="flex flex-col items-center ${currentTab === 'support' ? 'text-[#1E90FF]' : 'text-gray-500'}">
            <span class="text-[10px] font-black uppercase tracking-tighter">Support</span>
        </button>
        <button onclick="switchTab('profile')" class="flex flex-col items-center ${currentTab === 'profile' ? 'text-[#1E90FF]' : 'text-gray-500'}">
            <span class="text-[10px] font-black uppercase tracking-tighter">Profile</span>
        </button>
    </div>
`;

// --- PAGES ---

function LoginPage() {
    return `
        <div class="pt-16 animate-in fade-in zoom-in duration-500">
            <h1 class="text-5xl font-black text-white mb-2 italic tracking-tighter">BLUEPEAK<span class="text-[#1E90FF]">.</span></h1>
            <p class="text-gray-500 text-[10px] mb-12 uppercase tracking-[0.3em] font-bold">West Africa's Elite Finance</p>
            
            <div class="space-y-4">
                <input type="text" placeholder="Username" class="w-full bg-[#111827] border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF]">
                <input type="password" placeholder="Password" class="w-full bg-[#111827] border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-[#1E90FF]">
                <button onclick="switchTab('home')" class="w-full bg-[#1E90FF] py-5 rounded-2xl font-black text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all">SIGN IN</button>
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
            <div class="flex justify-between items-center mb-8">
                <div class="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-[8px] font-bold text-green-500 uppercase">Live Markets</span>
                </div>
                <p class="text-gray-500 text-[10px] font-bold uppercase tracking-widest">${userData.username}</p>
            </div>

            <div class="bg-[#111827] p-8 rounded-[40px] border border-gray-800 mb-8 relative shadow-2xl">
                <p class="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Earned</p>
                <h3 class="text-4xl font-black text-[#C9A227] mb-8 tracking-tighter">₦ ${userData.earned.toLocaleString()}</h3>
                <div class="flex gap-4">
                    <button class="flex-1 bg-[#1E90FF] py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20">Deposit</button>
                    <button class="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase">Withdraw</button>
                </div>
            </div>

            <div class="bg-[#111827] p-6 rounded-3xl border border-gray-800 flex justify-between items-center">
                <div>
                    <p class="text-[9px] text-gray-500 uppercase font-bold">Deposit Bal.</p>
                    <p class="text-white font-black">₦ ${userData.balance.toLocaleString()}</p>
                </div>
                <div class="text-right">
                    <p class="text-[9px] text-gray-500 uppercase font-bold">VIP Status</p>
                    <p class="text-[#C9A227] font-black uppercase text-xs">Standard Tier</p>
                </div>
            </div>
        </div>
    `;
}

function PlansPage() {
    return `
        <div class="animate-in slide-in-from-bottom duration-500">
            <h2 class="text-3xl font-black text-white mb-2 italic text-center">PEAK <span class="text-[#C9A227]">INVEST</span></h2>
            <p class="text-gray-500 text-[10px] mb-10 font-bold uppercase tracking-widest text-center underline decoration-[#C9A227]">Elite Opportunities</p>

            <div class="space-y-8">
                ${investmentPlans.map(plan => `
                    <div class="bg-[#111827] p-6 rounded-[35px] border-2 ${plan.best ? 'border-[#C9A227] shadow-[0_0_40px_rgba(201,162,39,0.1)]' : 'border-gray-800'} relative">
                        ${plan.best ? '<div class="absolute -top-3 left-10 bg-[#C9A227] text-black text-[9px] font-black px-5 py-1 rounded-full uppercase tracking-tighter">Elite Choice</div>' : ''}
                        <div class="flex justify-between items-center mb-6">
                            <h4 class="text-2xl font-black text-white italic">${plan.name}</h4>
                            <span class="text-[#C9A227] font-black text-2xl">${plan.roi}</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 border-t border-gray-800 pt-6 mb-6 text-center">
                            <div><p class="text-[8px] text-gray-600 uppercase">Daily</p><p class="font-bold text-white text-xs">${plan.daily}</p></div>
                            <div><p class="text-[8px] text-gray-600 uppercase">Term</p><p class="font-bold text-white text-xs">${plan.duration}</p></div>
                            <div><p class="text-[8px] text-gray-600 uppercase">Min</p><p class="font-bold text-white text-xs">₦${plan.min}</p></div>
                        </div>
                        <button class="w-full ${plan.best ? 'bg-[#C9A227] text-black' : 'bg-[#1E90FF] text-white'} py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">Invest Now</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function ProfilePage() {
    return `
        <div class="animate-in fade-in duration-500">
            <h2 class="text-2xl font-black text-white mb-8 italic">PROFILE <span class="text-[#1E90FF]">SECURITY</span></h2>
            
            <div class="bg-[#111827] p-6 rounded-3xl border border-gray-800 mb-6">
                <h3 class="text-[10px] font-black text-[#C9A227] uppercase mb-6 tracking-[0.2em]">Bank Details (Locked)</h3>
                <div class="space-y-5">
                    <div>
                        <label class="text-[9px] text-gray-600 uppercase mb-2 block font-bold">Bank Name</label>
                        <input type="text" id="bankName" ${userData.bankSet ? 'disabled' : ''} value="${userData.bankName}" placeholder="e.g. Access Bank" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white text-sm outline-none disabled:opacity-30">
                    </div>
                    <div>
                        <label class="text-[9px] text-gray-600 uppercase mb-2 block font-bold">Account Number</label>
                        <input type="number" id="accNum" ${userData.bankSet ? 'disabled' : ''} value="${userData.accountNumber}" placeholder="0000000000" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white text-sm outline-none disabled:opacity-30">
                    </div>
                    <div>
                        <label class="text-[9px] text-gray-600 uppercase mb-2 block font-bold">Withdrawal PIN</label>
                        <input type="password" maxlength="4" placeholder="••••" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white text-sm outline-none">
                    </div>
                    
                    ${!userData.bankSet ? `
                        <button onclick="saveBank()" class="w-full bg-[#C9A227] text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-widest mt-4">Save & Lock</button>
                    ` : `
                        <div class="text-center p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/20">
                            <p class="text-yellow-600 text-[9px] font-bold uppercase tracking-tighter italic">Details Secured.</p>
                        </div>
                    `}
                </div>
            </div>
            <button onclick="switchTab('login')" class="w-full border border-gray-800 text-gray-600 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest">Logout</button>
        </div>
    `;
}

function SupportPage() {
    return `
        <div class="animate-in fade-in duration-500">
            <h2 class="text-2xl font-black text-white mb-2 italic">SUPPORT <span class="text-[#1E90FF]">CENTER</span></h2>
            <div class="bg-[#111827] p-6 rounded-3xl border border-gray-800 mb-6 h-64 overflow-y-auto space-y-4 flex flex-col" id="chatBox">
                <div class="bg-gray-800 p-3 rounded-2xl rounded-bl-none self-start max-w-[80%]">
                    <p class="text-[11px] text-white">How can we assist you today?</p>
                </div>
                ${userData.supportMessages.map(msg => `
                    <div class="bg-[#1E90FF] p-3 rounded-2xl rounded-br-none self-end max-w-[80%]">
                        <p class="text-[11px] text-white">${msg}</p>
                    </div>
                `).join('')}
            </div>

            <div class="flex gap-2">
                <input type="text" id="supportInput" placeholder="Message agent..." class="flex-1 bg-[#111827] border border-gray-800 p-4 rounded-2xl text-white text-xs outline-none">
                <button onclick="sendMessage()" class="bg-[#1E90FF] w-12 h-12 rounded-2xl flex items-center justify-center font-bold">↑</button>
            </div>
        </div>
    `;
}

function InvitePage() {
    return `
        <div class="text-center py-10 animate-in zoom-in duration-300">
            <div class="w-24 h-24 bg-[#C9A227]/5 border border-[#C9A227]/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <span class="text-4xl">💎</span>
            </div>
            <h2 class="text-3xl font-black text-white mb-4 italic uppercase">Invite & <span class="text-[#C9A227]">Earn</span></h2>
            <p class="text-gray-500 text-xs mb-12 px-6">Earn <span class="text-white font-bold">15% commission</span> on every deposit.</p>
            
            <div class="bg-[#111827] p-6 rounded-[35px] border border-dashed border-gray-800 mx-4 mb-10 text-center">
                <p class="text-[9px] text-gray-600 font-bold uppercase mb-4 tracking-widest">Your Private Link</p>
                <div class="bg-black/50 p-4 rounded-2xl flex justify-between items-center border border-gray-800">
                    <span class="text-[9px] font-mono text-blue-400 truncate">bluepeak-finance.onrender.com/ref?id=${userData.referralCode}</span>
                    <button onclick="alert('Copied')" class="text-[#C9A227] font-black text-[10px] uppercase pl-4">Copy</button>
                </div>
            </div>
        </div>
    `;
}

// --- LOGIC ---
function saveBank() {
    const name = document.getElementById('bankName').value;
    const num = document.getElementById('accNum').value;
    if(!name || !num) return alert("All fields are mandatory.");
    userData.bankName = name;
    userData.accountNumber = num;
    userData.bankSet = true;
    render();
}

function sendMessage() {
    const input = document.getElementById('supportInput');
    if(!input.value) return;
    userData.supportMessages.push(input.value);
    input.value = '';
    render();
}

// --- MAIN RENDER ---
function render() {
    let content = '';
    if (currentTab === 'login') content = LoginPage();
    if (currentTab === 'home') content = HomePage();
    if (currentTab === 'plans') content = PlansPage();
    if (currentTab === 'profile') content = ProfilePage();
    if (currentTab === 'invite') content = InvitePage();
    if (currentTab === 'support') content = SupportPage();

    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen bg-[#0B0B0B] text-white p-6 pb-32">
            ${content}
            ${currentTab !== 'login' ? Navigation() : ''}
        </div>
    `;
}

render();
