// State Management
let currentTab = 'home';
const app = document.getElementById('app');

// Mock Data (In a real app, this comes from your /api/investments/plans)
const investmentPlans = [
    { id: 1, name: 'Peak Starter', roi: '15%', duration: '7 Days', min: '3,000', best: false, daily: '₦214' },
    { id: 2, name: 'Summit Gold', roi: '40%', duration: '14 Days', min: '50,000', best: true, daily: '₦1,428' },
    { id: 3, name: 'Apex Ridge', roi: '90%', duration: '30 Days', min: '200,000', best: false, daily: '₦6,000' }
];

// --- UI COMPONENTS ---

const Header = () => `
    <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-xl font-black tracking-tighter text-white">BLUEPEAK<span class="text-[#1E90FF]">.</span></h1>
            <p class="text-[10px] text-gray-500 uppercase tracking-widest">Premium Finance</p>
        </div>
        <div class="flex flex-col items-end">
            <span class="text-[10px] text-gray-500 uppercase">Total Balance</span>
            <span class="text-[#C9A227] font-bold text-lg">₦ 0.00</span>
        </div>
    </div>
`;

const Navigation = () => `
    <div class="fixed bottom-0 left-0 right-0 bg-[#111827]/90 backdrop-blur-lg border-t border-gray-800 p-4 flex justify-around items-center z-50">
        <button onclick="switchTab('home')" class="${currentTab === 'home' ? 'text-[#1E90FF]' : 'text-gray-500'} flex flex-col items-center">
            <span class="text-[10px] mt-1 font-bold uppercase">Home</span>
        </button>
        <button onclick="switchTab('plans')" class="${currentTab === 'plans' ? 'text-[#1E90FF]' : 'text-gray-500'} flex flex-col items-center">
            <span class="text-[10px] mt-1 font-bold uppercase">Plans</span>
        </button>
        <button onclick="switchTab('invite')" class="${currentTab === 'invite' ? 'text-[#1E90FF]' : 'text-gray-500'} flex flex-col items-center">
            <span class="text-[10px] mt-1 font-bold uppercase">Invite</span>
        </button>
        <button onclick="switchTab('profile')" class="${currentTab === 'profile' ? 'text-[#1E90FF]' : 'text-gray-500'} flex flex-col items-center">
            <span class="text-[10px] mt-1 font-bold uppercase">Profile</span>
        </button>
    </div>
`;

// --- PAGES ---

function Home() {
    return `
        <div class="animate-in fade-in duration-500">
            ${Header()}
            <div class="bg-[#111827] p-8 rounded-3xl border border-gray-800 mb-6 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
                </div>
                <p class="text-gray-400 text-xs mb-2">Available for withdrawal</p>
                <h2 class="text-4xl font-black mb-6 text-white">₦ 0.00</h2>
                <div class="flex gap-3">
                    <button class="flex-1 bg-[#1E90FF] py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">Deposit</button>
                    <button class="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm">Withdraw</button>
                </div>
            </div>

            <h3 class="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-4">Live Markets</h3>
            <div class="bg-[#111827] h-32 rounded-3xl border border-gray-800 flex items-center justify-center italic text-gray-600">
                Chart Loading...
            </div>
        </div>
    `;
}

function Plans() {
    return `
        <div class="animate-in slide-in-from-bottom duration-500">
            <h2 class="text-2xl font-black mb-2">INVESTMENT <span class="text-[#C9A227]">PLANS</span></h2>
            <p class="text-gray-500 text-xs mb-8">Select a plan to start earning daily profit.</p>
            
            <div class="grid gap-6">
                ${investmentPlans.map(plan => `
                    <div class="bg-[#111827] p-6 rounded-3xl border-2 ${plan.best ? 'border-[#C9A227] shadow-[0_0_20px_rgba(201,162,39,0.1)]' : 'border-gray-800'} relative">
                        ${plan.best ? '<span class="absolute -top-3 left-6 bg-[#C9A227] text-black text-[10px] font-black px-4 py-1 rounded-full">BEST VALUE</span>' : ''}
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold">${plan.name}</h3>
                            <span class="text-[#C9A227] font-black text-xl">${plan.roi}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p class="text-[10px] text-gray-500 uppercase">Daily Profit</p>
                                <p class="font-bold text-sm">${plan.daily}</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-gray-500 uppercase">Duration</p>
                                <p class="font-bold text-sm">${plan.duration}</p>
                            </div>
                        </div>
                        <button class="w-full ${plan.best ? 'bg-[#C9A227] text-black' : 'bg-gray-800 text-white'} py-4 rounded-2xl font-black text-sm transition-transform active:scale-95">
                            INVEST FROM ₦${plan.min}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function Invite() {
    return `
        <div class="text-center py-10">
            <div class="w-20 h-20 bg-[#C9A227]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="text-3xl">🎁</span>
            </div>
            <h2 class="text-2xl font-black mb-2">15% COMMISSION</h2>
            <p class="text-gray-500 text-sm mb-8 px-10">Earn instantly when your friends make their first deposit.</p>
            <div class="bg-[#111827] p-4 rounded-2xl border border-dashed border-gray-700 mx-4">
                <p class="text-[10px] text-gray-500 mb-2">YOUR REFERRAL LINK</p>
                <p class="text-xs font-mono text-blue-400">bluepeak.link/user772</p>
            </div>
        </div>
    `;
}

// --- APP ENGINE ---

function switchTab(tab) {
    currentTab = tab;
    render();
}

function render() {
    let content = '';
    if (currentTab === 'home') content = Home();
    if (currentTab === 'plans') content = Plans();
    if (currentTab === 'invite') content = Invite();
    if (currentTab === 'profile') content = `<div class="p-10 text-center text-gray-500 underline">Profile Settings Locked</div>`;

    app.innerHTML = `
        <div class="min-h-screen pb-24 p-6 max-w-md mx-auto">
            ${content}
            ${Navigation()}
        </div>
    `;
}

// Initial Launch
render();
