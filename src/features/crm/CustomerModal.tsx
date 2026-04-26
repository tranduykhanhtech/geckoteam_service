import { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Phone, User, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useCRMStore } from '../../store/crmStore';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCustomer?: any;
}

export function CustomerModal({ isOpen, onClose, editCustomer }: CustomerModalProps) {
  const { addCustomer, updateCustomer } = useCRMStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (editCustomer) {
      setFormData({
        full_name: editCustomer.full_name || '',
        email: editCustomer.email || '',
        phone: editCustomer.phone || '',
      });
    } else {
      setFormData({ full_name: '', email: '', phone: '' });
    }
  }, [editCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCustomer) {
        await updateCustomer(editCustomer.id, formData);
      } else {
        await addCustomer(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-xl text-slate-900 flex items-center">
              <UserPlus className="h-6 w-6 mr-3 text-emerald-500" />
              {editCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Customer Details</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-2 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                required
                className="w-full pl-11 pr-4 h-12 text-sm border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 transition-all font-medium" 
                placeholder="Enter customer full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="email"
                className="w-full pl-11 pr-4 h-12 text-sm border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 transition-all font-medium" 
                placeholder="customer@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="tel"
                className="w-full pl-11 pr-4 h-12 text-sm border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 transition-all font-medium" 
                placeholder="+84 9xx xxx xxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-12 rounded-2xl font-bold border-2" 
              onClick={onClose} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/20" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (editCustomer ? 'Save Changes' : 'Add Customer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
