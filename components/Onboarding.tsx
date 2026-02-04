
import React, { useState } from 'react';
import { PropertyConfig } from '../types';
import { TreePine, User, Home, Sparkles, ArrowRight, Loader2, Mail, Phone } from 'lucide-react';

interface OnboardingProps {
  onComplete: (config: PropertyConfig) => void;
  isModal?: boolean;
  defaultManager?: { name: string; email: string; phone: string };
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isModal = false, defaultManager }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    managerName: defaultManager?.name || '',
    email: defaultManager?.email || '',
    phone: defaultManager?.phone || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const config: PropertyConfig = {
      id: `prop-${Date.now()}`,
      name: formData.name,
      managerName: formData.managerName,
      managerEmail: formData.email,
      managerPhone: formData.phone,
      airbnbUrl: '',
      isConfigured: true
    };

    if (!isModal) await new Promise(resolve => setTimeout(resolve, 1500));
    onComplete(config);
    setLoading(false);
  };

  const isFormValid = formData.name && formData.managerName;

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Home className="w-3 h-3 text-emerald-600" />
            Which property are you managing today?
          </label>
          <input 
            required
            autoFocus
            type="text" 
            placeholder="e.g. Wood Heaven Farms - Cottage A"
            className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-2 focus:ring-emerald-500 font-black text-slate-900 transition-all text-xl"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-4 mt-2 italic">
            This name will be used to initialize your property dashboard and local records.
          </p>
        </div>

        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <User className="w-3 h-3 text-indigo-500" />
             Verified Manager Identity
           </p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Name</p>
                <p className="font-black text-slate-700 truncate text-xs">{formData.managerName}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Contact</p>
                <p className="font-black text-slate-700 truncate text-xs">{formData.phone}</p>
              </div>
           </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading || !isFormValid}
        className="w-full py-6 bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-100 active:scale-[0.98] mt-6"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Creating Dashboard...
          </>
        ) : (
          <>
            {isModal ? "Create Account" : "Open Dashboard"}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );

  if (isModal) return content;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10 animate-in fade-in duration-700">
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-emerald-200">
            <TreePine className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2">Welcome Manager</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">One step to initialize portal</p>
        </div>

        <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="w-16 h-16 text-emerald-600" />
          </div>
          {content}

          <div className="mt-10 pt-8 border-t border-slate-100">
            <div className="flex items-start gap-5">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Portal Features Active</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-medium italic">Your property context will enable AI Pricing Insights, Reception Desk, and Financial Ledger specialized for your farm.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
