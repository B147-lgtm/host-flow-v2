
import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, DollarSign, Star, TrendingUp, AlertCircle, ArrowUpRight, Layers, Home, FileSpreadsheet, Download, ChevronLeft, ChevronRight, CheckCircle, Percent
} from 'lucide-react';
import { TransactionType, Booking, Transaction, Guest, BookingStatus, PropertyConfig, StaffLog } from '../types';

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <h3 className="text-slate-500 text-[10px] font-black tracking-widest uppercase">{title}</h3>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tight">{subtitle}</p>}
  </div>
);

const OccupancyCalendar = ({ bookings }: { bookings: Booking[] }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, fullDate: null });
    }
    
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      // Robust occupancy check using string comparison to avoid timezone issues
      const isOccupied = bookings.some(b => {
        if (!b.checkIn || !b.checkOut || b.status === BookingStatus.CANCELLED) return false;
        
        // Normalize strings to YYYY-MM-DD
        const start = b.checkIn.split('T')[0];
        const end = b.checkOut.split('T')[0];
        
        // A day is occupied if the date is >= checkIn and < checkOut
        // (Standard hotel logic: checkout day is available for next guest)
        return fullDate >= start && fullDate < end;
      });
      
      days.push({ day: i, fullDate, isOccupied });
    }
    return days;
  }, [viewDate, bookings]);

  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Occupancy Calendar</h2>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Live Inventory Availability (Sync & Manual)</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <span className="text-xs font-black text-slate-900 uppercase tracking-widest min-w-[140px] text-center">{monthName} {viewDate.getFullYear()}</span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-90">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[2px] pb-4">{d}</div>
        ))}
        {calendarData.map((d, idx) => (
          <div 
            key={idx} 
            className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative group transition-all border-2 ${
              d.day 
                ? (d.isOccupied 
                    ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-100 text-white' 
                    : 'bg-white border-slate-50 hover:border-emerald-200 text-slate-900') 
                : 'bg-transparent border-transparent'
            }`}
          >
            {d.day && (
              <>
                <span className="text-xs font-black">{d.day}</span>
                {d.isOccupied && <div className="w-1 h-1 bg-emerald-200 rounded-full mt-1 animate-pulse" />}
              </>
            )}
            
            {/* Tooltip for occupied dates */}
            {d.day && d.isOccupied && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black uppercase px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                Confirmed Occupancy
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-6 mt-8 pt-6 border-t border-slate-50">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-600 rounded-full shadow-sm shadow-emerald-200"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reserved Nights</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border-2 border-slate-200 rounded-full"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Open Availability</span>
         </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  bookings: Booking[];
  transactions: Transaction[];
  guests: Guest[];
  staffLogs: StaffLog[];
  property: PropertyConfig;
  isGlobal?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ bookings, transactions, guests, staffLogs, property, isGlobal }) => {
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const lastSixMonths = [];
    
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      const monthName = months[mIdx];
      const year = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0);
      const datePrefix = `${year}-${String(mIdx + 1).padStart(2, '0')}`;
      
      const income = transactions
        .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(datePrefix))
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(datePrefix))
        .reduce((sum, t) => sum + t.amount, 0);
        
      lastSixMonths.push({ name: monthName, revenue: income, expenses });
    }
    return lastSixMonths;
  }, [transactions]);

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const profitMargin = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const activeBookings = bookings.filter(b => b.status === BookingStatus.CHECKED_IN || b.status === BookingStatus.UPCOMING).length;
    
    // Calculate Occupancy Percentage for Current Month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let occupiedDays = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isOccupied = bookings.some(b => {
        if (!b.checkIn || !b.checkOut || b.status === BookingStatus.CANCELLED) return false;
        const start = b.checkIn.split('T')[0];
        const end = b.checkOut.split('T')[0];
        return fullDate >= start && fullDate < end;
      });
      if (isOccupied) occupiedDays++;
    }

    const occupancyRate = Math.round((occupiedDays / daysInMonth) * 100);

    return {
      totalIncome,
      activeBookings,
      profitMargin: Math.round(profitMargin),
      occupancyRate
    };
  }, [transactions, bookings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            {isGlobal ? <Layers className="w-8 h-8 text-indigo-600" /> : <Home className="w-8 h-8 text-emerald-600" />}
            {isGlobal ? "Global Portfolio" : property.name}
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-[2px]">
            {isGlobal ? "Aggregated Fleet Performance" : "Unit Specific Analytics"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Confirmed Revenue" value={`₹${stats.totalIncome.toLocaleString('en-IN')}`} icon={DollarSign} color="bg-emerald-500" subtitle={isGlobal ? "Sum of all units" : "This property total"} />
        <StatCard title="Active Reserves" value={stats.activeBookings} icon={Calendar} color="bg-blue-500" subtitle="Confirmed Guests" />
        <StatCard title="Operating Margin" value={`${stats.profitMargin}%`} icon={ArrowUpRight} color="bg-indigo-500" subtitle="Unit Health" />
        <StatCard title="Occupancy %" value={`${stats.occupancyRate}%`} icon={TrendingUp} color="bg-amber-500" subtitle="Inventory Utilization" />
      </div>

      <OccupancyCalendar bookings={bookings} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center justify-between">
            Momentum Tracker
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Flow</span>
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fill="#10b981" fillOpacity={0.05} />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={4} fill="#f43f5e" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl h-full min-h-[400px]">
            <h2 className="text-lg font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              Operational Log
            </h2>
            <div className="space-y-4">
              {staffLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-30">
                  <AlertCircle className="w-10 h-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No New Alerts</p>
                </div>
              ) : (
                staffLogs.slice(0, 4).map(alert => (
                  <div key={alert.id} className={`p-4 rounded-2xl border ${alert.priority === 'high' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${alert.priority === 'high' ? 'text-rose-400' : 'text-slate-400'}`}>
                        {alert.type}
                      </p>
                      <span className="text-[10px] text-slate-500 font-bold">{alert.timestamp.split(',')[1]}</span>
                    </div>
                    <p className="text-sm font-bold leading-tight">{alert.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
