'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Church, 
  Newspaper, 
  Wallet, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronRight,
  Menu,
  X,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Warta {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Ibadah' | 'Kegiatan' | 'Pengumuman';
  authorUid: string;
}

interface Keuangan {
  id: string;
  description: string;
  amount: number;
  type: 'Masuk' | 'Keluar';
  date: string;
  authorUid: string;
}

// --- Components ---

export default function HomePage() {
  const [user, loading, error] = useAuthState(auth);
  const isAdmin = user?.email === 'agusthinuspaide@gmail.com';
  const [activeTab, setActiveTab] = useState<'warta' | 'keuangan' | 'admin'>('warta');
  const [wartaList, setWartaList] = useState<Warta[]>([]);
  const [keuanganList, setKeuanganList] = useState<Keuangan[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin Forms State
  const [wartaForm, setWartaForm] = useState<{ title: string; content: string; category: 'Ibadah' | 'Kegiatan' | 'Pengumuman' }>({ title: '', content: '', category: 'Pengumuman' });
  const [keuanganForm, setKeuanganForm] = useState({ description: '', amount: 0, type: 'Masuk' as const });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Real-time Listeners
  useEffect(() => {
    const qWarta = query(collection(db, 'warta'), orderBy('date', 'desc'));
    const unsubWarta = onSnapshot(qWarta, (snapshot) => {
      setWartaList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warta)));
    });

    const qKeuangan = query(collection(db, 'keuangan'), orderBy('date', 'desc'));
    const unsubKeuangan = onSnapshot(qKeuangan, (snapshot) => {
      setKeuanganList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Keuangan)));
    });

    return () => {
      unsubWarta();
      unsubKeuangan();
    };
  }, []);

  // Auth Functions
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        alert("Domain ini belum terdaftar di Firebase. Silakan tambahkan domain website Anda ke 'Authorized Domains' di Firebase Console.");
      } else {
        alert("Gagal login: " + err.message);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  // CRUD Functions
  const saveWarta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const data = { ...wartaForm, date: new Date().toISOString(), authorUid: user?.uid };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'warta', editingId), data);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'warta'), data);
      }
      setWartaForm({ title: '', content: '', category: 'Pengumuman' });
    } catch (err) {
      console.error("Save Warta Error:", err);
    }
  };

  const saveKeuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const data = { ...keuanganForm, date: new Date().toISOString(), authorUid: user?.uid };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'keuangan', editingId), data);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'keuangan'), data);
      }
      setKeuanganForm({ description: '', amount: 0, type: 'Masuk' });
    } catch (err) {
      console.error("Save Keuangan Error:", err);
    }
  };

  const deleteItem = async (col: 'warta' | 'keuangan', id: string) => {
    if (!isAdmin) return;
    if (confirm('Hapus data ini?')) {
      await deleteDoc(doc(db, col, id));
    }
  };

  const totalMasuk = keuanganList.filter(k => k.type === 'Masuk').reduce((acc, curr) => acc + curr.amount, 0);
  const totalKeluar = keuanganList.filter(k => k.type === 'Keluar').reduce((acc, curr) => acc + curr.amount, 0);
  const saldo = totalMasuk - totalKeluar;

  return (
    <div className="min-h-screen flex flex-col">
      {/* --- Navigation --- */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-stone-900 p-2 rounded-lg">
                <Church className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight">Marturia Abasi</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setActiveTab('warta')}
                className={`text-sm font-medium transition-colors ${activeTab === 'warta' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
              >
                Warta Jemaat
              </button>
              <button 
                onClick={() => setActiveTab('keuangan')}
                className={`text-sm font-medium transition-colors ${activeTab === 'keuangan' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
              >
                Laporan Kas
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setActiveTab('admin')}
                  className={`text-sm font-medium transition-colors ${activeTab === 'admin' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  Admin Panel
                </button>
              )}
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-stone-200">
                  <span className="text-xs text-stone-500">{user.displayName}</span>
                  <button onClick={handleLogout} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <LogOut className="w-4 h-4 text-stone-600" />
                  </button>
                </div>
              ) : (
                <button onClick={handleLogin} className="flex items-center gap-2 text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Admin Login
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-4"
            >
              <button onClick={() => { setActiveTab('warta'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium">Warta Jemaat</button>
              <button onClick={() => { setActiveTab('keuangan'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium">Laporan Kas</button>
              {isAdmin && <button onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium">Admin Panel</button>}
              {!user && <button onClick={handleLogin} className="block w-full text-left py-2 font-medium text-stone-900">Admin Login</button>}
              {user && <button onClick={handleLogout} className="block w-full text-left py-2 font-medium text-red-600">Logout</button>}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- Hero Section --- */}
      <header className="bg-stone-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-light mb-4"
          >
            GPDPB Marturia Abasi
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-stone-400 text-lg font-light tracking-wide uppercase"
          >
            Melayani dengan Kasih dan Kebenaran
          </motion.p>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- Warta Jemaat View --- */}
        {activeTab === 'warta' && (
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-3xl font-serif">Warta Jemaat</h2>
                <p className="text-stone-500 text-sm">Informasi terkini kegiatan dan pengumuman gereja.</p>
              </div>
              <Newspaper className="text-stone-300 w-12 h-12" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wartaList.length > 0 ? wartaList.map((warta) => (
                <motion.div 
                  layout
                  key={warta.id}
                  className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${
                      warta.category === 'Ibadah' ? 'bg-blue-50 text-blue-600' : 
                      warta.category === 'Kegiatan' ? 'bg-green-50 text-green-600' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {warta.category}
                    </span>
                    <span className="text-xs text-stone-400">
                      {format(new Date(warta.date), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-stone-800">{warta.title}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{warta.content}</p>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center text-stone-400 italic">
                  Belum ada warta jemaat terbaru.
                </div>
              )}
            </div>
          </section>
        )}

        {/* --- Laporan Keuangan View --- */}
        {activeTab === 'keuangan' && (
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-3xl font-serif">Laporan Kas Keuangan</h2>
                <p className="text-stone-500 text-sm">Transparansi pengelolaan dana jemaat.</p>
              </div>
              <Wallet className="text-stone-300 w-12 h-12" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Total Masuk</p>
                <p className="text-2xl font-bold text-green-600">Rp {totalMasuk.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Total Keluar</p>
                <p className="text-2xl font-bold text-red-600">Rp {totalKeluar.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-stone-900 p-6 rounded-2xl shadow-lg">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Saldo Akhir</p>
                <p className="text-2xl font-bold text-white">Rp {saldo.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Tanggal</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Keterangan</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Jenis</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {keuanganList.length > 0 ? keuanganList.map((k) => (
                      <tr key={k.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-stone-500">
                          {format(new Date(k.date), 'dd/MM/yy')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-stone-800">{k.description}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${k.type === 'Masuk' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {k.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${k.type === 'Masuk' ? 'text-green-600' : 'text-red-600'}`}>
                          {k.type === 'Keluar' && '-'} Rp {k.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-stone-400 italic">Belum ada data transaksi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* --- Admin Panel --- */}
        {activeTab === 'admin' && isAdmin && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-3xl font-serif">Admin Panel</h2>
                <p className="text-stone-500 text-sm">Kelola data warta dan keuangan gereja.</p>
              </div>
              <Settings className="text-stone-300 w-12 h-12" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Manage Warta */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> {editingId ? 'Edit Warta' : 'Tambah Warta'}
                  </h3>
                  <form onSubmit={saveWarta} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Judul</label>
                      <input 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                        value={wartaForm.title}
                        onChange={e => setWartaForm({...wartaForm, title: e.target.value})}
                        placeholder="Contoh: Ibadah Minggu Raya"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Kategori</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                        value={wartaForm.category}
                        onChange={e => setWartaForm({...wartaForm, category: e.target.value as any})}
                      >
                        <option value="Ibadah">Ibadah</option>
                        <option value="Kegiatan">Kegiatan</option>
                        <option value="Pengumuman">Pengumuman</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Isi Warta</label>
                      <textarea 
                        required
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                        value={wartaForm.content}
                        onChange={e => setWartaForm({...wartaForm, content: e.target.value})}
                        placeholder="Tulis detail pengumuman di sini..."
                      />
                    </div>
                    <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-colors">
                      {editingId ? 'Update Warta' : 'Simpan Warta'}
                    </button>
                    {editingId && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingId(null); setWartaForm({ title: '', content: '', category: 'Pengumuman' }); }}
                        className="w-full text-stone-500 text-sm py-2"
                      >
                        Batal Edit
                      </button>
                    )}
                  </form>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400">Daftar Warta</h4>
                  {wartaList.map(w => (
                    <div key={w.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-stone-800">{w.title}</p>
                        <p className="text-xs text-stone-400">{format(new Date(w.date), 'dd/MM/yy')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(w.id); setWartaForm({ title: w.title, content: w.content, category: w.category }); }} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-900 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteItem('warta', w.id)} className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manage Keuangan */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Tambah Transaksi
                  </h3>
                  <form onSubmit={saveKeuangan} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Keterangan</label>
                      <input 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                        value={keuanganForm.description}
                        onChange={e => setKeuanganForm({...keuanganForm, description: e.target.value})}
                        placeholder="Contoh: Persembahan Syukur"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Jenis</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                          value={keuanganForm.type}
                          onChange={e => setKeuanganForm({...keuanganForm, type: e.target.value as any})}
                        >
                          <option value="Masuk">Masuk</option>
                          <option value="Keluar">Keluar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Jumlah (Rp)</label>
                        <input 
                          required
                          type="number"
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                          value={keuanganForm.amount}
                          onChange={e => setKeuanganForm({...keuanganForm, amount: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-colors">
                      Simpan Transaksi
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400">Daftar Transaksi</h4>
                  {keuanganList.map(k => (
                    <div key={k.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-stone-800">{k.description}</p>
                        <p className={`text-xs font-bold ${k.type === 'Masuk' ? 'text-green-600' : 'text-red-600'}`}>
                          {k.type === 'Masuk' ? '+' : '-'} Rp {k.amount.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button onClick={() => deleteItem('keuangan', k.id)} className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* --- Footer --- */}
      <footer className="bg-stone-50 border-t border-stone-200 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Church className="text-stone-900 w-5 h-5" />
              <span className="font-bold">GPDPB Marturia Abasi</span>
            </div>
            <p className="text-stone-500 text-sm max-w-sm">
              Menjadi jemaat yang bertumbuh dalam iman, pengharapan, dan kasih melalui pelayanan yang tulus.
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">Lokasi & Kontak</p>
            <p className="text-sm text-stone-600">Jl. Raya Abasi No. 123, Manokwari</p>
            <p className="text-sm text-stone-600">Email: info@marturiaabasi.org</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} GPDPB Marturia Abasi. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
