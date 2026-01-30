"use client";
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = "https://food-hub-i6wk.onrender.com";

// Tip tanımlamaları (TypeScript için)
interface Order {
  platform: string;
  customerName: string;
  orderCode: string;
  items: string;
}

export default function Dashboard() {
  // TypeScript'e bu dizilerin içinde ne olacağını söylüyoruz
  const [orders, setOrders] = useState<Order[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newLink, setNewLink] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const e = await fetch(`${BACKEND_URL}/api/settings/emails`).then(r => r.json());
        setEmails(Array.isArray(e) ? e : []);
        const l = await fetch(`${BACKEND_URL}/api/settings/links`).then(r => r.json());
        setLinks(Array.isArray(l) ? l : []);
      } catch (err) { 
        console.error("Veri çekme hatası:", err); 
      }
    };
    fetchData();

    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket", "polling"]
    });

    const socket = socketRef.current;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('admin-new-order', (order: Order) => {
      setOrders(prev => [order, ...prev]);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.play().catch(() => {});
    });

    return () => {
      socket.off('admin-new-order');
      socket.disconnect();
    };
  }, []);

  const apiCall = async (path: string, method: string, body: any) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (err) {
      console.error("API hatası:", err);
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-blue-400">DEMO FOOD PANEL</h1>
            <p className="text-[10px] text-slate-500 font-mono">GURAY OZSEKER</p>
          </div>
          <div className={`px-4 py-1 rounded-full text-[10px] font-black ${isConnected ? 'bg-green-500/10 text-green-500 border border-green-500/50' : 'bg-red-500/10 text-red-500 border border-red-500/50 animate-pulse'}`}>
            {isConnected ? '● SİSTEM AKTİF' : '○ BAĞLANTI YOK'}
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <section className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mailler</h2>
              <div className="flex gap-2 mb-4">
                <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm flex-1 outline-none focus:border-blue-500" placeholder="Email..." />
                <button onClick={async ()=>{if(!newEmail) return; setEmails(await apiCall('emails','POST',{email:newEmail})); setNewEmail("");}} className="bg-blue-600 px-4 rounded-lg text-xs font-bold">EKLE</button>
              </div>
              <div className="space-y-1">
                {emails.map(e => <div key={e} className="text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 flex justify-between items-center group"><span>{e}</span><button onClick={async()=>setEmails(await apiCall('emails','DELETE',{email:e}))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Sil</button></div>)}
              </div>
            </section>

            <section className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Link Takibi</h2>
              <div className="flex gap-2 mb-4">
                <input value={newLink} onChange={e=>setNewLink(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm flex-1 outline-none focus:border-emerald-500" placeholder="google.com..." />
                <button onClick={async ()=>{if(!newLink) return; setLinks(await apiCall('links','POST',{link:newLink})); setNewLink("");}} className="bg-emerald-600 px-4 rounded-lg text-xs font-bold">EKLE</button>
              </div>
              <div className="space-y-1">
                {links.map(l => <div key={l} className="text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 flex justify-between items-center group"><span className="truncate w-32">{l}</span><button onClick={async()=>setLinks(await apiCall('links','DELETE',{link:l}))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Sil</button></div>)}
              </div>
            </section>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-blue-400">Canlı Akış</h2>
            <div className="space-y-3">
              {orders.length === 0 ? (
                  <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 p-16 rounded-3xl text-center text-slate-500 uppercase text-[10px] font-black">Yeni sipariş bekleniyor...</div>
              ) : (
                  orders.map((o, i) => (
                      <div key={i} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xl border-l-4 border-l-blue-500 animate-in slide-in-from-right duration-500">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-bold uppercase">
                            <span>{o.platform}</span>
                            <span>#{o.orderCode}</span>
                          </div>
                          <div className="text-xl font-bold uppercase">{o.customerName}</div>
                          <div className="text-sm text-slate-400 mt-2 italic bg-slate-900/30 p-2 rounded-lg">{o.items}</div>
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
