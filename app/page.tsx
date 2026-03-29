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
  setDoc,
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
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
  LogIn,
  Users,
  ShieldCheck,
  UploadCloud,
  Download,
  Bell,
  FileText,
  Loader2,
  Home,
  Info,
  Image as ImageIcon,
  Heart,
  History,
  Users2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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

// --- Constants ---
const VERSES = [
  { text: "Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan.", ref: "Yeremia 29:11" },
  { text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.", ref: "Filipi 4:13" },
  { text: "Tuhan adalah gembalaku, takkan kekurangan aku.", ref: "Mazmur 23:1" },
  { text: "Kasihilah sesamamu manusia seperti dirimu sendiri.", ref: "Matius 22:39" }
];

// --- Components ---

export default function HomePage() {
  const [user, loading, error] = useAuthState(auth);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const isAdmin = user?.email === 'agusthinuspaide@gmail.com' || userRole === 'admin';
  const [activeTab, setActiveTab] = useState<'home' | 'tentang' | 'warta' | 'keuangan' | 'galeri' | 'admin'>('home');
  const [adminSubTab, setAdminSubTab] = useState<'warta' | 'keuangan' | 'users' | 'uploads' | 'prayers'>('warta');
  const [wartaList, setWartaList] = useState<Warta[]>([]);
  const [keuanganList, setKeuanganList] = useState<Keuangan[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [uploadList, setUploadList] = useState<any[]>([]);
  const [prayerRequestList, setPrayerRequestList] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prayer Request State
  const [isSubmittingPrayer, setIsSubmittingPrayer] = useState(false);
  const [prayerForm, setPrayerForm] = useState({ senderName: '', request: '' });

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ senderName: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Notification State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  // Admin Forms State
  const [wartaForm, setWartaForm] = useState<{ title: string; content: string; category: 'Ibadah' | 'Kegiatan' | 'Pengumuman' }>({ title: '', content: '', category: 'Pengumuman' });
  const [keuanganForm, setKeuanganForm] = useState({ description: '', amount: 0, type: 'Masuk' as const });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync User Data & Fetch Role
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      
      // 1. Get current role
      const unsubRole = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        } else {
          // If first time login, create user doc as 'user'
          setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            role: user.email === 'agusthinuspaide@gmail.com' ? 'admin' : 'user',
            lastLogin: new Date().toISOString()
          });
        }
      });

      return () => unsubRole();
    } else {
      setUserRole(null);
    }
  }, [user]);

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

    // Fetch all users for admin management
    let unsubUsers = () => {};
    let unsubUploads = () => {};
    let unsubPrayers = () => {};
    if (isAdmin) {
      const qUsers = query(collection(db, 'users'));
      unsubUsers = onSnapshot(qUsers, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const qUploads = query(collection(db, 'uploads'), orderBy('date', 'desc'));
      unsubUploads = onSnapshot(qUploads, (snapshot) => {
        setUploadList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const qPrayers = query(collection(db, 'prayer_requests'), orderBy('date', 'desc'));
      unsubPrayers = onSnapshot(qPrayers, (snapshot) => {
        setPrayerRequestList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    // Check Notification Permission
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    return () => {
      unsubWarta();
      unsubKeuangan();
      unsubUsers();
      unsubUploads();
      unsubPrayers();
    };
  }, [isAdmin]);

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

  const deleteItem = async (col: 'warta' | 'keuangan' | 'uploads' | 'prayer_requests', id: string) => {
    if (!isAdmin) return;
    if (confirm('Hapus data ini?')) {
      await deleteDoc(doc(db, col, id));
    }
  };

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerForm.senderName || !prayerForm.request) return;

    setIsSubmittingPrayer(true);
    try {
      await addDoc(collection(db, 'prayer_requests'), {
        senderName: prayerForm.senderName,
        request: prayerForm.request,
        date: new Date().toISOString()
      });

      alert('Permohonan doa berhasil dikirim. Kami akan mendoakan Anda.');
      setPrayerForm({ senderName: '', request: '' });
    } catch (err) {
      console.error("Prayer Request Error:", err);
      alert("Gagal mengirim permohonan doa.");
    } finally {
      setIsSubmittingPrayer(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.senderName) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `jemaat_uploads/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'uploads'), {
        fileName: selectedFile.name,
        fileUrl: downloadUrl,
        senderName: uploadForm.senderName,
        description: uploadForm.description,
        date: new Date().toISOString()
      });

      alert('File berhasil dikirim! Terima kasih.');
      setUploadForm({ senderName: '', description: '' });
      setSelectedFile(null);
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Gagal mengupload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      new Notification("GPDPB Marturia Abasi", {
        body: "Terima kasih! Anda akan menerima notifikasi jika ada informasi baru.",
        icon: "/church-icon.png" // Optional
      });
    }
  };

  const totalMasuk = keuanganList.filter(k => k.type === 'Masuk').reduce((acc, curr) => acc + curr.amount, 0);
  const totalKeluar = keuanganList.filter(k => k.type === 'Keluar').reduce((acc, curr) => acc + curr.amount, 0);
  const saldo = totalMasuk - totalKeluar;

  const [verseIndex, setVerseIndex] = useState(0);

  useEffect(() => {
    setVerseIndex(Math.floor(Math.random() * VERSES.length));
  }, []);

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
              <span className="font-bold text-xl tracking-tight">Marturia Abasi Official</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => setActiveTab('home')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'home' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
              >
                <Home className="w-4 h-4" /> Home
              </button>
              <button 
                onClick={() => setActiveTab('tentang')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'tentang' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
              >
                <Info className="w-4 h-4" /> Tentang
              </button>
              <button 
                onClick={() => setActiveTab('warta')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'warta' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
              >
                <Newspaper className="w-4 h-4" /> Warta
              </button>
              <button 
                onClick={() => setActiveTab('keuangan')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'keuangan' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
              >
                <Wallet className="w-4 h-4" /> Kas
              </button>
              <button 
                onClick={() => setActiveTab('galeri')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'galeri' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
              >
                <ImageIcon className="w-4 h-4" /> Galeri
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setActiveTab('admin')}
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'admin' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  <Settings className="w-4 h-4" /> Admin
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
              className="md:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-2"
            >
              <button onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium text-stone-700 hover:text-stone-900"><Home className="w-5 h-5" /> Home</button>
              <button onClick={() => { setActiveTab('tentang'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium text-stone-700 hover:text-stone-900"><Info className="w-5 h-5" /> Tentang</button>
              <button onClick={() => { setActiveTab('warta'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium text-stone-700 hover:text-stone-900"><Newspaper className="w-5 h-5" /> Warta Jemaat</button>
              <button onClick={() => { setActiveTab('keuangan'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium text-stone-700 hover:text-stone-900"><Wallet className="w-5 h-5" /> Laporan Kas</button>
              <button onClick={() => { setActiveTab('galeri'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium text-stone-700 hover:text-stone-900"><ImageIcon className="w-5 h-5" /> Galeri Foto</button>
              {isAdmin && <button onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full text-left py-2 font-medium text-stone-700 hover:text-stone-900"><Settings className="w-5 h-5" /> Admin Panel</button>}
              <div className="pt-4 border-t border-stone-100">
                {!user ? (
                  <button onClick={handleLogin} className="flex items-center gap-3 w-full text-left py-2 font-medium text-stone-900"><LogIn className="w-5 h-5" /> Admin Login</button>
                ) : (
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left py-2 font-medium text-red-600"><LogOut className="w-5 h-5" /> Logout</button>
                )}
              </div>
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
          
          {/* Verse of the Day */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 max-w-2xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl"
          >
            <p className="text-stone-300 italic text-lg mb-2">&quot;{VERSES[verseIndex].text}&quot;</p>
            <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">— {VERSES[verseIndex].ref}</p>
          </motion.div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- Home View --- */}
        {activeTab === 'home' && (
          <div className="space-y-20">
            {/* Welcome Message */}
            <section className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full text-stone-600 text-xs font-bold uppercase tracking-widest">
                <Heart className="w-3 h-3 text-red-500" /> Selamat Datang di Rumah Tuhan
              </div>
              <h2 className="text-4xl font-serif text-stone-900 leading-tight">Membangun Iman, Berbagi Kasih, Melayani Sesama</h2>
              <p className="text-stone-500 text-lg leading-relaxed">
                Kami adalah komunitas jemaat GPDPB Marturia Abasi yang berkomitmen untuk bertumbuh bersama dalam pengenalan akan Tuhan Yesus Kristus dan menjadi berkat bagi lingkungan sekitar.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button onClick={() => setActiveTab('tentang')} className="bg-stone-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200">
                  Pelajari Sejarah Kami
                </button>
                <button onClick={() => setActiveTab('warta')} className="bg-white border border-stone-200 text-stone-900 px-8 py-4 rounded-xl font-bold hover:bg-stone-50 transition-all shadow-sm">
                  Lihat Warta Terbaru
                </button>
              </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-stone-100">
              <div className="text-center space-y-1">
                <p className="text-4xl font-serif text-stone-900">150+</p>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Jemaat Aktif</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-4xl font-serif text-stone-900">12</p>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Pelayan Tuhan</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-4xl font-serif text-stone-900">5</p>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Kategorial</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-4xl font-serif text-stone-900">1995</p>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Tahun Berdiri</p>
              </div>
            </section>

            {/* Notification Section */}
            <section className="bg-stone-50 p-8 md:p-12 rounded-[3rem] border border-stone-200 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-6 bg-white rounded-3xl shadow-sm">
                  <Bell className={`w-12 h-12 ${notifPermission === 'granted' ? 'text-green-500' : 'text-stone-300'}`} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif">Nyalakan Pengingat</h2>
                  <p className="text-stone-500 text-sm max-w-xs">
                    Dapatkan notifikasi langsung di HP atau Komputer Anda setiap kali ada informasi baru.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-3">
                {notifPermission === 'granted' ? (
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-8 py-4 rounded-2xl">
                    <ShieldCheck className="w-5 h-5" /> Notifikasi Aktif
                  </div>
                ) : (
                  <button 
                    onClick={requestNotifPermission}
                    className="bg-stone-900 text-white px-10 py-5 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 flex items-center gap-3"
                  >
                    <Bell className="w-5 h-5" /> Aktifkan Sekarang
                  </button>
                )}
                {notifPermission === 'denied' && (
                  <p className="text-[10px] text-red-500 italic">
                    Notifikasi diblokir. Silakan aktifkan melalui pengaturan browser Anda.
                  </p>
                )}
              </div>
            </section>

            {/* Prayer Request Section */}
            <section className="bg-stone-900 text-white p-8 md:p-16 rounded-[3rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-stone-300 text-[10px] font-bold uppercase tracking-widest mb-6">
                    Layanan Doa
                  </div>
                  <h2 className="text-4xl font-serif mb-6">Permohonan Doa</h2>
                  <p className="text-stone-400 text-lg leading-relaxed mb-8">
                    &quot;Sebab di mana dua atau tiga orang berkumpul dalam Nama-Ku, di situ Aku ada di tengah-tengah mereka.&quot; 
                    (Matius 18:20). Kami siap mendoakan pergumulan Anda.
                  </p>
                  <div className="flex items-center gap-4 text-stone-300">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <p className="text-sm">Permohonan doa Anda bersifat pribadi dan hanya akan dibaca oleh tim pendoa kami.</p>
                  </div>
                </div>
                <form onSubmit={handlePrayerSubmit} className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Nama Lengkap</label>
                    <input 
                      required
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      value={prayerForm.senderName}
                      onChange={e => setPrayerForm({...prayerForm, senderName: e.target.value})}
                      placeholder="Nama Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Pokok Doa</label>
                    <textarea 
                      required
                      rows={4}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      value={prayerForm.request}
                      onChange={e => setPrayerForm({...prayerForm, request: e.target.value})}
                      placeholder="Tuliskan permohonan doa Anda di sini..."
                    />
                  </div>
                  <button 
                    disabled={isSubmittingPrayer}
                    type="submit" 
                    className="w-full bg-white text-stone-900 py-4 rounded-xl font-bold hover:bg-stone-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingPrayer ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    {isSubmittingPrayer ? 'Sedang Mengirim...' : 'Kirim Permohonan Doa'}
                  </button>
                </form>
              </div>
            </section>

            {/* Lokasi Section */}
            <section className="py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full text-stone-600 text-[10px] font-bold uppercase tracking-widest">
                    Kunjungi Kami
                  </div>
                  <h2 className="text-4xl font-serif">Lokasi Gereja</h2>
                  <p className="text-stone-600 leading-relaxed text-lg">
                    Gereja GPDPB Marturia Abasi terletak di kawasan Abasi, Distrik Manokwari Timur. 
                    Kami mengundang Anda untuk beribadah bersama kami setiap hari Minggu.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 text-stone-700">
                      <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                        <Home className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Alamat</p>
                        <p className="text-sm text-stone-500">Jl. Abasi, Manokwari Timur, Papua Barat</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 text-stone-700">
                      <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Jadwal Ibadah</p>
                        <p className="text-sm text-stone-500">Ibadah Minggu Raya: 09:00 WIT</p>
                      </div>
                    </div>
                  </div>
                  <a 
                    href="https://maps.app.goo.gl/TeZqbTvngXUFicLt5" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                  >
                    Petunjuk Arah Google Maps
                  </a>
                </div>
                <div className="relative aspect-square md:aspect-video rounded-[2rem] overflow-hidden border border-stone-200 shadow-2xl group">
                  <Image 
                    src="https://picsum.photos/seed/church-location/800/450" 
                    alt="Lokasi Gereja" 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-900/20 group-hover:bg-stone-900/10 transition-colors" />
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border border-white/20">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Pusat Pelayanan</p>
                    <p className="text-lg font-bold text-stone-900">GPDPB Marturia Abasi Official</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* --- Tentang View --- */}
        {activeTab === 'tentang' && (
          <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Sejarah Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl">
                <Image 
                  src="https://picsum.photos/seed/church-history/600/800" 
                  alt="Sejarah Gereja" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
                <div className="absolute bottom-10 left-10 text-white">
                  <p className="text-5xl font-serif mb-2">1995</p>
                  <p className="text-sm uppercase tracking-widest font-bold opacity-80">Tahun Perintisan</p>
                </div>
              </div>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full text-stone-600 text-[10px] font-bold uppercase tracking-widest">
                  <History className="w-3 h-3" /> Jejak Langkah Kami
                </div>
                <h2 className="text-5xl font-serif text-stone-900">Sejarah Berdirinya Jemaat</h2>
                <div className="space-y-6 text-stone-600 leading-relaxed text-lg">
                  <p>
                    GPDPB Marturia Abasi lahir dari sebuah kerinduan kecil sekelompok umat Tuhan di pesisir Abasi untuk memiliki tempat persekutuan yang tetap. Dimulai dari ibadah rumah ke rumah pada pertengahan tahun 90-an, benih iman ini terus bertumbuh.
                  </p>
                  <p>
                    Dengan semangat gotong royong dan iman yang teguh, jemaat mulai membangun gedung gereja sederhana yang kini telah berkembang menjadi pusat pelayanan rohani bagi masyarakat sekitar. Nama &quot;Marturia&quot; dipilih sebagai pengingat akan panggilan setiap jemaat untuk menjadi saksi Kristus di tengah dunia.
                  </p>
                  <p>
                    Hingga saat ini, kami terus berkomitmen untuk menjaga warisan iman para pendahulu sambil terus berinovasi dalam pelayanan untuk menjangkau generasi muda.
                  </p>
                </div>
              </div>
            </section>

            {/* Visi Misi */}
            <section className="bg-stone-50 p-12 md:p-20 rounded-[4rem] border border-stone-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-6">
                  <h3 className="text-3xl font-serif text-stone-900">Visi Kami</h3>
                  <p className="text-xl text-stone-600 italic leading-relaxed">
                    &quot;Menjadi jemaat yang berakar kuat dalam Firman, bertumbuh dalam karakter Kristus, dan berbuah bagi kemuliaan Bapa.&quot;
                  </p>
                </div>
                <div className="space-y-6">
                  <h3 className="text-3xl font-serif text-stone-900">Misi Kami</h3>
                  <ul className="space-y-4">
                    {[
                      "Menyelenggarakan ibadah yang hidup dan berpusat pada Kristus.",
                      "Membangun persekutuan yang hangat dan saling menguatkan.",
                      "Melaksanakan pemuridan yang berkelanjutan bagi semua usia.",
                      "Menjadi saluran berkat melalui aksi sosial dan kemanusiaan."
                    ].map((misi, i) => (
                      <li key={i} className="flex items-start gap-4 text-stone-600">
                        <div className="w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center shrink-0 text-[10px] mt-1">{i+1}</div>
                        <p className="text-lg">{misi}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Struktur Organisasi */}
            <section className="space-y-12">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full text-stone-600 text-[10px] font-bold uppercase tracking-widest">
                  <Users2 className="w-3 h-3" /> Struktur Pelayanan
                </div>
                <h2 className="text-4xl font-serif text-stone-900">Struktur Organisasi Jemaat</h2>
                <p className="text-stone-500 max-w-2xl mx-auto">
                  Pelayanan kami dijalankan oleh para hamba Tuhan dan pengurus yang berdedikasi untuk memastikan seluruh kegiatan jemaat berjalan dengan baik.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { role: "Ketua Majelis Jemaat", name: "Pdt. Nama Gembala", desc: "Pemimpin Rohani & Visi" },
                  { role: "Sekretaris Jemaat", name: "Bpk. Nama Sekretaris", desc: "Administrasi & Komunikasi" },
                  { role: "Bendahara Jemaat", name: "Ibu. Nama Bendahara", desc: "Pengelolaan Keuangan" }
                ].map((staff, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm text-center space-y-4 hover:shadow-md transition-shadow">
                    <div className="w-24 h-24 bg-stone-100 rounded-full mx-auto overflow-hidden relative border-4 border-white shadow-inner">
                      <Image src={`https://picsum.photos/seed/staff-${i}/200/200`} alt={staff.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">{staff.role}</p>
                      <p className="text-xl font-bold text-stone-900">{staff.name}</p>
                      <p className="text-sm text-stone-500">{staff.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Kategorial */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Komisi Anak", "Komisi Remaja", "Komisi Pemuda", "Komisi Wanita", "Komisi Pria"].map((komisi, i) => (
                  <div key={i} className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center">
                    <p className="font-bold text-stone-800 text-sm">{komisi}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        
        {/* --- Warta Jemaat View --- */}
        {activeTab === 'warta' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="space-y-8">
              <div className="flex justify-between items-end border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-4xl font-serif">Warta Jemaat</h2>
                  <p className="text-stone-500 text-sm">Informasi terkini kegiatan dan pengumuman gereja.</p>
                </div>
                <Newspaper className="text-stone-300 w-16 h-16" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {wartaList.length > 0 ? wartaList.map((warta) => (
                  <motion.div 
                    layout
                    key={warta.id}
                    className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${
                        warta.category === 'Ibadah' ? 'bg-blue-50 text-blue-600' : 
                        warta.category === 'Kegiatan' ? 'bg-green-50 text-green-600' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {warta.category}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">
                        {format(new Date(warta.date), 'dd MMM yyyy', { locale: id })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-stone-800 group-hover:text-stone-900 transition-colors">{warta.title}</h3>
                    <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">{warta.content}</p>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-24 text-center text-stone-400 italic bg-stone-50 rounded-[2rem] border-2 border-dashed border-stone-200">
                    Belum ada warta jemaat terbaru untuk ditampilkan.
                  </div>
                )}
              </div>
            </section>

            {/* Upload Section */}
            <section className="bg-white p-8 md:p-12 rounded-[3rem] border border-stone-100 shadow-xl shadow-stone-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="p-4 bg-stone-900 rounded-2xl w-fit">
                    <UploadCloud className="text-white w-8 h-8" />
                  </div>
                  <h2 className="text-4xl font-serif">Kirim Data Jemaat</h2>
                  <p className="text-stone-500 text-lg leading-relaxed">
                    Bagi jemaat yang ingin mengupload dokumen, jadwal latihan, atau data lainnya untuk keperluan pengurusan gereja, silakan gunakan formulir ini.
                  </p>
                  <div className="flex items-center gap-3 text-stone-400 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Data Anda aman dan hanya dapat diakses oleh Admin.</span>
                  </div>
                </div>
                
                <form onSubmit={handleFileUpload} className="bg-stone-50 p-8 rounded-3xl border border-stone-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Nama Pengirim</label>
                    <input 
                      required
                      className="w-full px-4 py-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all bg-white"
                      value={uploadForm.senderName}
                      onChange={e => setUploadForm({...uploadForm, senderName: e.target.value})}
                      placeholder="Nama Lengkap Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Keterangan File</label>
                    <input 
                      className="w-full px-4 py-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none transition-all bg-white"
                      value={uploadForm.description}
                      onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                      placeholder="Misal: Jadwal Latihan Paduan Suara"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Pilih Dokumen</label>
                    <input 
                      required
                      type="file"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-stone-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-stone-900 file:text-white hover:file:bg-stone-800 transition-all cursor-pointer"
                    />
                  </div>
                  <button 
                    disabled={isUploading}
                    type="submit" 
                    className="w-full bg-stone-900 text-white py-5 rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-stone-200"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                    {isUploading ? 'Sedang Mengirim...' : 'Kirim Sekarang'}
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}

        {/* --- Laporan Keuangan View --- */}
        {activeTab === 'keuangan' && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-4xl font-serif">Laporan Kas Keuangan</h2>
                <p className="text-stone-500 text-sm">Transparansi pengelolaan dana jemaat untuk kemuliaan Tuhan.</p>
              </div>
              <Wallet className="text-stone-300 w-16 h-16" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-2">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Total Masuk</p>
                <p className="text-3xl font-bold text-green-600">Rp {totalMasuk.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-2">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Total Keluar</p>
                <p className="text-3xl font-bold text-red-600">Rp {totalKeluar.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-stone-900 p-8 rounded-3xl shadow-2xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative z-10">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-bold relative z-10">Saldo Kas Saat Ini</p>
                <p className="text-3xl font-bold text-white relative z-10">Rp {saldo.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-stone-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-stone-500">Tanggal</th>
                      <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-stone-500">Keterangan Transaksi</th>
                      <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-stone-500">Jenis</th>
                      <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-stone-500 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {keuanganList.length > 0 ? keuanganList.map((k) => (
                      <tr key={k.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-8 py-5 text-sm text-stone-500">
                          {format(new Date(k.date), 'dd MMM yyyy', { locale: id })}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-stone-800">{k.description}</td>
                        <td className="px-8 py-5">
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${k.type === 'Masuk' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {k.type.toUpperCase()}
                          </span>
                        </td>
                        <td className={`px-8 py-5 text-sm font-bold text-right ${k.type === 'Masuk' ? 'text-green-600' : 'text-red-600'}`}>
                          {k.type === 'Keluar' && '-'} Rp {k.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-stone-400 italic">Belum ada data transaksi keuangan yang tercatat.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* --- Galeri View --- */}
        {activeTab === 'galeri' && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-4xl font-serif">Galeri Kegiatan</h2>
                <p className="text-stone-500 text-sm">Momen kebersamaan dan pelayanan jemaat GPDPB Marturia Abasi.</p>
              </div>
              <ImageIcon className="text-stone-300 w-16 h-16" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 12].map((i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -8 }}
                  className="aspect-square rounded-[2rem] overflow-hidden border border-stone-100 shadow-lg relative group cursor-pointer"
                >
                  <Image 
                    src={`https://picsum.photos/seed/church-gallery-${i}/600/600`} 
                    alt={`Gallery ${i}`} 
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-bold text-sm uppercase tracking-widest">Lihat Foto</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* --- Admin Panel --- */}
        {activeTab === 'admin' && isAdmin && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-4 gap-4">
              <div>
                <h2 className="text-3xl font-serif">Admin Panel</h2>
                <p className="text-stone-500 text-sm">Kelola data jemaat dan hak akses admin.</p>
              </div>
              <div className="flex bg-stone-100 p-1 rounded-xl">
                <button 
                  onClick={() => setAdminSubTab('warta')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${adminSubTab === 'warta' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                >
                  Warta
                </button>
                <button 
                  onClick={() => setAdminSubTab('keuangan')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${adminSubTab === 'keuangan' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                >
                  Keuangan
                </button>
                <button 
                  onClick={() => setAdminSubTab('users')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${adminSubTab === 'users' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                >
                  Admin
                </button>
                <button 
                  onClick={() => setAdminSubTab('uploads')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${adminSubTab === 'uploads' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                >
                  Uploads
                </button>
                <button 
                  onClick={() => setAdminSubTab('prayers')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${adminSubTab === 'prayers' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                >
                  Doa
                </button>
              </div>
            </div>

            {adminSubTab === 'warta' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm h-fit">
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
            )}

            {adminSubTab === 'keuangan' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm h-fit">
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
            )}

            {adminSubTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-stone-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Nama / Email</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Status Saat Ini</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-stone-800">{u.displayName || 'User Baru'}</p>
                            <p className="text-xs text-stone-400">{u.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${u.role === 'admin' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}`}>
                              {u.role === 'admin' ? 'ADMIN' : 'USER'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.email !== 'agusthinuspaide@gmail.com' && (
                              <button 
                                onClick={async () => {
                                  if (confirm(`Ubah status ${u.email} menjadi ${u.role === 'admin' ? 'User' : 'Admin'}?`)) {
                                    await updateDoc(doc(db, 'users', u.id), { role: u.role === 'admin' ? 'user' : 'admin' });
                                  }
                                }}
                                className="flex items-center gap-2 ml-auto text-xs font-bold bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg transition-colors"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                {u.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-stone-400 italic">
                  * Hanya orang yang sudah pernah login minimal satu kali yang akan muncul di daftar ini.
                </p>
              </div>
            )}

            {adminSubTab === 'uploads' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-stone-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">File / Pengirim</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Tanggal</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {uploadList.length > 0 ? uploadList.map((up) => (
                        <tr key={up.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-stone-100 rounded-lg">
                                <FileText className="w-4 h-4 text-stone-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-stone-800">{up.fileName}</p>
                                <p className="text-xs text-stone-400">Oleh: {up.senderName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-stone-500">
                            {format(new Date(up.date), 'dd/MM/yy HH:mm')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <a 
                                href={up.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button 
                                onClick={() => deleteItem('uploads', up.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-stone-400 italic">Belum ada file yang diupload jemaat.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminSubTab === 'prayers' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-stone-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Pengirim / Permohonan</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500">Tanggal</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-500 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {prayerRequestList.length > 0 ? prayerRequestList.map((pr) => (
                        <tr key={pr.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-stone-800">{pr.senderName}</p>
                            <p className="text-xs text-stone-500 whitespace-pre-wrap mt-1">{pr.request}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-stone-500">
                            {format(new Date(pr.date), 'dd/MM/yy HH:mm')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => deleteItem('prayer_requests', pr.id)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-stone-400 italic">Belum ada permohonan doa.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
            <p className="text-sm text-stone-600">Jl. Abasi, Distrik Manokwari Timur</p>
            <p className="text-sm text-stone-600">Manokwari, Papua Barat</p>
            <a 
              href="https://maps.app.goo.gl/TeZqbTvngXUFicLt5" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-stone-900 mt-4 hover:underline"
            >
              Buka di Google Maps <ChevronRight className="w-3 h-3" />
            </a>
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
