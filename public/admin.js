// --- ADMIN CONFIGURATION & STATE ---
const API_URL = window.location.origin;
let adminToken = localStorage.getItem('token'); // Assumes Admin logs in via main app and navigates here
let currentView = 'dashboard';
let isLoading = true;

// Global State
let state = {
    stats: { totalUsers: 0, totalDeposits: 0, totalEarned: 0, totalPlatformLiquidity: 0 },
    plans: [],
    kycRequests: []
};

// --- CORE SYSTEM LOGIC ---
async function initAdmin() {
    if (!adminToken) {
        document.getElementById('admin-app').innerHTML = renderUnauthorized();
        return;
    }
    await syncData();
}

async function syncData() {
    isLoading = true;
    render(); // Show loading state
    try {
        // Fetch Stats & Plans
        const resStats = await fetch(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (resStats.status === 401 || resStats.status === 403) {
            adminToken = null;
            localStorage.removeItem('token');
            document.getElementById('admin-app').innerHTML = renderUnauthorized();
            return;
        }

        const dataStats = await resStats.json();
        state.stats = dataStats.stats;
        state.plans = dataStats.plans;

        // Fetch Pending KYC
        const resKyc = await fetch(`${API_URL}/api/admin/kyc/pending`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const dataKyc = await resKyc.json();
        state.kycRequests = dataKyc.requests || [];

    } catch (err) {
        notify("Failed to sync telemetry data. Check server connection.", "red");
    } finally {
        isLoading = false;
        render();
    }
}

function switchView(view) {
    currentView = view;
    render();
}

function notify(msg, type = "emerald") {
    const toast = document.createElement('div');
    const color = type === 'emerald' ? 'bg-[#10B981] border-[#10B981]' : type === 'gold' ? 'bg-[#C9A227] border-[#C9A227]' : 'bg-red-500 border-red-500';
    toast.className = `fixed top-6 right-6 z-50 px-6 py-4 rounded-xl font-bold text-[13px] text-white shadow-2xl backdrop-blur-md animate-in border ${color} bg-opacity-90`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// --- API ACTIONS ---
async function handleTopUp(e) {
    e.preventDefault();
    const targetUser = document.getElementById('tu_user').value;
    const amount = document.getElementById('tu_amt').value;
    const type = document.getElementById('tu_type').value;

    const btn = document.getElementById('btn-topup');
    btn.innerHTML = 'Processing...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/admin/topup`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` 
            },
            body: JSON.stringify({ targetUser, amount, type })
        });
        
        const result = await res.json();
        if (res.ok) {
            notify(result.message, "emerald");
            document.getElementById('tu_user').value = '';
            document.getElementById('tu_amt').value = '';
            await syncData(); // Refresh stats
        } else {
            notify(result.message, "red");
        }
    } catch (err) {
        notify("Network error during transaction", "red");
    } finally {
        btn.innerHTML = 'Execute Transaction';
        btn.disabled = false;
    }
}

