
import React, { useState, useRef, useMemo } from 'react';
import { StaffLog, Transaction, TransactionType, ExpenseCategory, Guest, PropertyConfig, Booking } from '../types';
import { 
  ShieldCheck, 
  ClipboardList, 
  Plus, 
  Trash2,
  Utensils,
  ShoppingBag,
  User,
  Users,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Truck,
  Zap,
  Coffee,
  Upload,
  FileText,
  X,
  FileSpreadsheet,
  Download,
  Printer,
  TableProperties,
  KeyRound,
  RefreshCw,
  Copy,
  LayoutGrid,
  Database,
  FileDown,
  CloudUpload,
  Link as LinkIcon,
  QrCode,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SettingsProps {
  propertyName: string;
  guests: Guest[];
  property: PropertyConfig;
  staffLogs: StaffLog[];
  onAddTransaction: (t: Transaction) => void;
  bookings: Booking[];
  transactions: Transaction[];
  onImportSync: (data: any) => void;
  allData: any;
}

const Settings: React.FC<SettingsProps> = ({ propertyName, guests, property, staffLogs, onAddTransaction, bookings, transactions, onImportSync, allData }) => {
  const [activeTab, setActiveTab] = useState<'services' | 'expenses' | 'sync'>('services');
  const [successMsg, setSuccessMsg] = useState('');
  const [syncKeyInput, setSyncKeyInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceForm, setServiceForm] = useState({ guestId: '', name: '', amount: '', type: 'Food & Beverage' });
  const [expenseForm, setExpenseForm] = useState({ item: '', amount: '', category: ExpenseCategory.CLEANING, receiptFileName: '' });

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction: Transaction = {
      id: `svc-${Date.now()}`,
      propertyId: property.id,
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.INCOME,
      category: 'Additional Service',
      amount: Number(serviceForm.amount),
      description: `${serviceForm.name} (${serviceForm.type})`,
      referenceId: serviceForm.guestId,
      staffName: 'Staff'
    };
    onAddTransaction(transaction);
    setSuccessMsg('Service charge filed successfully!');
    setServiceForm({ guestId: '', name: '', amount: '', type: 'Food & Beverage' });
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction: Transaction = {
      id: `exp-${Date.now()}`,
      propertyId: property.id,
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.EXPENSE,
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      description: `Procurement: ${expenseForm.item}`,
      staffName: 'Staff',
      receiptFileName: expenseForm.receiptFileName
    };
    onAddTransaction(transaction);
    setSuccessMsg('Procurement expense recorded!');
    setExpenseForm({ item: '', amount: '', category: ExpenseCategory.CLEANING, receiptFileName: '' });
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const syncPayload = useMemo(() => btoa(JSON.stringify(allData)), [allData]);
  const magicLink = useMemo(() => `${window.location.origin}${window.location.pathname}#${syncPayload}`, [syncPayload]);
  const qrCodeUrl = useMemo(() => `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(magicLink)}`, [magicLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(magicLink);
    setSuccessMsg('Magic Cloud Link Copied!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleExportKey = () => {
    navigator.clipboard.writeText(syncPayload);
    setSuccessMsg('Sync Key Copied!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDownloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `woodheaven_ledger_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setSuccessMsg('Desktop Backup File Generated!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        onImportSync(data);
      } catch (err) {
        alert("Invalid backup file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportKey = () => {
    try {
      const decoded = JSON.parse(atob(syncKeyInput));
      onImportSync(decoded);
      setSyncKeyInput('');
    } catch (e) {
      alert("Invalid Sync Key format.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight uppercase">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Operations Hub
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-widest">{propertyName} • PERMANENT LEDGER SYNC</p>
        </div>
      </div>

      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm gap-2">
        <button onClick={() => setActiveTab('services')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'services' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
          <Zap className="w-4 h-4" /> Service Log
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'expenses' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
          <ShoppingBag className="w-4 h-4" /> Expenses
        </button>
        <button onClick={() => setActiveTab('sync')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'sync' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
          <Database className="w-4 h-4" /> Vault Sync
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]">
            {activeTab === 'services' && (
              <div className="animate-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Utensils className="w-6 h-6" /></div>
                  <div><h2 className="text-xl font-black uppercase tracking-tight">Direct Billing</h2><p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Post additional service charges</p></div>
                </div>
                {successMsg && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><CheckCircle2 className="w-4 h-4" /> {successMsg}</div>}
                <form onSubmit={handleServiceSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Guest</label>
                      <select required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={serviceForm.guestId} onChange={e => setServiceForm({...serviceForm, guestId: e.target.value})}>
                        <option value="">Active Guests List</option>
                        {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Amount (₹)</label>
                      <input required type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg text-emerald-600 outline-none" value={serviceForm.amount} onChange={e => setServiceForm({...serviceForm, amount: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description</label>
                    <input required type="text" placeholder="e.g. Extra Bedding or Laundry" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98]">Post to Billing Ledger</button>
                </form>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500"><ShoppingBag className="w-6 h-6" /></div>
                  <div><h2 className="text-xl font-black uppercase tracking-tight">Record Expense</h2><p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Procurement & maintenance</p></div>
                </div>
                {successMsg && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><CheckCircle2 className="w-4 h-4" /> {successMsg}</div>}
                <form onSubmit={handleExpenseSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Classification</label>
                      <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})}>
                        <option value={ExpenseCategory.RESTOCK}>Inventory Restock</option><option value={ExpenseCategory.MAINTENANCE}>Maintenance</option><option value={ExpenseCategory.UTILITIES}>Utilities</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Total Amount (₹)</label>
                      <input required type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg text-rose-600 outline-none" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vendor Details / Items</label>
                    <textarea required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none min-h-[100px]" value={expenseForm.item} onChange={e => setExpenseForm({...expenseForm, item: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98]">Record Procurement</button>
                </form>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="animate-in fade-in duration-500 space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100"><Database className="w-6 h-6" /></div>
                  <div><h2 className="text-xl font-black uppercase tracking-tight">Vault Device Sync</h2><p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Multi-device portability console</p></div>
                </div>

                {successMsg && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center animate-bounce mb-4">{successMsg}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-8 border border-emerald-100 rounded-[2.5rem] bg-emerald-50/20 space-y-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-white rounded-3xl shadow-xl border border-emerald-100">
                          <img src={qrCodeUrl} alt="Sync QR Code" className="w-48 h-48" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Instant Mobile Sync</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-relaxed">Scan with your phone camera to instantly <br/> move all property data to mobile.</p>
                        </div>
                        <button onClick={handleCopyLink} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
                          <LinkIcon className="w-4 h-4" /> Copy Magic Cloud Link
                        </button>
                      </div>
                   </div>

                   <div className="p-8 border border-indigo-100 rounded-[2.5rem] bg-indigo-50/20 space-y-6 flex flex-col">
                      <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Manual Sync Controls</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">Use these for standard backups or key-based sync.</p>
                      </div>

                      <div className="space-y-3">
                        <button onClick={handleDownloadBackup} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-indigo-200 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm">
                          <FileDown className="w-4 h-4" /> Desktop Backup (.json)
                        </button>
                        
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-indigo-200 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm">
                          <CloudUpload className="w-4 h-4" /> Restore from File
                        </button>
                      </div>

                      <div className="pt-4 mt-auto border-t border-indigo-100/50 space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Import via Sync Key</p>
                        <textarea 
                          className="w-full p-4 bg-white border border-indigo-100 rounded-xl text-[9px] font-mono h-24 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" 
                          placeholder="Paste sync key here..." 
                          value={syncKeyInput}
                          onChange={e => setSyncKeyInput(e.target.value)}
                        />
                        <button onClick={handleImportKey} disabled={!syncKeyInput} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 disabled:opacity-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                          <RefreshCw className="w-4 h-4" /> Apply Sync Key
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Database className="w-32 h-32 text-emerald-400" />
            </div>
            <h2 className="relative z-10 text-lg font-black flex items-center gap-3 uppercase tracking-tight mb-8"><LayoutGrid className="w-6 h-6 text-emerald-400" /> Session Audit</h2>
            <div className="relative z-10 space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {staffLogs.length === 0 ? (
                <div className="py-12 text-center opacity-30 italic text-xs">Waiting for new activity...</div>
              ) : (
                staffLogs.map(log => (
                  <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5"><div className="flex items-center gap-3 mb-2"><div className={`w-2 h-2 rounded-full ${log.type === 'FINANCIAL' ? 'bg-emerald-400' : 'bg-indigo-400'}`} /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.type}</span></div><p className="text-xs font-bold leading-tight">{log.action}</p><p className="text-[9px] text-slate-500 font-bold uppercase mt-2">{log.timestamp}</p></div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
