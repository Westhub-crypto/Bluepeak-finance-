const API_URL = window.location.origin;
let currentAdminTab = 'overview';
let isAdminAuth = false; 
const app = document.getElementById('admin-app');

// State
let stats = { totalUsers: 0, totalEarned: 0 };
let activePlans = [];

// --- ENGINE & SECURITY ---
function switchTab(tab) {
    currentAdminTab = tab;
    render();
    window.scrollTo(0,0);
}

function notify(msg, type = "gold") {
    const oldToast = document.querySelector('.toast-msg');
    if(oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = `toast-msg fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-xl font-black text-[10px] shadow-2xl animate-in fade-in slide-in-from-top duration-300 ${type === 'gold' ? 'bg-[#C9A227] text-black' : 'bg-red-600 text-white'}`;
    toast.innerText = msg.toUpperCase();
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- STRICT AUTHENTICATION ---
function handleAdminLogin() {
    const user = document.getElementById('admin_user').value;
    const pass = document.getElementById('admin_pass').value;

    if (user === "WestpabloBluepeak" && pass === "@westpablo_bluepeak0917") {
        isAdminAuth = true;
        notify("Master Control Unlocked");
        fetchAdminData(); 
    } else {
        notify("Access Denied: Invalid Credentials", "red");
    }
}

// --- REAL API ACTIONS ---
async function fetchAdminData() {
    try {
        const res = await fetch(`${API_URL}/api/admin/stats`);
        if (res.ok) {
            const data = await res.json();
            stats = data.stats;
            activePlans = data.plans || [];
            render();
        }
    } catch(e) {
        notify("Failed to load database stats", "red");
    }
}

async function handleTopUp() {
    const targetUser = document.getElementById('target_user').value;
    const amount = document.getElementById('topup_amount').value;
    const type = document.getElementById('topup_type').value;

    if (!targetUser || !amount) return notify("Input required", "red");

    notify("Processing Credit...", "gold");

    try {
        const res = await fetch(`${API_URL}/api/admin/topup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUser, amount: Number(amount), type })
        });
        const result = await res.json();
        
        if (res.ok) {
            notify(result.message); // Will show "Successfully credited..."
            document.getElementById('target_user').value = '';
            document.getElementById('topup_amount').value = '';
            fetchAdminData();
        } else {
            notify(result.message, "red"); // Will show exact error (e.g., "User not found")
        }
    } catch (err) {
        notify("Server Connection Error", "red");
    }
}

async function handleAddPlan() {
    const name = document.getElementById('plan_name').value;
    const minDeposit = document.getElementById('plan_min').value;
    const dailyRoi = document.getElementById('plan_roi').value;
    const duration = document.getElementById('plan_days').value;

    if (!name || !minDeposit || !dailyRoi || !duration) return notify("All fields required", "red");

    notify("Publishing Plan to Live Site...", "gold");

    try {
        const res = await fetch(`${API_URL}/api/admin/plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, minDeposit: Number(minDeposit), dailyRoi: Number(dailyRoi), duration: Number(duration) })
        });
        
        const result = await res.json();

        if (res.ok) {
            notify("Plan Published Successfully!");
            // Clear inputs
            document.getElementById('plan_name').value = '';
            document.getElementById('plan_min').value = '';
            document.getElementById('plan_roi').value = '';
            document.getElementById('plan_days').value = '';
            fetchAdminData(); // Refresh the list
        } else {
            notify(result.message || "Failed to publish plan", "red");
        }
    } catch (err) {
        notify("Server Error", "red");
    }
}

// --- UI COMPONENTS ---
function LoginScreen() {
    return `
        <div class="pt-24 animate-in zoom-in duration-500 max-w-sm mx-auto">
            <div class="text-center mb-12">
                <div class="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><span class="text-3xl">🛡️</span></div>
                <h1 class="text-3xl font-black text-white italic tracking-tighter uppercase">Master <span class="text-[#C9A227]">Control</span></h1>
                <p class="text-gray-500 text-[9px] uppercase tracking-[0.4em] mt-2 font-bold">Restricted Admin Access</p>
            </div>
            <div class="space-y-4">
                <input type="text" id="admin_user" placeholder="Admin ID" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#C9A227]">
                <input type="password" id="admin_pass" placeholder="Master Password" class="w-full bg-[#111827] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#C9A227]">
                <button onclick="handleAdminLogin()" class="w-full bg-[#C9A227] py-5 rounded-2xl font-black text-black active:scale-95 transition-all mt-4 uppercase tracking-widest text-[10px]">Authenticate</button>
            </div>
        </div>
    `;
}