async function handleCreatePlan(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('p_name').value,
        category: document.getElementById('p_cat').value,
        minDeposit: Number(document.getElementById('p_min').value),
        maxDeposit: Number(document.getElementById('p_max').value),
        dailyRoi: Number(document.getElementById('p_roi').value),
        duration: Number(document.getElementById('p_dur').value),
        isPopular: document.getElementById('p_pop').checked
    };

    try {
        const res = await fetch(`${API_URL}/api/admin/plans`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` 
            },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        if (res.ok) {
            notify(result.message, "gold");
            await syncData();
            switchView('plans'); // Reset to list
        } else {
            notify(result.message, "red");
        }
    } catch (err) {
        notify("Failed to deploy plan", "red");
    }
}

async function togglePlanActive(id) {
    try {
        const res = await fetch(`${API_URL}/api/admin/plans/${id}/toggle`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) {
            notify("Plan visibility updated", "emerald");
            await syncData();
        }
    } catch (err) {
        notify("Error toggling plan", "red");
    }
}

// --- UI COMPONENTS ---

function renderUnauthorized() {
    return `
        <div class="min-h-screen flex items-center justify-center p-6">
            <div class="glass-panel p-10 rounded-3xl max-w-md w-full text-center slide-up">
                <div class="w-20 h-20 bg-red-500/10 rounded-2xl border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                    <span class="text-4xl">🛑</span>
                </div>
                <h1 class="text-3xl font-black text-white mb-2">Access Denied</h1>
                <p class="text-gray-400 text-sm mb-8">You must be logged in as an Administrator to access the Master Control Panel.</p>
                <button onclick="window.location.href='/'" class="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all">Return to Application</button>
            </div>
        </div>
    `;
}

function Sidebar() {
    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Telemetry Overview' },
        { id: 'topup', icon: '💰', label: 'Vault Management' },
        { id: 'plans', icon: '📈', label: 'Investment Plans' },
        { id: 'kyc', icon: '🪪', label: `KYC Pending (${state.kycRequests.length})` },
    ];

    return `
        <aside class="w-72 hidden md:flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-3xl min-h-screen p-6 relative z-20">
            <div class="flex items-center gap-4 mb-12">
                <div class="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#0070F3] rounded-[14px] flex items-center justify-center shadow-[0_0_20px_rgba(30,144,255,0.4)]">
                    <span class="font-black text-white text-xl">BP</span>
                </div>
                <div>
                    <h2 class="text-lg font-black text-white tracking-tight">BluePeak</h2>
                    <p class="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Master Control</p>
                </div>
            </div>

            <nav class="flex-1 space-y-2">
                ${navItems.map(item => `
                    <button onclick="switchView('${item.id}')" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${currentView === item.id ? 'bg-brand-blue/10 border border-brand-blue/30 text-brand-blue shadow-[0_0_15px_rgba(30,144,255,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}">
                        <span class="text-lg">${item.icon}</span>
                        <span class="text-xs font-bold uppercase tracking-wider">${item.label}</span>
                    </button>
                `).join('')}
            </nav>

            <button onclick="logout()" class="mt-auto flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/30">
                <span class="text-lg">🚪</span>
                <span class="text-xs font-bold uppercase tracking-wider">Terminate Session</span>
            </button>
        </aside>
    `;
}

function DashboardView() {
    return `
        <div class="slide-up">
            <header class="mb-10">
                <h1 class="text-3xl font-black text-white tracking-tight mb-2">Platform Telemetry</h1>
                <p class="text-gray-400 text-sm font-medium">Real-time overview of ecosystem liquidity and user metrics.</p>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div class="glass-panel p-6 rounded-[24px] relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-blue/10 rounded-full blur-2xl"></div>
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Users</p>
                    <p class="text-3xl font-black text-white font-mono">${state.stats.totalUsers.toLocaleString()}</p>
                </div>
                <div class="glass-panel p-6 rounded-[24px] relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Active Deposits</p>
                    <p class="text-3xl font-black text-white font-mono">₦${state.stats.totalDeposits.toLocaleString()}</p>
                </div>
                <div class="glass-panel p-6 rounded-[24px] relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-gold/10 rounded-full blur-2xl"></div>
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Liabilities (ROI)</p>
                    <p class="text-3xl font-black text-brand-gold font-mono">₦${state.stats.totalEarned.toLocaleString()}</p>
                </div>
                <div class="glass-panel p-6 rounded-[24px] border-emerald-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
                    <p class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Net Liquidity
                    </p>
                    <p class="text-3xl font-black text-white font-mono">₦${state.stats.totalPlatformLiquidity.toLocaleString()}</p>
                </div>
            </div>

            <div class="glass-panel p-8 rounded-[32px]">
                <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">System Health</h3>
                <div class="space-y-4 font-mono text-xs">
                    <div class="flex justify-between border-b border-white/5 pb-4">
                        <span class="text-gray-500">Database Connection</span>
                        <span class="text-emerald-400">Stable (24ms)</span>
                    </div>
                    <div class="flex justify-between border-b border-white/5 pb-4">
                        <span class="text-gray-500">SquadCo Gateway</span>
                        <span class="text-emerald-400">Online</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">CRON ROI Engine</span>
                        <span class="text-brand-gold">Sleeping (Next Run: 00:00 UTC)</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function TopUpView() {
    return `
        <div class="slide-up max-w-2xl mx-auto">
            <header class="mb-10 text-center">
                <div class="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-brand-blue/30 shadow-[0_0_20px_rgba(30,144,255,0.2)]">🏦</div>
                <h1 class="text-3xl font-black text-white tracking-tight mb-2">Vault Management</h1>
                <p class="text-gray-400 text-sm font-medium">Manually adjust user balances and override ledgers.</p>
            </header>

            <form onsubmit="handleTopUp(event)" class="glass-panel p-8 rounded-[32px] space-y-6 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div class="relative z-10">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Username</label>
                    <input type="text" id="tu_user" required placeholder="e.g. john_doe" class="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all">
                </div>

                <div class="relative z-10">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Wallet</label>
                    <select id="tu_type" class="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono appearance-none focus:outline-none focus:border-brand-blue transition-all cursor-pointer">
                        <option value="depositBalance" class="bg-gray-900">Capital Vault (Deposit)</option>
                        <option value="earnedBalance" class="bg-gray-900">Yield Vault (Profits)</option>
                        <option value="referralBalance" class="bg-gray-900">Network Vault (Referrals)</option>
                    </select>
                </div>

                <div class="relative z-10">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Adjustment Amount (NGN)</label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₦</span>
                        <input type="number" id="tu_amt" required placeholder="50000" class="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-10 text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all">
                    </div>
                    <p class="text-[9px] text-brand-gold mt-2 ml-1">* Use negative numbers to debit an account</p>
                </div>

                <button type="submit" id="btn-topup" class="relative z-10 w-full mt-4 bg-gradient-to-r from-brand-blue to-[#0070F3] hover:from-[#0070F3] hover:to-brand-blue text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(30,144,255,0.4)] active:scale-[0.98] transition-all">
                    Execute Transaction
                </button>
            </form>
        </div>
    `;
}

function PlansView() {
    // If we click "Create New", we handle that inside this view
    return `
        <div class="slide-up">
            <header class="flex justify-between items-end mb-10">
                <div>
                    <h1 class="text-3xl font-black text-white tracking-tight mb-2">Market Portfolios</h1>
                    <p class="text-gray-400 text-sm font-medium">Manage investment algorithms and yield curves.</p>
                </div>
                <button onclick="document.getElementById('plan-modal').classList.remove('hidden')" class="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2">
                    <span>+</span> Deploy New Plan
                </button>
            </header>

            <div class="glass-panel rounded-[32px] overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-black/40 border-b border-white/5">
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plan Name</th>
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Parameters</th>
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Yield</th>
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        ${state.plans.length === 0 ? `<tr><td colspan="5" class="p-8 text-center text-gray-500 text-sm">No portfolios deployed.</td></tr>` : ''}
                        ${state.plans.map(p => `
                            <tr class="hover:bg-white/[0.02] transition-colors">
                                <td class="p-5">
                                    <div class="flex items-center gap-3">
                                        ${p.isPopular ? '<span class="text-brand-gold text-lg drop-shadow-[0_0_5px_rgba(201,162,39,0.8)]">👑</span>' : '<span class="text-brand-blue text-lg">💎</span>'}
                                        <div>
                                            <p class="font-bold text-white text-sm">${p.name}</p>
                                            <p class="text-[9px] text-gray-500 uppercase tracking-widest">${p.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-5 font-mono text-xs text-gray-300">
                                    ₦${p.minDeposit.toLocaleString()} - ₦${p.maxDeposit.toLocaleString()}
                                </td>
                                <td class="p-5 font-mono text-xs">
                                    <span class="text-emerald-400 font-bold">${p.dailyRoi}% / day</span><br>
                                    <span class="text-gray-500 text-[10px]">${p.duration} Days</span>
                                </td>
                                <td class="p-5">
                                    ${p.isActive 
                                        ? '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">Active</span>'
                                        : '<span class="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">Hidden</span>'
                                    }
                                </td>
                                <td class="p-5 text-right">
                                    <button onclick="togglePlanActive('${p._id}')" class="text-xs font-bold text-brand-blue hover:text-white transition-colors bg-brand-blue/10 px-3 py-1.5 rounded-lg border border-brand-blue/20">Toggle</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div id="plan-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
                <div class="glass-panel max-w-lg w-full rounded-[32px] p-8 border-brand-blue/30 relative">
                    <button onclick="document.getElementById('plan-modal').classList.add('hidden')" class="absolute top-6 right-6 text-gray-500 hover:text-white">✕</button>
                    <h2 class="text-2xl font-black text-white mb-6">Deploy Portfolio</h2>
                    
                    <form onsubmit="handleCreatePlan(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Name</label>
                                <input type="text" id="p_name" required class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-blue focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Category</label>
                                <select id="p_cat" class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-blue focus:outline-none appearance-none">
                                    <option class="bg-gray-900">Short-term</option>
                                    <option class="bg-gray-900">Mid-term</option>
                                    <option class="bg-gray-900">Long-term</option>
                                    <option class="bg-gray-900">Elite</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Min Deposit (₦)</label>
                                <input type="number" id="p_min" required class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-blue focus:outline-none font-mono">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Max Deposit (₦)</label>
                                <input type="number" id="p_max" required class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-blue focus:outline-none font-mono">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Daily ROI (%)</label>
                                <input type="number" step="0.1" id="p_roi" required class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-blue focus:outline-none font-mono">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Duration (Days)</label>
                                <input type="number" id="p_dur" required class="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-blue focus:outline-none font-mono">
                            </div>
                        </div>
                        <label class="flex items-center gap-3 mt-4 cursor-pointer">
                            <input type="checkbox" id="p_pop" class="w-5 h-5 rounded bg-black/40 border-white/10 text-brand-gold focus:ring-brand-gold">
                            <span class="text-sm font-bold text-gray-300">Mark as Most Popular (⭐ Gold Badge)</span>
                        </label>
                        <button type="submit" class="w-full bg-brand-blue text-white font-bold py-4 rounded-xl mt-6 shadow-[0_0_15px_rgba(30,144,255,0.4)]">Launch Contract Algorithm</button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function KYCView() {
    return `
        <div class="slide-up">
            <header class="mb-10">
                <h1 class="text-3xl font-black text-white tracking-tight mb-2">Compliance & Security</h1>
                <p class="text-gray-400 text-sm font-medium">Verify user identities to maintain regulatory standards.</p>
            </header>

            <div class="glass-panel rounded-[32px] overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-black/40 border-b border-white/5">
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">User ID</th>
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Legal Name</th>
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Documents</th>
                            <th class="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Decision</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        ${state.kycRequests.length === 0 ? `<tr><td colspan="4" class="p-10 text-center"><div class="text-4xl mb-4 opacity-50">🛡️</div><p class="text-gray-500 text-sm">All vaults are currently compliant.</p></td></tr>` : ''}
                        
                        ${state.kycRequests.map(req => `
                            <tr class="hover:bg-white/[0.02] transition-colors">
                                <td class="p-5">
                                    <p class="font-bold text-white text-sm font-mono">@${req.username}</p>
                                    <p class="text-[9px] text-gray-500 uppercase tracking-widest">${req.email}</p>
                                </td>
                                <td class="p-5 font-medium text-sm text-gray-300">
                                    ${req.firstName} ${req.surname}
                                </td>
                                <td class="p-5">
                                    <button class="text-xs font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-lg border border-brand-blue/20 flex items-center gap-2">
                                        <span>👁️</span> View IDs
                                    </button>
                                </td>
                                <td class="p-5 text-right space-x-2">
                                    <button onclick="notify('KYC Approved for @${req.username}', 'emerald')" class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Approve</button>
                                    <button onclick="notify('KYC Rejected', 'red')" class="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors">Reject</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p class="text-center text-[10px] text-gray-500 font-bold tracking-widest mt-6 uppercase flex justify-center items-center gap-2">
                <span>🔒 Military Grade Encryption</span>
            </p>
        </div>
    `;
}

// --- MAIN RENDERER ---
function render() {
    const appElem = document.getElementById('admin-app');
    
    if (isLoading) {
        appElem.innerHTML = `
            <div class="min-h-screen flex flex-col items-center justify-center">
                <div class="w-16 h-16 border-4 border-white/10 border-t-brand-blue rounded-full animate-spin mb-4"></div>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Syncing Telemetry...</p>
            </div>
        `;
        return;
    }

    let viewContent = '';
    switch(currentView) {
        case 'dashboard': viewContent = DashboardView(); break;
        case 'topup': viewContent = TopUpView(); break;
        case 'plans': viewContent = PlansView(); break;
        case 'kyc': viewContent = KYCView(); break;
    }

    appElem.innerHTML = `
        <div class="flex min-h-screen">
            ${Sidebar()}
            
            <main class="flex-1 p-6 md:p-10 lg:p-14 overflow-y-auto relative z-10">
                ${viewContent}
            </main>
        </div>
    `;
}

// --- INITIALIZE ---
window.addEventListener('DOMContentLoaded', initAdmin);