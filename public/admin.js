let adminState = { currentTab: 'users' };
const adminApp = document.getElementById('app');

const AdminNav = () => `
    <div class="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button onclick="switchAdminTab('users')" class="px-5 py-3 rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all ${adminState.currentTab === 'users' ? 'bg-[#1E90FF] text-white shadow-lg shadow-blue-500/20' : 'bg-[#111827] text-gray-500 border border-gray-800'}">Users</button>
        <button onclick="switchAdminTab('plans')" class="px-5 py-3 rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all ${adminState.currentTab === 'plans' ? 'bg-[#C9A227] text-black shadow-lg shadow-yellow-500/20' : 'bg-[#111827] text-gray-500 border border-gray-800'}">Plans</button>
        <button onclick="switchAdminTab('support')" class="px-5 py-3 rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all ${adminState.currentTab === 'support' ? 'bg-white text-black' : 'bg-[#111827] text-gray-500 border border-gray-800'}">Support</button>
    </div>
`;

function UsersManager() {
    return `
        <div class="animate-in fade-in duration-500">
            <div class="bg-[#111827] p-6 rounded-[32px] border border-gray-800 mb-8">
                <h3 class="text-[10px] font-black text-[#1E90FF] uppercase mb-6 tracking-widest">Manual User Top-Up</h3>
                <div class="space-y-4">
                    <input type="text" id="targetUser" placeholder="Username" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white outline-none text-xs">
                    <input type="number" id="topupAmount" placeholder="Amount (₦)" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white outline-none text-xs">
                    <select id="balanceType" class="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-white outline-none text-xs">
                        <option value="deposit">Deposit Balance</option>
                        <option value="earned">Earned Profit</option>
                    </select>
                    <button onclick="alert('Balance Updated')" class="w-full bg-[#1E90FF] text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest">Execute Credit</button>
                </div>
            </div>
        </div>
    `;
}

function PlansManager() {
    return `
        <div class="animate-in slide-in-from-right duration-500">
            <div class="bg-[#111827] p-6 rounded-[32px] border border-gray-800 mb-8 text-center">
                <h3 class="text-[10px] font-black text-[#C9A227] uppercase mb-6 tracking-widest">Create Market Plan</h3>
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <input type="text" placeholder="Plan Name" class="col-span-2 bg-black/40 border border-gray-800 p-4 rounded-xl text-white text-xs">
                    <input type="number" placeholder="Min ₦" class="bg-black/40 border border-gray-800 p-4 rounded-xl text-white text-xs">
                    <input type="number" placeholder="ROI %" class="bg-black/40 border border-gray-800 p-4 rounded-xl text-white text-xs">
                </div>
                <button class="w-full bg-[#C9A227] text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-widest">Publish Plan</button>
            </div>
            <div class="bg-[#111827] p-4 rounded-2xl border border-gray-900 flex justify-between items-center">
                <p class="text-xs font-bold italic">Starter Peak (Active)</p>
                <button onclick="confirm('Delete Plan?')" class="text-red-500 text-[9px] font-bold">DELETE</button>
            </div>
        </div>
    `;
}

function SupportManager() {
    return `
        <div class="animate-in fade-in duration-500">
            <h2 class="text-[10px] font-black text-gray-500 uppercase mb-4 pl-2">Unresolved Queries</h2>
            <div class="bg-[#111827] p-6 rounded-[32px] border border-gray-800">
                <div class="flex justify-between items-center mb-4 text-[10px] font-bold">
                    <span class="text-blue-400">User: Westpablo</span>
                    <span class="text-gray-600">2m ago</span>
                </div>
                <p class="text-white text-xs italic mb-4">"I need assistance with my withdrawal PIN."</p>
                <textarea class="w-full bg-black/40 border border-gray-800 p-3 rounded-xl text-white text-[10px] outline-none h-20 mb-3" placeholder="Type professional response..."></textarea>
                <button onclick="alert('Reply Sent')" class="w-full bg-white text-black font-black py-3 rounded-xl text-[9px] uppercase">Reply User</button>
            </div>
        </div>
    `;
}

function switchAdminTab(tab) {
    adminState.currentTab = tab;
    renderAdmin();
}

function renderAdmin() {
    let content = '';
    if(adminState.currentTab === 'users') content = UsersManager();
    if(adminState.currentTab === 'plans') content = PlansManager();
    if(adminState.currentTab === 'support') content = SupportManager();

    adminApp.innerHTML = `
    <div class="max-w-md mx-auto min-h-screen p-6">
        <div class="flex justify-between items-center mb-10">
            <h1 class="text-xl font-black italic">BP <span class="text-[#C9A227]">ADMIN</span></h1>
            <a href="/" class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Exit</a>
        </div>
        ${AdminNav()}
        ${content}
    </div>
    `;
}

renderAdmin();
