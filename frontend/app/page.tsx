"use client";
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = "https://food-hub-i6wk.onrender.com";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [emails, setEmails] = useState([]);
  const [links, setLinks] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newLink, setNewLink] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  // Socket'i ref ile tutarak sayfa her render olduğunda yeniden bağlanmasını engelliyoruz
  const socketRef = useRef(null);

  useEffect(() => {
    // 1. İlk Verileri Çek
    const fetchData = async () => {
      try {
        const e = await fetch(`${BACKEND_URL}/api/settings/emails`).then(r => r.json());
        setEmails(Array.isArray(e) ? e : []);
        const l = await fetch(`${BACKEND_URL}/api/settings/links`).then(r => r.json());
        setLinks(Array.isArray(l) ? l : []);
      } catch (err) { 
        console.error("Backend bağlantı hatası:", err); 
      }
    };
    fetchData();

    // 2. Socket Bağlantısını Başlat
    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket", "polling"], // Bağlantı garantisi için
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log("Canlı bağlantı sağlandı:", socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('admin-new-order', (order) => {
      console.log("Yeni sipariş geldi:", order);
      setOrders(prev => [order, ...prev]);
      
      // Bildirim Sesi
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.play().catch(e => console.log("Ses çalma engellendi (Etkileşim gerekiyor)"));
    });

    // Sayfa kapandığında bağlantıyı temizle
    return () => {
      socket.off('admin-new-order');
      socket.disconnect();
    };
  }, []);

  const apiCall = async (path, method, body) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (err) {
      console.error("API Hatası:", err);
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-blue-400">DEMO FOOD PANEL</h1>
            <p className="text-[10px] text-slate-500 font-mono">GURAY OZSEKER | ADMİN PORTAL</p>
          </div>
          <div className={`px-4 py-1 rounded-full text-[10px] font-black transition-all duration-500 shadow-lg ${isConnected ? 'bg-green-500/10 text-green-500 border border-green-500/50' : 'bg-red-500/10 text-red-500 border border-red-500/50 animate-pulse'}`}>
            {isConnected ? '● SİSTEM AKTİF' : '○ BAĞLANTI YOK'}
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-6">
            {/* Mailler Bölümü */}
            <section className="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700 shadow-xl">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bildirim Mailleri</h2>
              <div className="flex gap-2 mb-4">
                <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm flex-1 outline-none focus:border-blue-500 transition-colors" placeholder="Email adresi..." />
                <button onClick={async ()=>{if(!newEmail) return; setEmails(await apiCall('emails','POST',{email:newEmail})); setNewEmail("");}} className="bg-blue-600 hover:bg-blue-500 px-4 rounded-lg text-xs font-bold transition-all">EKLE</button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {emails.map(e => <div key={e} className="text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 flex justify-between items-center group"><span>{e}</span><button onClick={async()=>setEmails(await apiCall('emails','DELETE',{email:e}))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Sil</button></div>)}
              </div>
            </section>

            {/* Link Takibi Bölümü */}
            <section className="bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700 shadow-xl">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">İzlenen Linkler</h2>
              <div className="flex gap-2 mb-4">
                <input value={newLink} onChange={e=>setNewLink(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm flex-1 outline-none focus:border-emerald-500 transition-colors" placeholder="google.com vb..." />
                <button onClick={async ()=>{if(!newLink) return; setLinks(await apiCall('links','POST',{link:newLink})); setNewLink("");}} className="bg-emerald-600 hover:bg-emerald-500 px-4 rounded-lg text-xs font-bold transition-all">EKLE</button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {links.map(l => <div key={l} className="text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 flex justify-between items-center group"><span className="truncate w-32 font-mono text-slate-300">{l}</span><button onClick={async()=>setLinks(await apiCall('links','DELETE',{link:l}))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Sil</button></div>)}
              </div>
            </section>
          </div>

          {/* Canlı Akış Bölümü */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">Canlı Akış <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span></h2>
            <div className="space-y-3">
              {orders.length === 0 ? (
                  <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 p-16 rounded-3xl text-center flex flex-col items-center justify-center">
                    <div className="text-slate-600 mb-2">📡</div>
                    <div className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Yeni siparişler için dinleniyor...</div>
                  </div>
              ) : (
                  orders.map((o, i) => (
                      <div key={i} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xl border-l-4 border-l-blue-500 transform transition-all hover:scale-[1.01] animate-in slide-in-from-right duration-500">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider">
                            <span className="bg-slate-900 px-2 py-1 rounded text-blue-400">{o.platform}</span>
                            <span className="bg-slate-900 px-2 py-1 rounded">#{o.orderCode || '000'}</span>
                          </div>
                          <div className="text-xl font-bold uppercase tracking-tight text-slate-100">{o.customerName}</div>
                          <div className="text-sm text-slate-400 mt-2 font-medium bg-slate-900/30 p-2 rounded-lg italic">"{o.items}"</div>
                      </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
