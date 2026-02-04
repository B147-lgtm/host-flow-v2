
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar,
  CalendarDays, 
  Sparkles, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  Package, 
  ShieldCheck, 
  Wallet, 
  TreePine, 
  ClipboardCheck, 
  Globe,
  Plus,
  ChevronRight,
  PlusCircle,
  Layers,
  X,
  Home,
  Trash2,
  Download,
  Cloud,
  FileSpreadsheet,
  Lock,
  Save,
  Database,
  Briefcase,
  RefreshCw,
  Loader2,
  Smartphone,
  Monitor,
  User as UserIcon,
  Fingerprint,
  Leaf,
  CheckCircle2,
  Github,
  Terminal,
  ExternalLink,
  Code2,
  HardDrive,
  Info,
  ArrowRightLeft,
  AlertCircle
} from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import Bookings from './components/Bookings.tsx';
import Guests from './components/Guests.tsx';
import AIInsights from './components/AIInsights.tsx';
import Inventory from './components/Inventory.tsx';
import StaffPortal from './components/StaffPortal.tsx';
import Financials from './components/Financials.tsx';
import CheckInCounter from './components/CheckInCounter.tsx';
import Onboarding from './components/Onboarding.tsx';
import Auth from './components/Auth.tsx';
import { Booking, Transaction, Guest, StaffLog, PropertyConfig, TransactionType, InventoryItem, User, StayPackage } from './types.ts';
import { MOCK_INVENTORY } from './constants.ts';
import { cloudSync, getDeviceName } from './services/cloudService.ts';

enum View {
  DASHBOARD = 'Dashboard',
  COUNTER = 'Check-in Counter',
  BOOKINGS = 'Bookings',
  GUESTS = 'Guests',
  INVENTORY = 'Inventory',
  FINANCIALS = 'Financials',
  INSIGHTS = 'AI Strategy',
  STAFF_PORTAL = 'Staff Portal'
}

const STORAGE_KEY_SESSION = 'hostflow_active_session_v9_final';
const STORAGE_KEY_STATE = 'hostflow_cached_state_v9_final';

const DEFAULT_PACKAGES: StayPackage[] = [
  { id: 'p1', title: 'Basic 8-Room Stay', desc: 'Full access to 8 guest rooms and standard common areas.', iconType: 'home' },
  { id: 'p2', title: '8-Room + Presidential Suite', desc: 'Premium upgrade including luxury presidential quarters.', iconType: 'star' },
  { id: 'p3', title: 'Event Plus Package', desc: 'Accommodation combined with private garden venue access.', iconType: 'sparkles' }
];

