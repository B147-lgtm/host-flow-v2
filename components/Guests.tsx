
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Guest, Transaction } from '../types';
import { 
  Star, 
  Mail, 
  Phone, 
  MessageCircle, 
  Send, 
  Utensils, 
  ReceiptText, 
  Trash2, 
  AlertTriangle, 
  UserPlus, 
  Users, 
  FileCheck, 
  Eye, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  X, 
  Upload, 
  FileText, 
  CreditCard,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { generateGuestMessage } from '../services/geminiService';

interface GuestsProps {
  guests: Guest[];
  transactions: Transaction[];
  propertyName: string;
  onDeleteGuest: (id: string) => void;
  onAddGuest: (guest: Guest) => void;
}

const Guests: React.FC<GuestsProps> = ({ guests, transactions, propertyName, onDeleteGuest, onAddGuest }) => {
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(guests.length > 0 ? guests[0] : null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewDossier, setViewDossier] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  const [newGuestData, setNewGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    rating: '5',
    idType: 'Aadhar Card',
    idNumber: '',
    idFileName: '',
    idFileData: '',
    notes: ''
  });

  useEffect(() => {
    if (selectedGuest && !guests.find(g => g.id === selectedGuest.id)) {
      setSelectedGuest(guests.length > 0 ? guests[0] : null);
    } else if (!selectedGuest && guests.length > 0) {
      setSelectedGuest(guests[0]);
    }
  }, [guests]);

  const guestServices = useMemo(() => {
    if (!selectedGuest) return [];
    return transactions.filter(t => t.category === 'Additional Service' && t.referenceId === selectedGuest.id);
  }, [selectedGuest, transactions]);

  const totalExtraCharges = guestServices.reduce((sum, s) => sum + s.amount, 0);

  const handleGenerateMessage = async (type: 'CHECK_IN' | 'CHECK_OUT' | 'HOUSE_RULES') => {
    if (!selectedGuest) return;
    setIsGenerating(true);
    const msg = await generateGuestMessage(selectedGuest.name, type, propertyName);
    setAiMessage(msg);
    setIsGenerating(false);
  };

  const handleDelete = () => {
    if (!selectedGuest) return;
    onDeleteGuest(selectedGuest.id);
    setShowDeleteConfirm(false);
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewGuestData(prev => ({ 
          ...prev, 
          idFileName: file.name,
          idFileData: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guestId = `g-direct-${Date.now()}`;
    const newGuest: Guest = {
      id: guestId,
      propertyId: '', 
      name: newGuestData.name,
      email: newGuestData.email,
      phone: newGuestData.phone,
      rating: Number(newGuestData.rating),
      totalStays: 0,
      lastStay: new Date().toISOString().split('T')[0],
      notes: newGuestData.notes || 'Manually added to CRM registry.',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newGuestData.name}`,
      idType: newGuestData.idType,
      idNumber: newGuestData.idNumber,
      idFileName: newGuestData.idFileName,
      idFileData: newGuestData.idFileData,
      hasConsented: true
    };

    onAddGuest(newGuest);
    setIsAddModalOpen(false);
    setNewGuestData({
      name: '', email: '', phone: '', rating: '5', idType: 'Aadhar Card', idNumber: '', idFileName: '', idFileData: '', notes: ''
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <UserPlus className="w-16 h-16 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-white font-black uppercase text-[10px] tracking-[3px] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Direct Registry
            </h2>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-emerald-900/20"
            >
              <UserPlus className="w-4 h-4" />
              Add New Guest to CRM
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] ml-2">Guest History</h2>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {guests.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
                <Users className="w-12 h-12 text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database Empty</p>
              </div>
            ) : (
              guests.map((guest) => (
                <div key={guest.id} onClick={() => { setSelectedGuest(guest); setAiMessage(null); setViewDossier(false); }} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedGuest?.id === guest.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100 shadow-lg' : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'}`}>
                  <div className="flex items-center gap-4">
                    <img src={guest.avatar} alt={guest.name} className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200" />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-slate-900 truncate uppercase tracking-tight text-xs">{guest.name}</h3>
                        <div className="flex items-center gap-1 text-amber-500"><Star className="w-2.5 h-2.5 fill-current" /><span className="text-[10px] font-black">{guest.rating}</span></div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 truncate">{guest.totalStays} Stays • {guest.lastStay}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6 pb-12">
        {selectedGuest ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <img src={selectedGuest.avatar} alt={selectedGuest.name} className="w-32 h-32 rounded-3xl object-cover shadow-lg border-4 border-slate-50 bg-slate-50" />
              <div className="flex-1 space-y-4 w-full">
                <div className="flex justify-between items-start">
                  <div><h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{selectedGuest.name}</h1><p className="text-indigo-600 font-black text-[10px] tracking-widest uppercase mt-1">Registry Profile</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewDossier(!viewDossier)} className={`p-3 rounded-xl transition-all ${viewDossier ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`} title="View Dossier"><FileCheck className="w-5 h-5" /></button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-3 text-slate-300 hover:text-rose-500 bg-rose-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm"><Mail className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold truncate">{selectedGuest.email || 'N/A'}</span></div>
                  <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm"><Phone className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold truncate">{selectedGuest.phone || 'N/A'}</span></div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Staff Notes</h4><p className="text-slate-700 italic text-sm font-medium">"{selectedGuest.notes}"</p></div>
              </div>
            </div>

            {viewDossier && (
              <div className="mt-8 animate-in slide-in-from-top-4 duration-500 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4"><ShieldCheck className="w-10 h-10 text-emerald-400" /><div><h3 className="text-xl font-black uppercase tracking-tight">Compliance Dossier</h3><p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Verified digital identity archive</p></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Identity Document Visual
                      </p>
                      <div className="aspect-video bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center overflow-hidden relative group">
                         {selectedGuest.idFileData ? (
                           <>
                             <img src={selectedGuest.idFileData} alt="ID Document" className="w-full h-full object-contain" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                               <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white">
                                  <Maximize2 className="w-6 h-6" />
                               </button>
                             </div>
                           </>
                         ) : (
                           <div className="text-center p-6 opacity-30">
                             <ImageIcon className="w-12 h-12 mx-auto mb-3" />
                             <p className="text-xs font-bold uppercase tracking-widest italic">No image data on file</p>
                           </div>
                         )}
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</span>
                          <span className="text-xs font-black uppercase">{selectedGuest.idType}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verified No.</span>
                          <span className="text-xs font-black uppercase text-emerald-400">{selectedGuest.idNumber || 'AWAITING INPUT'}</span>
                        </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Registration Audit</p>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                         <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Vault Protected</span></div>
                         <p className="text-[10px] text-slate-300 font-medium italic leading-relaxed">"HostFlow Secure Ledger: Identity and documentation was verified by manager on {selectedGuest.lastStay}."</p>
                         <div className="pt-4 mt-4 border-t border-white/5">
                           <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Reference Filename</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight truncate">{selectedGuest.idFileName || 'N/A'}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div className="mt-12 bg-emerald-50/30 border border-emerald-100 p-8 rounded-[2.5rem]">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3"><div className="p-2 bg-emerald-600 rounded-xl"><ReceiptText className="w-5 h-5 text-white" /></div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Financial Ledger</h3></div>
                 <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</p><span className="text-2xl font-black text-emerald-600 tracking-tighter">₹{totalExtraCharges.toLocaleString('en-IN')}</span></div>
               </div>
               {guestServices.length > 0 ? (
                 <div className="space-y-3">
                   {guestServices.map(service => (
                     <div key={service.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100/50 shadow-sm">
                        <div className="flex items-center gap-4"><div className="p-3 bg-emerald-50 rounded-xl"><Utensils className="w-5 h-5 text-emerald-500" /></div><div><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{service.description}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{service.date}</p></div></div>
                        <p className="font-black text-slate-900 text-lg tracking-tighter">₹{service.amount.toLocaleString('en-IN')}</p>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="py-12 px-6 bg-white/50 border-2 border-dashed border-emerald-100 rounded-[2rem] text-center"><p className="text-[10px] text-slate-300 uppercase tracking-widest font-black">No services logged</p></div>
               )}
            </div>

            <div className="mt-12 border-t border-slate-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight"><MessageCircle className="w-5 h-5 text-indigo-500" /> AI Response Agent</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleGenerateMessage('CHECK_IN')} className="px-4 py-2 bg-slate-100 hover:bg-indigo-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Check-in</button>
                  <button onClick={() => handleGenerateMessage('CHECK_OUT')} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Checkout</button>
                </div>
              </div>
              <div className="relative">
                {isGenerating ? (
                  <div className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drafting...</p>
                  </div>
                ) : aiMessage ? (
                  <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 text-sm font-medium whitespace-pre-wrap leading-relaxed shadow-inner">
                      {aiMessage}
                    </div>
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                      <Send className="w-4 h-4" /> Copy & Send Draft
                    </button>
                  </div>
                ) : (
                  <div className="h-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">Initialize agent for {selectedGuest.name}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center shadow-inner">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Select a profile</h3>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Quick Registry Entry</h2>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Guest Full Legal Name</label>
                  <input required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={newGuestData.name} onChange={e => setNewGuestData({...newGuestData, name: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Verified Email</label>
                  <input required type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={newGuestData.email} onChange={e => setNewGuestData({...newGuestData, email: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
                  <input required type="tel" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={newGuestData.phone} onChange={e => setNewGuestData({...newGuestData, phone: e.target.value})} />
                </div>

                <div className="md:col-span-2 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-indigo-600" /> Identity Document Upload
                   </p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Classification</label>
                        <select className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase" value={newGuestData.idType} onChange={e => setNewGuestData({...newGuestData, idType: e.target.value})}>
                          <option>Aadhar Card</option><option>Passport</option><option>Driving License</option><option>Voter ID</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique ID Number</label>
                        <input type="text" className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase" value={newGuestData.idNumber} onChange={e => setNewGuestData({...newGuestData, idNumber: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Image (Mandatory for CRM Showcase)</label>
                      <input ref={idFileInputRef} type="file" className="hidden" accept="image/*" onChange={handleIdUpload} />
                      <button type="button" onClick={() => idFileInputRef.current?.click()} className={`w-full py-6 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all ${newGuestData.idFileData ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-400'}`}>
                         {newGuestData.idFileData ? <><FileCheck className="w-6 h-6 text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest">{newGuestData.idFileName}</span></> : <><Upload className="w-6 h-6" /><span className="text-[10px] font-black uppercase tracking-widest">Click to upload ID photo</span></>}
                      </button>
                   </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Registry Notes</label>
                  <textarea className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold min-h-[100px]" value={newGuestData.notes} onChange={e => setNewGuestData({...newGuestData, notes: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[3px] shadow-2xl transition-all active:scale-[0.98]">
                Finalize Registry Enrollment
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-8 animate-in fade-in">
          <div className="bg-white p-10 rounded-[3rem] max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div><h3 className="text-xl font-black uppercase tracking-tight">Erase Profile?</h3></div>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700">Confirm Erase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guests;