const AdminBottomNav = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#0B0B0B]/95 backdrop-blur-2xl border-t border-white/5 p-4 flex justify-around items-center z-50">
        ${['overview', 'plans'].map(t => `
            <button onclick="switchTab('${t}')" class="flex flex-col items-center transition-all ${currentAdminTab === t ? 'text-[#C9A227] scale-110' : 'text-gray-600'}">
                <span class="text-[8px] font-black uppercase tracking-widest">${t}</span>
            </button>
        `).join('')}
    </div>
`;

function Overview() {
    return `
        <div class="animate-in fade-in duration-500">
            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="bg-white/5 border border-white/5 p-6 rounded-[30px]">
                    <p class="text-[9px] text-gray-500 font-bold uppercase mb-1">Total Users</p>
                    <p class="text-2xl font-black text-white">${stats.totalUsers}</p>
                </div>
                <div class="bg-white/5 border border-white/5 p-6 rounded-[30px]">
                    <p class="text-[9px] text-gray-500 font-bold uppercase mb-1">System Earnings</p>
                    <p class="text-xl font-black text-[#C9A227]">₦ ${stats.totalEarned}</p>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-[#111827] to-[#0B0B0B] p-8 rounded-[40px] border border-white/10 shadow-2xl mb-8">
                <h3 class="text-xs font-black text-[#1E90FF] uppercase mb-6 tracking-widest">Manual User Credit</h3>
                <div class="space-y-4">
                    <input type="text" id="target_user" placeholder="Username of Investor" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="number" id="topup_amount" placeholder="Amount (₦)" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <select id="topup_type" class="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-gray-400 text-xs outline-none">
                        <option value="depositBalance">Deposit Balance</option>
                        <option value="earnedBalance">Earned Profit</option>
                    </select>
                    <button onclick="handleTopUp()" class="w-full bg-[#1E90FF] py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20 active:scale-95">Authorize Credit</button>
                </div>
            </div>
        </div>
    `;
}

function PlanManager() {
    return `
        <div class="animate-in slide-in-from-right duration-500">
            <div class="bg-gradient-to-br from-[#111827] to-[#0B0B0B] p-8 rounded-[40px] border border-white/10 shadow-2xl mb-8">
                <h3 class="text-xs font-black text-[#C9A227] uppercase mb-6 text-center tracking-widest">Architect New Plan</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <input type="text" id="plan_name" placeholder="Plan Name" class="col-span-2 bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="number" id="plan_min" placeholder="Min Deposit (₦)" class="bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="number" id="plan_roi" placeholder="Daily % ROI" class="bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                    <input type="number" id="plan_days" placeholder="Duration (Days)" class="col-span-2 bg-black/40 border border-white/10 p-4 rounded-xl text-white text-xs outline-none">
                </div>
                <button onclick="handleAddPlan()" class="w-full bg-[#C9A227] text-black py-4 rounded-xl font-black text-[10px] uppercase active:scale-95">Publish Plan</button>
            </div>
            
            <h4 class="text-[10px] text-gray-600 font-bold uppercase mb-4 pl-4 tracking-widest">Active Market Offerings</h4>
            <div class="space-y-3">
                ${activePlans.length === 0 ? '<p class="text-xs text-gray-600 italic text-center py-6 border border-white/5 rounded-2xl bg-white/5">0 Plans in Database</p>' : ''}
                ${activePlans.map(plan => `
                    <div class="bg-[#111827] p-5 rounded-2xl flex justify-between items-center border border-white/5">
                        <div>
                            <p class="text-white font-bold text-xs italic">${plan.name}</p>
                            <p class="text-[9px] text-gray-500 uppercase tracking-widest">${plan.dailyRoi}% ROI • ${plan.duration} Days</p>
                        </div>
                        <span class="text-green-500 text-[8px] font-black uppercase bg-green-500/10 px-2 py-1 rounded">Live</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function render() {
    if (!isAdminAuth) {
        app.innerHTML = `<div class="min-h-screen bg-[#0B0B0B] text-white p-6 font-sans">${LoginScreen()}</div>`;
        return;
    }

    let content = '';
    if (currentAdminTab === 'overview') content = Overview();
    if (currentAdminTab === 'plans') content = PlanManager();

    app.innerHTML = `
        <div class="max-w-md mx-auto min-h-screen bg-[#0B0B0B] text-white p-6 pb-24 font-sans selection:bg-[#C9A227]">
            <div class="flex justify-between items-center mb-10">
                <h1 class="text-xl font-black italic tracking-tighter text-white uppercase">Control <span class="text-[#C9A227]">Vault</span></h1>
                <button onclick="window.location.href='/'" class="text-[9px] bg-white/5 border border-white/10 px-4 py-2 rounded-full text-gray-400 font-bold uppercase">Exit</button>
            </div>
            ${content}
            ${AdminBottomNav()}
        </div>
    `;
}

render();
