
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  ShieldCheck, 
  Loader2, 
  Lock, 
  Mail, 
  Cloud, 
  User as UserIcon, 
  ArrowRight, 
  Calendar, 
  Briefcase, 
  CheckCircle2, 
  Fingerprint,
  AlertCircle,
  FileCheck,
  Phone,
  ChevronLeft,
  Leaf,
  UserCheck
} from 'lucide-react';
import { cloudSync } from '../services/cloudService';

interface AuthProps {
  onLogin: (user: User, email: string, password: string, remoteData: any | null) => void;
}

type AuthState = 'IDENTIFY' | 'PASSWORD' | 'SIGN_UP_PERSONAL' | 'SIGN_UP_SECURITY' | 'SIGN_UP_ROLE' | 'CONFIRMING';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [state, setState] = useState<AuthState>('IDENTIFY');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Registration State
  const [regData, setRegData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    role: UserRole.AIRBNB_HOST
  });

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setIsLoading(true);
    
    // Check if account exists via discovery key
    const exists = await cloudSync.checkEmailExists(email);
    
    setTimeout(() => {
      setIsLoading(false);
      if (exists) {
        setState('PASSWORD');
      } else {
        setState('SIGN_UP_PERSONAL');
      }
    }, 800);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const remoteData = await cloudSync.pull(email, password);
      setTimeout(() => {
        setIsLoading(false);
        if (remoteData?.currentUser) {
          onLogin(remoteData.currentUser, email, password, remoteData);
        } else {
          setError("Incorrect password. Please verify your credentials.");
        }
      }, 1200);
    } catch (err) {
      setIsLoading(false);
      setError("Cloud security handshake failed. Please try again.");
    }
  };

  const startSignUp = () => {
    setError(null);
    setState('SIGN_UP_PERSONAL');
  };

  const proceedToSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setState('SIGN_UP_SECURITY');
  };

  const proceedToRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setState('SIGN_UP_ROLE');
  };

  const startConfirmation = async () => {
    setState('CONFIRMING');
    setIsLoading(true);

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: `${regData.firstName} ${regData.lastName}`,
      email: email,
      phone: regData.phone,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${regData.firstName}`,
      provider: 'email',
      isVerified: true, 
      role: regData.role,
      dob: regData.dob,
      createdAt: new Date().toISOString()
    };

    // Register email existence in the cloud first
    await cloudSync.registerEmail(email);

    // Initial data push will happen in App.tsx after onLogin
    setTimeout(() => {
      setIsLoading(false);
      onLogin(newUser, email, password, null);
    }, 2000);
  };

  const isPasswordMatch = password.length > 0 && password === confirmPassword;

  const renderContent = () => {
    switch (state) {
      case 'IDENTIFY':
        return (
          <form onSubmit={handleIdentify} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light text-slate-900 mb-2">Sign in</h2>
              <p className="text-sm text-slate-500 font-medium">Use your HostFlow account</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required
                  type="email"
                  placeholder="Email address"
                  className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-6 pt-2">
              <button 
                type="button" 
                onClick={startSignUp} 
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 text-left w-fit transition-colors"
              >
                Create new account
              </button>
              <div className="flex items-center justify-end">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-10 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 min-w-[120px] active:scale-95"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Next'}
                </button>
              </div>
            </div>
          </form>
        );

      case 'PASSWORD':
        return (
          <form onSubmit={handlePassword} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="px-4 py-2 bg-slate-50 rounded-full flex items-center gap-2 border border-slate-200">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{email}</span>
                </div>
              </div>
              <h2 className="text-3xl font-light text-slate-900">Enter Password</h2>
            </div>
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600 text-xs font-medium leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required
                  autoFocus
                  type="password"
                  placeholder="Password"
                  className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 transition-all font-medium shadow-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setState('IDENTIFY')} className="text-sm font-bold text-emerald-600">Back</button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-10 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </div>
          </form>
        );

      case 'SIGN_UP_PERSONAL':
        return (
          <form onSubmit={proceedToSecurity} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light text-slate-900">Create Account</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Personal Identity</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                  <input required type="text" placeholder="John" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 font-medium shadow-sm" value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input required type="text" placeholder="Doe" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 font-medium shadow-sm" value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> Date of Birth</label>
                <input required type="date" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 font-medium shadow-sm" value={regData.dob} onChange={e => setRegData({...regData, dob: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Phone className="w-3 h-3 text-emerald-600" /> Phone Number</label>
                <input required type="tel" placeholder="+91 XXXXX XXXXX" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 font-medium shadow-sm" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <button type="button" onClick={() => setState('IDENTIFY')} className="text-sm font-bold text-slate-400">Cancel</button>
              <button type="submit" className="px-10 py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-50 active:scale-95">Continue</button>
            </div>
          </form>
        );

      case 'SIGN_UP_SECURITY':
        return (
          <form onSubmit={proceedToRole} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light text-slate-900">Security</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Vault Credentials</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Mail className="w-3 h-3 text-emerald-600" /> Email Address</label>
                <input required type="email" placeholder="email@example.com" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 font-medium shadow-sm" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Lock className="w-3 h-3 text-emerald-600" /> Create Password</label>
                <input required type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 font-medium shadow-sm" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-emerald-600" /> Confirm Password
                  {isPasswordMatch && <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-in zoom-in" />}
                </label>
                <input required type="password" placeholder="••••••••" className={`w-full px-5 py-4 bg-white border rounded-xl text-slate-900 outline-none focus:ring-4 transition-all font-medium shadow-sm ${confirmPassword.length > 0 ? (isPasswordMatch ? 'border-emerald-500 focus:ring-emerald-50' : 'border-rose-300 focus:ring-rose-50') : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-50'}`} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              {!isPasswordMatch && confirmPassword.length > 0 && (
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Passwords must match exactly
                </p>
              )}
            </div>
            <div className="flex items-center justify-between pt-4">
              <button type="button" onClick={() => setState('SIGN_UP_PERSONAL')} className="text-sm font-bold text-slate-400">Back</button>
              <button type="submit" disabled={!isPasswordMatch} className="px-10 py-3.5 bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg shadow-emerald-50 active:scale-95 transition-all">Next</button>
            </div>
          </form>
        );

      case 'SIGN_UP_ROLE':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light text-slate-900">Final Step</h2>
              <p className="text-sm text-slate-500 mt-2">Select your hosting role</p>
            </div>
            <div className="space-y-2.5">
              {Object.values(UserRole).map(role => (
                <button 
                  key={role}
                  onClick={() => setRegData({...regData, role})}
                  className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all ${regData.role === role ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className={`w-4 h-4 ${regData.role === role ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs uppercase tracking-tight">{role}</span>
                  </div>
                  {regData.role === role && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </button>
              ))}
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button type="button" onClick={() => setState('SIGN_UP_SECURITY')} className="text-sm font-bold text-slate-400">Back</button>
              <button onClick={startConfirmation} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-900 transition-colors">Generate Account</button>
            </div>
          </div>
        );

      case 'CONFIRMING':
        return (
          <div className="py-12 text-center space-y-8 animate-in zoom-in-95">
             <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <UserCheck className="w-12 h-12 animate-bounce" />
             </div>
             <div>
                <h2 className="text-2xl font-light text-slate-900 uppercase tracking-tight">Vault Initializing</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Syncing credentials to Cloud Storage...</p>
             </div>
             <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 w-full text-left">
                  <p className="text-[10px] font-black text-emerald-800/50 uppercase tracking-widest mb-1">Authenticated Manager</p>
                  <p className="text-sm font-bold text-emerald-900">{regData.firstName} {regData.lastName}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 tracking-wider">{email}</p>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
      <div className="max-w-md w-full">
        <div className="text-center mb-10 flex flex-col items-center gap-1">
          <div className="flex items-center justify-center gap-2">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                <Leaf className="w-6 h-6" />
             </div>
             <span className="text-2xl font-bold tracking-tighter text-slate-900">HostFlow</span>
          </div>
          <p className="text-[10px] text-emerald-600/50 font-black uppercase tracking-[0.4em] mt-1">Sophisticated Hospitality</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden min-h-[600px] flex flex-col p-10 md:p-14">
          <div className="flex-1 flex flex-col justify-center">
            {renderContent()}
          </div>
          
          <div className="mt-14 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-50 pt-8">
            <div className="flex items-center gap-4">
              <span className="cursor-pointer hover:text-emerald-600 transition-colors">Help</span>
              <span className="cursor-pointer hover:text-emerald-600 transition-colors">Privacy</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="cursor-pointer hover:text-emerald-600 transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
        
        <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest opacity-80">
           <Fingerprint className="w-4 h-4 text-emerald-500" /> HostFlow Secure Instance v9.8
        </div>
      </div>
    </div>
  );
};

export default Auth;
