
import React, { useState, useMemo, useRef } from 'react';
import { Booking, BookingStatus, Guest, Transaction, TransactionType, StayPackage } from '../types';
import { 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Car, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Home,
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
  Plus,
  Trash2,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Package,
  Star,
  X,
  Sparkles,
  Banknote,
  Loader2,
  Zap
} from 'lucide-react';

interface GroupGuest {
  id: string;
  name: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  idFileName: string | null;
  idFileData: string | null;
  isPrimary: boolean;
}

interface CheckInCounterProps {
  onCheckInComplete: (b: Booking, t: Transaction, guests: Guest[]) => void;
  propertyName: string;
  stayPackages: StayPackage[];
}

const CheckInCounter: React.FC<CheckInCounterProps> = ({ onCheckInComplete, propertyName, stayPackages }) => {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeGuestIndex, setActiveGuestIndex] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [guests, setGuests] = useState<GroupGuest[]>([
    {
      id: `g-${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      idType: 'Aadhar Card',
      idNumber: '',
      idFileName: null,
      idFileData: null,
      isPrimary: true
    }
  ]);

  const [stayDetails, setStayDetails] = useState({
    checkInDate: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    packageType: stayPackages[0]?.title || 'Standard Stay',
    checkOut: '',
    amount: '',
    agreeRules: false
  });

  const getPackageIcon = (type: string) => {
    switch(type) {
      case 'star': return <Star className="w-6 h-6" />;
      case 'sparkles': return <Sparkles className="w-6 h-6" />;
      case 'zap': return <Zap className="w-6 h-6" />;
      default: return <Home className="w-6 h-6" />;
    }
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress to 60% quality JPEG
      };
    });
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const optimizedBase64 = await compressImage(rawBase64);
        updateGuest(index, { 
          idFileName: file.name,
          idFileData: optimizedBase64
        });
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const addGuest = () => {
    if (guests.length >= 25) return;
    const newGuest: GroupGuest = {
      id: `g-${Date.now()}-${guests.length}`,
      name: '', phone: '', email: '', idType: 'Aadhar Card', idNumber: '', idFileName: null, idFileData: null, isPrimary: false
    };
    setGuests([...guests, newGuest]);
    setActiveGuestIndex(guests.length);
  };

  const removeGuest = (index: number) => {
    if (guests[index].isPrimary) return;
    const newList = [...guests];
    newList.splice(index, 1);
    setGuests(newList);
    setActiveGuestIndex(0);
  };

  const updateGuest = (index: number, fields: Partial<GroupGuest>) => {
    const newList = [...guests];
    newList[index] = { ...newList[index], ...fields };
    setGuests(newList);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadedCount = guests.filter(g => g.idFileData).length;
  
  const isAllIdCaptured = useMemo(() => {
    return guests.every((g, idx) => {
      if (idx === 0) {
        return g.name && g.phone && g.idNumber && g.idFileData && stayDetails.checkInDate;
      }
      return g.name && g.idFileData;
    });
  }, [guests, stayDetails.checkInDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const primary = guests.find(g => g.isPrimary)!;
    const bookingId = `book-${Date.now()}`;
    const primaryGuestId = `pid-${Date.now()}`;
    
    const crmGuests: Guest[] = guests.map((g, idx) => ({
      id: g.isPrimary ? primaryGuestId : `gid-${Date.now()}-${idx}`,
      propertyId: '', 
      name: g.name,
      email: g.email || '',
      phone: g.phone || '',
      rating: 5,
      totalStays: 1,
      lastStay: stayDetails.checkInDate,
      notes: g.isPrimary ? `Primary for group of ${guests.length}. ${stayDetails.packageType}` : `Part of ${primary.name}'s group. ID Verified: ${g.idFileName}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.id}`,
      idType: g.idType,
      idNumber: g.idNumber,
      vehicleNumber: g.isPrimary ? stayDetails.vehicleNumber : undefined,
      idFileName: g.idFileName || undefined,
      idFileData: g.idFileData || undefined
    }));

    const newBooking: Booking = {
      id: bookingId,
      propertyId: '', 
      guestId: primaryGuestId,
      guestName: primary.name,
      checkIn: stayDetails.checkInDate,
      checkOut: stayDetails.checkOut,
      status: BookingStatus.CHECKED_IN,
      totalPrice: Number(stayDetails.amount),
      guestsCount: guests.length,
      source: 'Direct',
      cottageName: stayDetails.packageType
    };

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      propertyId: '', 
      date: stayDetails.checkInDate,
      type: TransactionType.INCOME,
      category: 'Booking',
      amount: Number(stayDetails.amount),
      description: `Package: ${stayDetails.packageType} for ${primary.name}`
    };

    onCheckInComplete(newBooking, newTransaction, crmGuests);
    setIsSuccess(true);
  };

  const resetCounter = () => {
    setStep(1); setIsSuccess(false);
    setGuests([{ id: `g-${Date.now()}`, name: '', phone: '', email: '', idType: 'Aadhar Card', idNumber: '', idFileName: null, idFileData: null, isPrimary: true }]);
    setStayDetails({ checkInDate: new Date().toISOString().split('T')[0], vehicleNumber: '', packageType: stayPackages[0]?.title || 'Standard Stay', checkOut: '', amount: '', agreeRules: false });
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircle2 className="w-12 h-12" /></div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Check-in Complete!</h1>
        <p className="text-xl text-slate-500 mb-12 font-medium italic">Group registry pushed to Cloud CRM.</p>
        <button onClick={resetCounter} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95">New Group Entry</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Reception Desk</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">{propertyName} • Digital Entry</p>
          </div>
        </div>
        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Sync Readiness</p>
            <p className="text-lg font-black text-slate-900 leading-none">{uploadedCount} <span className="text-slate-300 font-medium">/</span> {guests.length} IDs</p>
          </div>
          <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-emerald-500 transition-all duration-700" 
               style={{ width: `${(uploadedCount / guests.length) * 100}%` }}
             />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {['Registry Data', 'Package Selection', 'Final Agreement'].map((label, idx) => (
            <div key={idx} className={`flex-1 p-6 text-center font-black text-[10px] uppercase tracking-widest border-r border-slate-100 transition-colors last:border-0 ${step === idx + 1 ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>Phase {idx + 1}: {label}</div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 flex-1">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
                 <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-emerald-400" /><h3 className="text-xs font-black text-white uppercase tracking-widest">Entry Date Control</h3></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required type="date" className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl font-black outline-none focus:ring-2 focus:ring-emerald-500 text-white" value={stayDetails.checkInDate} onChange={e => setStayDetails({...stayDetails, checkInDate: e.target.value})} />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center">This will be the permanent registry date for all group members in the CRM.</p>
                 </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                {guests.map((guest, idx) => (
                  <div key={guest.id} className={`border-2 rounded-3xl transition-all ${activeGuestIndex === idx ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100 bg-white'}`}>
                    <button type="button" onClick={() => setActiveGuestIndex(idx)} className="w-full p-6 flex items-center justify-between text-left">
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${guest.idFileData ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                          {guest.idFileData ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                        </div>
                        <p className={`font-black uppercase tracking-tight truncate ${guest.name ? 'text-slate-900' : 'text-slate-400'}`}>{guest.name || (guest.isPrimary ? "Primary Applicant" : `Group Member #${idx + 1}`)}</p>
                      </div>
                      <div className="flex gap-4">
                        {!guest.isPrimary && <button type="button" onClick={(e) => { e.stopPropagation(); removeGuest(idx); }} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-5 h-5" /></button>}
                        {activeGuestIndex === idx ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                      </div>
                    </button>

                    {activeGuestIndex === idx && (
                      <div className="px-6 pb-8 pt-2 border-t border-indigo-100/30 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className={`space-y-2 ${idx > 0 ? 'md:col-span-2' : ''}`}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Guest Legal Identity</label>
                            <input required type="text" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold uppercase text-xs" placeholder="FULL NAME AS PER ID" value={guest.name} onChange={e => updateGuest(idx, { name: e.target.value })} />
                          </div>
                          {idx === 0 && (
                            <>
                              <input required type="tel" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold" placeholder="PRIMARY PHONE" value={guest.phone} onChange={e => updateGuest(idx, { phone: e.target.value })} />
                              <input required type="email" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold" placeholder="PRIMARY EMAIL" value={guest.email} onChange={e => updateGuest(idx, { email: e.target.value })} />
                              <select className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-black uppercase text-[10px]" value={guest.idType} onChange={e => updateGuest(idx, { idType: e.target.value })}><option>Aadhar Card</option><option>Passport</option><option>Driving License</option></select>
                              <input required type="text" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-black uppercase text-xs" placeholder="ID REFERENCE NUMBER" value={guest.idNumber} onChange={e => updateGuest(idx, { idNumber: e.target.value })} />
                            </>
                          )}
                        </div>
                        <div className="relative">
                          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(idx, e)} />
                          <button type="button" onClick={triggerFileInput} disabled={isCompressing} className={`w-full py-10 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center gap-4 ${guest.idFileData ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-white'}`}>
                             {isCompressing ? (
                               <><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /><p className="font-black text-[10px] uppercase tracking-widest">Optimizing for Sync...</p></>
                             ) : guest.idFileData ? (
                               <><FileText className="w-10 h-10 text-emerald-600 mb-2" /><div className="text-center"><p className="font-black text-xs uppercase tracking-widest">ID VERIFIED & COMPRESSED</p><p className="text-[9px] font-bold opacity-60 mt-1">Ready for Cloud Sync</p></div></>
                             ) : (
                               <><Upload className="w-10 h-10 text-slate-300" /><p className="font-black text-[10px] uppercase tracking-[3px]">CAPTURE PHOTO ID</p><span className="text-[9px] font-medium italic opacity-50">High-res images will be downscaled for device sync speed.</span></>
                             )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addGuest} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest"><Plus className="w-4 h-4" /> Add Another Member</button>
              </div>

              <button type="button" disabled={!isAllIdCaptured || isCompressing} onClick={() => setStep(2)} className="w-full py-6 bg-indigo-600 disabled:opacity-50 text-white rounded-[2rem] font-black text-xs uppercase tracking-[4px] hover:bg-indigo-700 shadow-xl active:scale-[0.98] flex items-center justify-center gap-4">Proceed to Stay Packages <ArrowRight className="w-6 h-6" /></button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {stayPackages.map((opt) => (
                   <button key={opt.id} type="button" onClick={() => setStayDetails({...stayDetails, packageType: opt.title})} className={`p-6 rounded-[2.5rem] border-2 text-left transition-all flex flex-col ${stayDetails.packageType === opt.title ? 'border-indigo-500 bg-indigo-50/20 shadow-lg' : 'border-slate-100 hover:border-indigo-200'}`}>
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${stayDetails.packageType === opt.title ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{getPackageIcon(opt.iconType)}</div>
                     <h4 className="font-black text-slate-900 text-sm leading-tight mb-2 uppercase tracking-tight">{opt.title}</h4>
                     <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4 flex-1">{opt.desc}</p>
                     {stayDetails.packageType === opt.title && <div className="flex justify-end"><CheckCircle2 className="w-6 h-6 text-indigo-600" /></div>}
                   </button>
                 ))}
                 {stayPackages.length === 0 && (
                   <div className="col-span-3 py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 italic font-medium">Please configure stay packages in the Staff Portal.</div>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Agreed Revenue (₹)</label>
                  <input required type="number" placeholder="0.00" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-lg text-emerald-600" value={stayDetails.amount} onChange={e => setStayDetails({...stayDetails, amount: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Vehicle ID</label>
                  <input type="text" placeholder="DL 00 XX 0000" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-lg uppercase" value={stayDetails.vehicleNumber} onChange={e => setStayDetails({...stayDetails, vehicleNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Check-out Target</label>
                   <input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-lg" value={stayDetails.checkOut} onChange={e => setStayDetails({...stayDetails, checkOut: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[4px] active:scale-95">Back to IDs</button>
                <button type="button" disabled={!stayDetails.checkOut || !stayDetails.amount} onClick={() => setStep(3)} className="flex-2 w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[4px] hover:bg-indigo-700 shadow-xl flex items-center justify-center gap-4 disabled:opacity-50">Proceed to Summary <ArrowRight className="w-6 h-6" /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-32 h-32" /></div>
                <div className="flex items-center gap-4 relative z-10"><ShieldCheck className="w-10 h-10 text-emerald-400" /><h3 className="text-2xl font-black uppercase tracking-tight">Cloud Registry Consent</h3></div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] relative z-10">
                  <label className="flex items-center gap-8 cursor-pointer group">
                    <input type="checkbox" className="w-10 h-10 rounded-2xl bg-white/10 border-white/20 text-emerald-500 focus:ring-0" checked={stayDetails.agreeRules} onChange={e => setStayDetails({...stayDetails, agreeRules: e.target.checked})} />
                    <div className="flex-1">
                       <span className="font-black text-xl block uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">Sign Group Registry</span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">I verify that the entry date ({stayDetails.checkInDate}) and all Guest IDs are verified and ready for cloud backup.</span>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-[4px] active:scale-95">Back</button>
                <button type="submit" disabled={!stayDetails.agreeRules} className="flex-2 w-full py-6 bg-emerald-600 disabled:opacity-50 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[5px] hover:bg-emerald-700 shadow-xl flex items-center justify-center gap-4 active:scale-[0.98]">Complete Sync <CheckCircle2 className="w-6 h-6" /></button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CheckInCounter;
