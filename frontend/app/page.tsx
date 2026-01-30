"use client";
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// YAYINLARKEN BURAYI DEĞİŞTİRECEĞİZ
const BACKEND_URL = "https://food-hub-i6wk.onrender.com"; 
const socket = io(BACKEND_URL);

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newLink, setNewLink] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const e = await fetch(`${BACKEND_URL}/api/settings/emails`).then(r => r.json());
        setEmails(e);
        const l = await fetch(`${BACKEND_URL}/api/settings/links`).then(r => r.json());
        setLinks(l);
      } catch (err) { console.log("Backend baglantisi yok."); }
    };
    fetchData();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('admin-new-order', (order) => {
      setOrders(prev => [order, ...prev]);
      new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(()=>{});
    });
    return () => { socket.off('admin-new-order'); };
  }, []);

  const apiCall = async (path: string, method: string, body: any) => {
    const res = await fetch(`${BACKEND_URL}/api/settings/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold tracking-tighter text-blue-400">DEMO FOOD PANEL | Guray OZSEKER</h1>
          <div className={`px-4 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            {isConnected ? 'SİSTEM AKTİF' : 'BAĞLANTI YOK'}
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <section className="bg-slate-800 p-5 rounded-xl border border-slate-700">
              <h2 className="text-xs font-bold text-slate-400 uppercase mb-4">Mailler</h2>
              <div className="flex gap-2 mb-4">
                <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-2 text-sm flex-1 outline-none" placeholder="Email..." />
                <button onClick={async ()=>{setEmails(await apiCall('emails','POST',{email:newEmail})); setNewEmail("");}} className="bg-blue-600 px-3 rounded text-xs">EKLE</button>
              </div>
              {emails.map(e => <div key={e} className="text-xs bg-slate-900 p-2 mb-1 rounded flex justify-between"><span>{e}</span><button onClick={async()=>setEmails(await apiCall('emails','DELETE',{email:e}))} className="text-red-500">Sil</button></div>)}
            </section>

            <section className="bg-slate-800 p-5 rounded-xl border border-slate-700">
              <h2 className="text-xs font-bold text-slate-400 uppercase mb-4">Link Takibi</h2>
              <div className="flex gap-2 mb-4">
                <input value={newLink} onChange={e=>setNewLink(e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-2 text-sm flex-1 outline-none" placeholder="Trendyol vb..." />
                <button onClick={async ()=>{setLinks(await apiCall('links','POST',{link:newLink})); setNewLink("");}} className="bg-emerald-600 px-3 rounded text-xs">EKLE</button>
              </div>
              {links.map(l => <div key={l} className="text-[10px] bg-slate-900 p-2 mb-1 rounded flex justify-between"><span className="truncate w-32">{l}</span><button onClick={async()=>setLinks(await apiCall('links','DELETE',{link:l}))} className="text-red-500 font-sans">Sil</button></div>)}
            </section>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-blue-400">Canlı Akış</h2>
            {orders.length === 0 ? (
                <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-10 rounded-xl text-center text-slate-500 uppercase text-xs font-bold">Sipariş Bekleniyor...</div>
            ) : (
                orders.map((o, i) => (
                    <div key={i} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg border-l-4 border-l-blue-500">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-bold uppercase"><span>{o.platform}</span><span>#{o.orderCode}</span></div>
                        <div className="text-xl font-bold uppercase">{o.customerName}</div>
                        <div className="text-sm text-slate-400 mt-1 italic">{o.items}</div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
