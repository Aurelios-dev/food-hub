const BACKEND_URL = "https://food-hub-i6wk.onrender.com";
let allowedLinks = [];

// Ayarları Backend'den Çek
async function fetchConfig() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/extension/config`);
        const data = await res.json();
        allowedLinks = data.allowedLinks || [];
    } catch (e) { console.log("Config alınamadı."); }
}

// Sayfayı Tara
async function scan() {
    const currentUrl = window.location.href.toLowerCase();
    const isAllowed = allowedLinks.some(link => currentUrl.includes(link.toLowerCase()));
    
    if (!isAllowed) return;

    // Sipariş kartlarını bul (Hem gerçek hem test için)
    document.querySelectorAll('.order-card, .test-order').forEach(card => {
        if (!card.dataset.sent) {
            const payload = {
                platform: window.location.hostname,
                customerName: card.querySelector('.customer-name, .name')?.innerText || "İsim Yok",
                orderCode: card.querySelector('.order-id, .code')?.innerText || "000",
                items: card.querySelector('.order-details, .items')?.innerText || "Ürün Yok"
            };

            fetch(`${BACKEND_URL}/api/new-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(() => {
                card.dataset.sent = "true";
                console.log("Sipariş başarıyla iletildi!");
            }).catch(err => console.error("Gönderim hatası:", err));
        }
    });
}

setInterval(fetchConfig, 10000); // 10 saniyede bir config yenile
setInterval(scan, 2000); // 2 saniyede bir sayfayı tara
fetchConfig();
