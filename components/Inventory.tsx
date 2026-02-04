
import React, { useState, useEffect } from 'react';
import { InventoryCategory, InventoryItem, StockStatus, Booking } from '../types';
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  History,
  Sparkles,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Save,
  PlusCircle,
  TableProperties,
  LayoutList,
  Check
} from 'lucide-react';
import { predictInventoryNeeds } from '../services/geminiService';

interface InventoryProps {
  propertyName: string;
  bookings: Booking[];
  inventoryItems: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ propertyName, bookings, inventoryItems, onUpdateInventory }) => {
  const [filter, setFilter] = useState<InventoryCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Sheet Mode State
  const [isSheetMode, setIsSheetMode] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '',
    category: InventoryCategory.USABLES,
    quantity: 0,
    minThreshold: 5,
    unit: 'Units',
    unitCost: 0
  });

  const getStatus = (item: InventoryItem): StockStatus => {
    if (item.quantity === 0) return StockStatus.OUT_OF_STOCK;
    if (item.quantity <= item.minThreshold) return StockStatus.LOW_STOCK;
    return StockStatus.IN_STOCK;
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = inventoryItems.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta), lastUpdated: new Date().toISOString().split('T')[0] } : item
    );
    onUpdateInventory(updated);
  };

  const handleInlineUpdate = (id: string, field: keyof InventoryItem, value: any) => {
    const updated = inventoryItems.map(item => 
      item.id === id ? { ...item, [field]: value, lastUpdated: new Date().toISOString().split('T')[0] } : item
    );
    onUpdateInventory(updated);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Permanently remove this article from Wood Heaven Farms stock records?")) {
      const updated = inventoryItems.filter(i => i.id !== id);
      onUpdateInventory(updated);
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}`,
      propertyId: 'prop-1', // Defaulting to first property
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    onUpdateInventory([item, ...inventoryItems]);
    setIsAddModalOpen(false);
    setNewItem({
      name: '',
      category: InventoryCategory.USABLES,
      quantity: 0,
      minThreshold: 5,
      unit: 'Units',
      unitCost: 0
    });
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = inventoryItems.map(i => i.id === editingItem.id ? editingItem : i);
    onUpdateInventory(updated);
    setEditingItem(null);
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    const suggestions = await predictInventoryNeeds(inventoryItems, bookings, propertyName);
    setAiSuggestions(suggestions);
    setIsPredicting(false);
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesFilter = filter === 'All' || item.category === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const lowStockCount = inventoryItems.filter(i => getStatus(i) !== StockStatus.IN_STOCK).length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
            <Package className="w-8 h-8 text-rose-500" />
            Stock Control
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-[2px]">Inventory Hub • Wood Heaven Farms</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsSheetMode(!isSheetMode)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${
              isSheetMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isSheetMode ? <LayoutList className="w-3.5 h-3.5" /> : <TableProperties className="w-3.5 h-3.5" />}
            {isSheetMode ? "Standard View" : "Sheet Mode"}
          </button>
          
          <button 
            onClick={handlePredict}
            disabled={isPredicting}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isPredicting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Strategy
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95 hover:bg-slate-800"
          >
            <PlusCircle className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top-4">
          <div className="bg-amber-100 p-4 rounded-2xl shadow-inner">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-amber-900 font-black text-lg">Inventory Warning</p>
            <p className="text-amber-700 text-sm font-medium">You have {lowStockCount} items currently below their safety threshold. Consider restock soon.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filter stock by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-sm font-bold text-slate-900"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Show Category</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-sm text-slate-600 font-black text-xs uppercase tracking-widest"
          >
            <option value="All">All Categories</option>
            {Object.values(InventoryCategory).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden ${isSheetMode ? 'ring-4 ring-indigo-50 border-indigo-200' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[9px] uppercase tracking-[3px] font-black border-b border-slate-100">
                <th className="px-10 py-6">Item Particular</th>
                <th className="px-10 py-6">Current Quantity</th>
                <th className="px-10 py-6">Threshold Limit</th>
                <th className="px-10 py-6">Status Indicator</th>
                {!isSheetMode && <th className="px-10 py-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${isSheetMode ? 'bg-indigo-50/5' : ''}`}>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] border-2 ${
                           status === StockStatus.OUT_OF_STOCK ? 'bg-rose-50 border-rose-100 text-rose-500' : 
                           status === StockStatus.LOW_STOCK ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-slate-50 border-slate-100 text-slate-400'
                         }`}>
                           {item.name.charAt(0)}
                         </div>
                         <div>
                            <p className="font-black text-slate-900 tracking-tight text-xs uppercase leading-none mb-1.5">{item.name}</p>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[1px]">{item.category}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                       {isSheetMode ? (
                         <div className="flex items-center gap-3">
                            <input 
                              type="number"
                              className={`w-24 px-4 py-2 border rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${status === StockStatus.OUT_OF_STOCK ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white shadow-inner'}`}
                              value={item.quantity}
                              step="0.1"
                              onChange={(e) => handleInlineUpdate(item.id, 'quantity', Number(e.target.value))}
                            />
                            <span className="text-[9px] font-black text-slate-400 uppercase">{item.unit}</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-4">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-lg flex items-center justify-center transition-all text-slate-400 active:scale-90"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="text-center min-w-[50px]">
                               <p className={`text-base font-black ${status === StockStatus.OUT_OF_STOCK ? 'text-rose-600' : 'text-slate-900'}`}>
                                 {item.quantity}
                               </p>
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.unit}</p>
                            </div>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg flex items-center justify-center transition-all text-slate-400 active:scale-90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                         </div>
                       )}
                    </td>
                    <td className="px-10 py-7">
                       {isSheetMode ? (
                          <input 
                            type="number"
                            className="w-24 px-4 py-2 border border-slate-200 bg-white shadow-inner rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-rose-500"
                            value={item.minThreshold}
                            onChange={(e) => handleInlineUpdate(item.id, 'minThreshold', Number(e.target.value))}
                          />
                       ) : (
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900">{item.minThreshold} <span className="text-[8px] text-slate-400 uppercase">{item.unit}</span></span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alert Point</span>
                         </div>
                       )}
                    </td>
                    <td className="px-10 py-7">
                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-[1px] ${
                         status === StockStatus.IN_STOCK ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                         status === StockStatus.LOW_STOCK ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                       }`}>
                          {status === StockStatus.IN_STOCK && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {status === StockStatus.LOW_STOCK && <AlertTriangle className="w-2.5 h-2.5" />}
                          {status === StockStatus.OUT_OF_STOCK && <XCircle className="w-2.5 h-2.5" />}
                          {status}
                       </div>
                    </td>
                    {!isSheetMode && (
                      <td className="px-10 py-7 text-right">
                         <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingItem(item)}
                              className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS REMAIN THE SAME FOR ADDING NEW ITEMS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">New Particular</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Manual Inventory Filing</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                  <X className="w-8 h-8" />
                </button>
             </div>
             <form onSubmit={handleAddNewItem} className="p-10 space-y-8">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Item Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-xs"
                        placeholder="e.g. Rampur Whisky Glass"
                        value={newItem.name}
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Category</label>
                        <select 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase"
                          value={newItem.category}
                          onChange={e => setNewItem({...newItem, category: e.target.value as InventoryCategory})}
                        >
                          {Object.values(InventoryCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Unit Label</label>
                        <input 
                          required
                          type="text" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase"
                          placeholder="Units/Liters/Packets"
                          value={newItem.unit}
                          onChange={e => setNewItem({...newItem, unit: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Opening Stock</label>
                        <input 
                          required
                          type="number" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl"
                          value={newItem.quantity}
                          onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Safety Threshold</label>
                        <input 
                          required
                          type="number" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-rose-500"
                          value={newItem.minThreshold}
                          onChange={e => setNewItem({...newItem, minThreshold: Number(e.target.value)})}
                        />
                      </div>
                   </div>
                </div>
                <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-[0.98] transition-all">
                  Finalize Particular
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
