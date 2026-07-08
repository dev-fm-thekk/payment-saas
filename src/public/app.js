// Tab switching logic
function showTab(tabName) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${tabName}-section`).classList.remove('hidden');

    // Update tab styles (simple version)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.innerText.toLowerCase().includes(tabName)) {
            btn.classList.add('bg-indigo-700', 'text-white');
            btn.classList.remove('text-indigo-100');
        } else {
            btn.classList.remove('bg-indigo-700', 'text-white');
            btn.classList.add('text-indigo-100');
        }
    });
}

// Payment Logic
document.getElementById('pay-button').addEventListener('click', async () => {
    const amount = document.getElementById('amount').value;
    const currency = document.getElementById('currency').value;

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        // 1. Create Order
        const orderRes = await fetch('/razorpay/order/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Number(amount) * 100, currency, receipt: 'receipt_' + Date.now() })
        });

        const order = await orderRes.json();

        if (order.error) {
            alert('Error creating order: ' + JSON.stringify(order.error));
            return;
        }

        // 2. Open Razorpay Checkout
        const options = {
            key: "rzp_test_Sv442qaL3dUy6G", // This should be handled better in a real app
            amount: order.amount,
            currency: order.currency,
            name: "Payment SDK Demo",
            description: "Test Transaction",
            order_id: order.id,
            handler: async function (response) {
                // 3. Capture Payment (on success)
                alert('Payment Successful! ID: ' + response.razorpay_payment_id);

                // Add to local history (mock)
                addToHistory({
                    id: order.id,
                    amount: amount + ' ' + currency,
                    status: 'Paid',
                    date: new Date().toLocaleString()
                });

                // In a real app, you'd verify the signature and capture on server
                await fetch('/razorpay/payment/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payment_id: response.razorpay_payment_id,
                        amount: order.amount,
                        currency: order.currency
                    })
                });
            },
            prefill: {
                name: "Customer Name",
                email: "customer@example.com",
                contact: "9999999999"
            },
            theme: { color: "#4F46E5" }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error(err);
        alert('Payment failed: ' + err.message);
    }
});

// History Logic (Simple local storage for demo)
function addToHistory(payment) {
    const history = JSON.parse(localStorage.getItem('payment_history') || '[]');
    history.unshift(payment);
    localStorage.setItem('payment_history', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('payment_history') || '[]');
    const list = document.getElementById('history-list');
    list.innerHTML = history.map(p => `
        <tr class="border-b hover:bg-gray-50 transition">
            <td class="py-3 px-4 text-sm text-gray-600">${p.id}</td>
            <td class="py-3 px-4 font-medium text-gray-800">${p.amount}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">${p.status}</span>
            </td>
            <td class="py-3 px-4 text-sm text-gray-500">${p.date}</td>
        </tr>
    `).join('');
}

// Initial Load
loadHistory();
