const BACKEND_URL = "https://food-hub-i6wk.onrender.com";
let allowedLinks = [];

async function fetchConfig() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/extension/config`);
        const data = await response.json();
        allowedLinks = data.allowedLinks || [];
    } catch (e) { console.log("Config yok."); }
}

async function scan() {
    if (!allowedLinks.some(link => window.location.href.includes(link))) return;

    document.querySelectorAll('.order-card').forEach(card => {
        if (!card.dataset.sent) {
            fetch(`${BACKEND_URL}/api/new-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: "Online Sipariş",
                    customerName: card.querySelector('.customer-name')?.innerText || "Müşteri",
                    orderCode: card.querySelector('.order-id')?.innerText || "000",
                    items: card.querySelector('.order-details')?.innerText || "Detay yok"
                })
            });
            card.dataset.sent = "true";
        }
    });
}

setInterval(fetchConfig, 10000);
setInterval(scan, 3000);

fetchConfig();
