const app = document.getElementById('app');

// Mock Data for Investment Plans
const plans = [
    { name: 'Starter Peak', roi: '5%', duration: '7 Days', min: '3,000', best: false },
    { name: 'Silver Ridge', roi: '12%', duration: '14 Days', min: '50,000', best: true },
    { name: 'Gold Summit', roi: '25%', duration: '30 Days', min: '200,000', best: false }
];

function renderDashboard() {
    app.innerHTML = `
    <div class="min-h-screen text-white p-6 pb-24">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-bold italic">BLUEPEAK</h1>
            <div class="bg-[#111827] px-4 py-2 rounded-full border border-gray-800 text-[#C9A227] font-bold">
                ₦ 0.00
            </div>
        </div>

        <h2 class="text-xl font-semibold mb-6">Investment Plans</h2>

        <div class="grid gap-6">
            ${plans.map(plan => `
                <div class="bg-[#111827] p-6 rounded-2xl border ${plan.best ? 'gold-border' : 'border-gray-800'} relative overflow-hidden">
                    ${plan.best ? '<span class="absolute top-0 right-0 bg-[#C9A227] text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">Best Plan</span>' : ''}
                    
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-bold">${plan.name}</h3>
                            <p class="text-[#C9A227] text-2xl font-black">${plan.roi} <span class="text-sm font-normal text-gray-400">ROI</span></p>
                        </div>
                        <div class="text-right">
                            <p class="text-gray-400 text-xs uppercase tracking-widest">Duration</p>
                            <p class="font-semibold">${plan.duration}</p>
                        </div>
                    </div>

                    <div class="border-t border-gray-800 pt-4 mt-4 flex justify-between items-center">
                        <div>
                            <p class="text-gray-500 text-xs">Minimum Deposit</p>
                            <p class="font-bold text-blue-400">₦ ${plan.min}</p>
                        </div>
                        <button class="bg-[#1E90FF] text-white px-6 py-2 rounded-lg font-bold blue-glow hover:scale-105 transition-transform">
                            Invest
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="fixed bottom-0 left-0 right-0 bg-[#0B0B0B]/80 backdrop-blur-md border-t border-gray-800 p-4 flex justify-around">
            <button class="text-gray-500">Home</button>
            <button class="text-[#1E90FF] font-bold">Plans</button>
            <button class="text-gray-500">Invite</button>
            <button class="text-gray-500">Profile</button>
        </div>
    </div>
    `;
}

renderDashboard();
