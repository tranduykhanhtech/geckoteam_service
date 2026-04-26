import { useState } from 'react';
import { X, Loader2, UserPlus, KeyRound, Mail, AlertTriangle, Phone, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../store/authStore';
import { useHRStore } from '../../store/hrStore';

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewEmployeeModal({ isOpen, onClose }: NewEmployeeModalProps) {
  const { session } = useAuthStore();
  const { fetchEmployees } = useHRStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) {
      setError('You must be logged in as an admin to perform this action.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('https://srsxhrzlwnjqyvsayjyo.supabase.co/functions/v1/create-cashier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create employee account');
      }

      setSuccess(true);
      fetchEmployees(); // Refresh the list
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-900 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-emerald-500" />
            Add New Employee
          </h3>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-1 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 rounded-md text-xs font-medium">
              Successfully created account for {fullName}!
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                required
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" 
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading || success}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                required
                type="email"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" 
                placeholder="e.g. john@geckopos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="tel"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" 
                placeholder="e.g. 0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading || success}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                required
                type="password"
                minLength={6}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" 
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">This password will be used to log into the POS terminal.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading || success}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