const SidebarItem = ({ icon: Icon, label, active, onClick, disabled = false }: { icon: any, label: string, active: boolean, onClick: () => void, disabled?: boolean }) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
        : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPassword, setUserPassword] = useState<string | null>(null);
  
  const [dataReadyForPush, setDataReadyForPush] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(0);
  const [lastDevice, setLastDevice] = useState<string>(getDeviceName());
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [isSyncCenterOpen, setIsSyncCenterOpen] = useState(false);
  const [syncCenterTab, setSyncCenterTab] = useState<'data' | 'code'>('data');
  
  const syncTimeoutRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const [properties, setProperties] = useState<PropertyConfig[]>([]);
  const [activePropertyId, setActivePropertyId] = useState<string | 'all'>('all');
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [allStaffLogs, setAllStaffLogs] = useState<StaffLog[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>(MOCK_INVENTORY); 
  const [stayPackages, setStayPackages] = useState<StayPackage[]>(DEFAULT_PACKAGES);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);
      
      if (savedSession) {
        try {
          const { email, password } = JSON.parse(savedSession);
          setUserEmail(email);
          setUserPassword(password);

          const localCache = localStorage.getItem(STORAGE_KEY_STATE);
          if (localCache) {
            const cachedData = JSON.parse(localCache);
            rehydrateState(cachedData);
            setLastSyncedAt(cachedData.lastSyncedAt || 0);
          }

          const remoteData = await cloudSync.pull(email, password);
          if (remoteData && (!lastSyncedAt || remoteData.lastSyncedAt > lastSyncedAt)) {
            rehydrateState(remoteData);
            setLastSyncedAt(remoteData.lastSyncedAt);
            setLastDevice(remoteData.lastActiveDevice || "Cloud Vault");
          }
          
          setDataReadyForPush(true);
        } catch (e) {
          console.error("Session rehydration failed:", e);
        }
      }
      setIsInitialLoading(false);
    };

    bootstrap();
  }, []);

  const rehydrateState = (data: any) => {
    if (!data) return;
    if (data.currentUser) setCurrentUser(data.currentUser);
    if (data.properties) setProperties(data.properties);
    if (data.activePropertyId) setActivePropertyId(data.activePropertyId);
    if (data.currentView) setCurrentView(data.currentView);
    if (data.allBookings) setAllBookings(data.allBookings);
    if (data.allTransactions) setAllTransactions(data.allTransactions);
    if (data.allGuests) setAllGuests(data.allGuests);
    if (data.allStaffLogs) setAllStaffLogs(data.allStaffLogs);
    if (data.allInventory) setAllInventory(data.allInventory.length > 0 ? data.allInventory : MOCK_INVENTORY);
    if (data.stayPackages) setStayPackages(data.stayPackages);
  };

  const handleManualSync = async () => {
    if (!userEmail || !userPassword || !currentUser || isSyncing) return;
    
    setIsSyncing(true);
    const now = Date.now();
    const stateToPersist = {
      currentUser, properties, activePropertyId, currentView, 
      allBookings, allTransactions, allGuests, allStaffLogs, allInventory, stayPackages,
      lastSyncedAt: now
    };

    const success = await cloudSync.push(userEmail, userPassword, stateToPersist);
    setIsSyncing(false);
    
    if (success) {
      setLastSyncedAt(now);
      setLastDevice("Manual Push");
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    }
  };

  const handleLogin = (user: User, email: string, password: string, remoteData: any | null) => {
    setUserEmail(email);
    setUserPassword(password);
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({ email, password }));
    if (remoteData) {
      rehydrateState(remoteData);
      setLastSyncedAt(remoteData.lastSyncedAt || Date.now());
      setLastDevice(remoteData.lastActiveDevice || "Initial Sync");
    } else {
      setLastSyncedAt(Date.now());
    }
    setDataReadyForPush(true);
  };

  useEffect(() => { 
    if (dataReadyForPush && userEmail && userPassword && currentUser) {
      const now = Date.now();
      const stateToPersist = {
        currentUser, properties, activePropertyId, currentView, 
        allBookings, allTransactions, allGuests, allStaffLogs, allInventory, stayPackages,
        lastSyncedAt: now
      };
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(stateToPersist));

      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = window.setTimeout(() => {
        setIsSyncing(true);
        cloudSync.push(userEmail, userPassword, stateToPersist).then((success) => {
          setIsSyncing(false);
          if (success) {
            setLastSyncedAt(now);
          }
        });
      }, 5000); 
    }
  }, [properties, activePropertyId, currentView, allBookings, allTransactions, allGuests, allStaffLogs, allInventory, userEmail, userPassword, currentUser, dataReadyForPush, stayPackages]);

  const handleAddTransaction = (newTrans: Transaction) => {
    const propertyId = activePropertyId === 'all' ? (properties[0]?.id || 'prop-1') : activePropertyId;
    setAllTransactions(prev => [{ ...newTrans, propertyId }, ...prev]);
  };

  const handleAddBooking = (newBooking: Booking, newTransaction: Transaction, newGuestList?: Guest[]) => {
    const propertyId = activePropertyId === 'all' ? (properties[0]?.id || 'prop-1') : activePropertyId;
    setAllBookings(prev => [{ ...newBooking, propertyId }, ...prev]);
    handleAddTransaction({ ...newTransaction, propertyId });
    if (newGuestList) newGuestList.forEach(g => handleAddGuest({ ...g, propertyId }));
  };

  const handleAddGuest = (newGuest: Guest) => {
    setAllGuests(prev => {
      const exists = prev.find(g => (newGuest.email && g.email === newGuest.email) || (newGuest.phone && g.phone === newGuest.phone));
      if (exists) return prev.map(g => g.id === exists.id ? { ...g, ...newGuest, id: g.id } : g);
      return [{ ...newGuest }, ...prev];
    });
  };

  const handleUpdateInventory = (items: InventoryItem[]) => setAllInventory(items);
  const handleUpdateTransaction = (updatedTrans: Transaction) => setAllTransactions(prev => prev.map(t => t.id === updatedTrans.id ? updatedTrans : t));
  const handleDeleteTransaction = (id: string) => setAllTransactions(prev => prev.filter(t => t.id !== id));
  const handleUpdateBooking = (updatedBooking: Booking) => setAllBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
  const handleDeleteBooking = (id: string) => setAllBookings(prev => prev.filter(b => b.id !== id));
  const handleDeleteGuest = (id: string) => setAllGuests(prev => prev.filter(g => g.id !== id));
  const handleUpdateProperty = (config: PropertyConfig) => setProperties(prev => prev.map(p => p.id === config.id ? config : p));
  const handleAddProperty = (config: PropertyConfig) => { setProperties(prev => [...prev, config]); setActivePropertyId(config.id); setIsAddPropertyModalOpen(false); };
  
  const handleLogout = () => { 
    if (window.confirm("Sign out from this device? Your account remains safe in the HostFlow cloud.")) { 
      localStorage.removeItem(STORAGE_KEY_SESSION);
      localStorage.removeItem(STORAGE_KEY_STATE);
      setCurrentUser(null); setUserEmail(null); setUserPassword(null); setDataReadyForPush(false); 
      setProperties([]); setAllBookings([]); setAllTransactions([]); setAllGuests([]); setAllStaffLogs([]); setAllInventory(MOCK_INVENTORY);
    } 
  };

  const filteredBookings = activePropertyId === 'all' ? allBookings : allBookings.filter(b => b.propertyId === activePropertyId);
  const filteredTransactions = activePropertyId === 'all' ? allTransactions : allTransactions.filter(t => t.propertyId === activePropertyId);
  const filteredGuests = activePropertyId === 'all' ? allGuests : allGuests.filter(g => g.propertyId === activePropertyId);
  const filteredInventory = activePropertyId === 'all' ? allInventory : allInventory.filter(i => i.propertyId === activePropertyId);
  const filteredLogs = activePropertyId === 'all' ? allStaffLogs : allStaffLogs.filter(l => l.propertyId === activePropertyId);
  const activeProperty = properties.find(p => p.id === activePropertyId);

  const renderView = () => {
    if (properties.length === 0) return null;
    switch(currentView) {
      case View.DASHBOARD: return <Dashboard bookings={filteredBookings} transactions={filteredTransactions} guests={filteredGuests} staffLogs={filteredLogs} property={activeProperty || { name: 'Portfolio' } as any} isGlobal={activePropertyId === 'all'} />;
      case View.COUNTER: return <CheckInCounter onCheckInComplete={handleAddBooking} propertyName={activeProperty?.name || properties[0].name} stayPackages={stayPackages} />;
      case View.BOOKINGS: return <Bookings bookings={filteredBookings} onAddBooking={handleAddBooking} onDeleteBooking={handleDeleteBooking} onUpdateBooking={handleUpdateBooking} property={activeProperty || properties[0]} onUpdateProperty={handleUpdateProperty} />;
      case View.GUESTS: return <Guests guests={filteredGuests} transactions={allTransactions} propertyName={activeProperty?.name || 'Portfolio'} onDeleteGuest={handleDeleteGuest} onAddGuest={handleAddGuest} />;
      case View.INVENTORY: return <Inventory propertyName={activeProperty?.name || properties[0].name} bookings={filteredBookings} inventoryItems={filteredInventory} onUpdateInventory={handleUpdateInventory} />;
      case View.FINANCIALS: return <Financials transactions={filteredTransactions} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case View.INSIGHTS: return <AIInsights propertyName={activeProperty?.name || properties[0].name} />;
      case View.STAFF_PORTAL: return <StaffPortal propertyName={activeProperty?.name || properties[0].name} guests={filteredGuests} property={activeProperty || properties[0]} staffLogs={filteredLogs} onAddTransaction={handleAddTransaction} bookings={filteredBookings} transactions={filteredTransactions} stayPackages={stayPackages} onUpdatePackages={setStayPackages} />;
      default: return <Dashboard bookings={filteredBookings} transactions={filteredTransactions} guests={filteredGuests} staffLogs={filteredLogs} property={activeProperty || { name: 'Portfolio' } as any} isGlobal={activePropertyId === 'all'} />;
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl animate-bounce"><Leaf className="w-8 h-8" /></div>
        <div className="text-center space-y-1">
           <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-[10px]">HostFlow Engine</p>
           <p className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest animate-pulse">Initializing Interface...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Auth onLogin={handleLogin} />;
  
  if (properties.length === 0 && dataReadyForPush) {
    return <Onboarding onComplete={(config) => setProperties([{ ...config, id: 'prop-1' }])} defaultManager={{ name: currentUser.name, email: currentUser.email, phone: currentUser.phone }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-inter text-slate-900">
      {/* Sync Success Toast */}
      {showSyncSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4">
           <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Data Vault Synchronized</span>
           </div>
        </div>
      )}

      {/* Sync Center Modal */}
      {isSyncCenterOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><ArrowRightLeft className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sync & Deployment Center</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Manage Records & Source Code</p>
                  </div>
                </div>
                <button onClick={() => setIsSyncCenterOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X className="w-8 h-8" /></button>
             </div>
             
             <div className="flex bg-slate-100 p-2 m-10 mb-0 rounded-[1.5rem] shrink-0">
                <button onClick={() => setSyncCenterTab('data')} className={`flex-1 py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${syncCenterTab === 'data' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>
                  <Database className="w-4 h-4" /> Guest Records (Vault)
                </button>
                <button onClick={() => setSyncCenterTab('code')} className={`flex-1 py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${syncCenterTab === 'code' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>
                  <Github className="w-4 h-4" /> Website Code (GitHub)
                </button>
             </div>

             <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                {syncCenterTab === 'data' ? (
                  <div className="space-y-8 animate-in slide-in-from-left-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 border-2 border-emerald-100 bg-emerald-50/20 rounded-[2rem] space-y-4">
                         <div className="flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-widest"><CheckCircle2 className="w-4 h-4" /> Vault Connected</div>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">Cloud Data Sync</h3>
                         <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"Every change to your guests, bookings, and finances is automatically pushed to your private vault."</p>
                         <div className="pt-4 flex items-center gap-4">
                            <button onClick={handleManualSync} disabled={isSyncing} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">
                               {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Force Push Data
                            </button>
                         </div>
                      </div>
                      <div className="p-8 border-2 border-slate-100 rounded-[2rem] space-y-4">
                         <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest"><Smartphone className="w-4 h-4" /> Last Sync</div>
                         <p className="text-2xl font-black text-slate-900">{lastSyncedAt > 0 ? new Date(lastSyncedAt).toLocaleTimeString() : 'Awaiting sync'}</p>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Device Origin: <span className="text-slate-900">{lastDevice}</span></p>
                         <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest leading-relaxed mt-4">Security: AES-256 Encrypted Handshake</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-right-4">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10"><Code2 className="w-32 h-32" /></div>
                       <div className="flex items-center gap-3 text-rose-400 font-black text-[10px] uppercase tracking-widest relative z-10"><HardDrive className="w-4 h-4" /> Why won't the sync icon push to GitHub?</div>
                       <div className="space-y-4 relative z-10 max-w-lg">
                          <p className="text-base font-medium leading-relaxed text-slate-300 italic">"The Sync button only sends **Guest Records** to the database. To update the website layout or buttons on GitHub, you must push the **Source Code** using Git."</p>
                          <div className="flex items-center gap-6 pt-4">
                             <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black">1</div>
                                <span className="text-[8px] font-black uppercase mt-2">Add Files</span>
                             </div>
                             <div className="h-px bg-white/20 w-8" />
                             <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black">2</div>
                                <span className="text-[8px] font-black uppercase mt-2">Snapshot</span>
                             </div>
                             <div className="h-px bg-white/20 w-8" />
                             <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-black">3</div>
                                <span className="text-[8px] font-black uppercase mt-2">Push Code</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-2 flex items-center gap-2"><Terminal className="w-3 h-3" /> Execute in Terminal</h3>
                      <div className="bg-slate-950 p-8 rounded-[2rem] text-emerald-400 font-mono text-xs space-y-4 shadow-inner relative group border border-white/10">
                        <button onClick={() => {
                          navigator.clipboard.writeText('git add .\ngit commit -m "Update website features"\ngit push origin main');
                          alert("Commands copied to clipboard!");
                        }} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-all opacity-0 group-hover:opacity-100">
                           <Save className="w-4 h-4" />
                        </button>
                        <p className="opacity-50"># Step-by-step Push Procedure</p>
                        <p className="text-white">git add .</p>
                        <p className="text-white">git commit -m "Update HostFlow features"</p>
                        <p className="text-white">git push origin main</p>
                        <div className="pt-4 border-t border-white/5">
                           <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Requires: Git installed & Repository Link</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <Info className="w-5 h-5 text-indigo-500" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HostFlow Unified Management Console v1.0</p>
                </div>
                <button onClick={() => setIsSyncCenterOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">Close Center</button>
             </div>
          </div>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-50 transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-50"><Leaf className="w-6 h-6" /></div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none block">HostFlow</span>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 block">Sophisticated Hospitality</span>
            </div>
          </div>
          <div className="mb-6 px-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Property Context</label>
            <div className="space-y-1">
              <button onClick={() => setActivePropertyId('all')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${activePropertyId === 'all' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' : 'bg-white border-slate-50 text-slate-500 hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3"><Layers className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-tight">Portfolio</span></div>
              </button>
              {properties.map(p => (
                <button key={p.id} onClick={() => setActivePropertyId(p.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border relative group ${activePropertyId === p.id ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-50 text-slate-500 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3 truncate"><Home className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-tight truncate">{p.name}</span></div>
                </button>
              ))}
              <button onClick={() => setIsAddPropertyModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all"><PlusCircle className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-tight">New Unit</span></button>
            </div>
          </div>
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentView === View.DASHBOARD} onClick={() => { setCurrentView(View.DASHBOARD); setIsSidebarOpen(false); }} />
            <SidebarItem icon={ClipboardCheck} label="Reception Desk" active={currentView === View.COUNTER} disabled={activePropertyId === 'all'} onClick={() => { setCurrentView(View.COUNTER); setIsSidebarOpen(false); }} />
            <SidebarItem icon={CalendarDays} label="Bookings" active={currentView === View.BOOKINGS} onClick={() => { setCurrentView(View.BOOKINGS); setIsSidebarOpen(false); }} />
            <SidebarItem icon={Users} label="Guests CRM" active={currentView === View.GUESTS} onClick={() => { setCurrentView(View.GUESTS); setIsSidebarOpen(false); }} />
            <SidebarItem icon={Package} label="Stock Control" active={currentView === View.INVENTORY} disabled={activePropertyId === 'all'} onClick={() => { setCurrentView(View.INVENTORY); setIsSidebarOpen(false); }} />
            <SidebarItem icon={Wallet} label="Financials" active={currentView === View.FINANCIALS} onClick={() => { setCurrentView(View.FINANCIALS); setIsSidebarOpen(false); }} />
            <SidebarItem icon={Sparkles} label="AI Strategy" active={currentView === View.INSIGHTS} disabled={activePropertyId === 'all'} onClick={() => { setCurrentView(View.INSIGHTS); setIsSidebarOpen(false); }} />
            <div className="pt-4 mt-4 border-t border-slate-100"><SidebarItem icon={Briefcase} label="Staff Portal" active={currentView === View.STAFF_PORTAL} disabled={activePropertyId === 'all'} onClick={() => { setCurrentView(View.STAFF_PORTAL); setIsSidebarOpen(false); }} /></div>
          </nav>
          <div className="mt-auto pt-6 border-t border-slate-100 space-y-2">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-all"><LogOut className="w-5 h-5" /><span className="font-bold text-sm">Sign Out</span></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-0 overflow-auto bg-[#fdfdfe]">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
            <div className="hidden sm:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 w-80 shadow-sm focus-within:ring-2 focus-within:ring-emerald-100 transition-all"><Search className="w-4 h-4 text-slate-400 mr-2" /><input type="text" placeholder="Filter property records..." className="bg-transparent text-sm text-slate-900 outline-none w-full font-medium" /></div>
          </div>
          <div className="flex items-center gap-4">
            {/* Visual Status Console Button */}
            <button 
              onClick={() => setIsSyncCenterOpen(true)}
              className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 transition-all group"
            >
               <div className="flex flex-col items-end leading-none">
                  <div className="flex items-center gap-1.5 mb-1">
                     <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                     <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Data</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GitHub</span>
                  </div>
               </div>
               <div className="w-px h-6 bg-slate-100" />
               <RefreshCw className={`w-4 h-4 ${isSyncing ? 'text-amber-500 animate-spin' : 'text-slate-300 group-hover:text-emerald-500 group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
        </header>
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">{renderView()}</div>
      </main>
      {isAddPropertyModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"><div className="p-10 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white"><Plus className="w-6 h-6" /></div><h2 className="text-2xl font-black tracking-tight">New Property</h2></div><button onClick={() => setIsAddPropertyModalOpen(false)} className="text-slate-400"><X className="w-8 h-8" /></button></div><div className="p-10"><Onboarding isModal onComplete={(config) => handleAddProperty({ ...config, id: `prop-${Date.now()}` })} /></div></div>
        </div>
      )}
    </div>
  );
};

export default App;
