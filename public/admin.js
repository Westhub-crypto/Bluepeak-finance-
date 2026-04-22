const API_URL = window.location.origin;
let currentAdminTab = 'overview';
const app = document.getElementById('admin-app');

// State
let stats = { totalUsers: 0, totalDeposits: 0, totalEarned: 0 };
let users = [];
let platformPlans = [];

// --- ENGINE ---
function switchTab(tab) {
    currentAdminTab = tab;
    render();
}

function notify(msg, type = "gold") {
    const toast = document.createElement('div');
    toast.className = `fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl font-black text-[10px] shadow-2xl ${type === 'gold' ? 'bg-[#C9A227] text-black' : 'bg-red-600 text-white'}`;
    toast.innerText = msg.toUpperCase();
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- ACTIONS ---
async function handleTopUp() {
    const user = document.getElementById('target_user').value;
    const amount = document.getElementById('topup_amount').value;
    const type = document.getElementById('topup_type').value;

    if(!user || !amount) return notify("Input required", "red");
    
    notify(`Crediting ₦${amount} to ${user}...`);
    // Here you would fetch(`${API_URL}/api/admin/topup-user`, ...)
}

async function handleAddPlan() {
    notify("Publishing Plan to Market...");
}

// --- UI COMPONENTS ---
const AdminNav = () => `
    <div class="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar">
        ${['overview', 'users', 'plans', 'support'].map(t => `
            <button onclick="switchTab('${t}')" class="px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${currentAdminTab === t ? 'bg-[#1E90FF] text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 border border-white/5'}">
                ${t}
            </button>
        `).join('')}
    </div>
`;

function Overview() {
    return `
        <div class="animate-in fade-in duration-500">
            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="glass p-6 rounded-[30px]">
                    <p class="text-[9px] text-gray-500 font-bold uppercase mb-1">Total Users</p>
                    <p class="text-2xl font-black text-white">1,204</p>
                </div>
                <div class="glass p-6 rounded-[30px]">
                    <p class="text-[9px] text-gray-500 font-bold uppercase mb-1">System Earnings</p>
                    <p class="text-2xl font-black text-[#C9A227]">₦ 4.2M</p>
                </div>
            </div>
            
            <div class="glass p-8 rounded-[40px] border-l-4 border-l-[#1E90FF]">
                <h3 class="text-xs font-black text-white uppercase mb-6">Quick User Credit</h3>
                <div class="space-y-4">
                    <input type="text" id="target_user" placeholder="Username" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="number" id="topup_amount" placeholder="Amount (₦)" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <select id="topup_type" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-gray-400 text-xs outline-none">
                        <option value="deposit">Deposit Balance</option>
                        <option value="earned">Earned Balance</option>
                    </select>
                    <button onclick="handleTopUp()" class="w-full bg-[#1E90FF] py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20">Authorize Credit</button>
                </div>
            </div>
        </div>
    `;
}

function PlanManager() {
    return `
        <div class="animate-in slide-in-from-bottom duration-500">
            <div class="glass p-8 rounded-[40px] mb-8">
                <h3 class="text-xs font-black text-[#C9A227] uppercase mb-6 text-center">Architect New Plan</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <input type="text" placeholder="Plan Name" class="col-span-2 bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="number" placeholder="Min Deposit" class="bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="number" placeholder="Daily %" class="bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="number" placeholder="Days" class="bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <select class="bg-black/40 border border-white/10 p-4 rounded-xl text-gray-400 text-xs outline-none">
                        <option>Standard</option>
                        <option>Elite (Gold Border)</option>
                    </select>
                </div>
                <button onclick="handleAddPlan()" class="w-full bg-[#C9A227] text-black py-4 rounded-xl font-black text-[10px] uppercase">Publish to Live Market</button>
            </div>
            
            <h4 class="text-[10px] text-gray-600 font-bold uppercase mb-4 pl-4 tracking-widest">Active Market Offerings</h4>
            <div class="space-y-3">
                <div class="glass p-5 rounded-2xl flex justify-between items-center border-l-2 border-l-green-500">
                    <div>
                        <p class="text-white font-bold text-xs italic">Starter Peak</p>
                        <p class="text-[8px] text-gray-500">15% ROI • 7 Days</p>
                    </div>
                    <button class="text-red-500 text-[9px] font-black uppercase">Delete</button>
                </div>
            </div>
        </div>
    `;
}

function SupportCenter() {
    return `
        <div class="animate-in fade-in duration-500">
            <h2 class="text-xs font-black text-[#1E90FF] uppercase mb-6 pl-2">Compliance Queue</h2>
            <div class="glass p-6 rounded-[32px] border-l-2 border-l-yellow-500 mb-4">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-[9px] text-blue-400 font-bold uppercase">User: Westpablo</span>
                    <span class="text-[8px] text-gray-600">Pending</span>
                </div>
                <p class="text-white text-xs italic mb-4 leading-relaxed">"Help, I forgot my withdrawal PIN. I need to verify my account."</p>
                <textarea class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-[10px] h-24 outline-none mb-4" placeholder="Type official staff response..."></textarea>
                <button onclick="notify('Reply Sent')" class="w-full bg-white text-black py-3 rounded-xl font-black text-[9px] uppercase">Send Professional Reply</button>
            </div>
        </div>
    `;
}

// --- MASTER RENDER ---
function render() {
    let content = '';
    if (currentAdminTab === 'overview') content = Overview();
    if (currentAdminTab === 'users') content = `<div class="p-10 text-center text-gray-600 font-bold text-[10px] uppercase">User list encrypted. Fetching...</div>`;
    if (currentAdminTab === 'plans') content = PlanManager();
    if (currentAdminTab === 'support') content = SupportCenter();

    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen p-6 pb-20">
            <div class="flex justify-between items-center mb-10">
                <h1 class="text-xl font-black italic tracking-tighter text-white uppercase">Control <span class="text-[#C9A227]">Vault</span></h1>
                <a href="/" class="text-[9px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-500 font-bold uppercase">Live Site</a>
            </div>
            ${AdminNav()}
            ${content}
        </div>
    `;
}

render();
