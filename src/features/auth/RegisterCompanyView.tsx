import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Loader2, Mail, Lock, User, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import geckoLogo from '../../assets/gecko.svg';

export function RegisterCompanyView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account.");
      }

      // 2. Generate UUID for the new company
      const companyId = crypto.randomUUID();

      // 3. Create the Company (Do not use .select() here because the SELECT RLS policy 
      // will fail until the profile is created)
      const { error: companyError } = await supabase
        .from('companies')
        .insert([{ id: companyId, name: companyName }]);

      if (companyError) throw companyError;

      // 4. Create the Admin Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: authData.user.id, 
          company_id: companyId, 
          full_name: fullName, 
          role: 'admin' 
        }]);

      if (profileError) throw profileError;

      setSuccess("Your company has been successfully registered! You are now logged in.");

    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-slate-100">
            <img src={geckoLogo} alt="Gecko Logo" className="h-12 w-12" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Start your free trial
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Or <Link to="/login" className="font-semibold text-slate-900 hover:underline decoration-slate-200">sign in to your existing account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Company / Store Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  required
                  type="text"
                  className="focus:ring-1 focus:ring-slate-900 focus:border-slate-900 block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-2.5 border outline-none transition-all"
                  placeholder="The Coffee House"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Your Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  required
                  type="text"
                  className="focus:ring-1 focus:ring-slate-900 focus:border-slate-900 block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-2.5 border outline-none transition-all"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Work Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  required
                  type="email"
                  className="focus:ring-1 focus:ring-slate-900 focus:border-slate-900 block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-2.5 border outline-none transition-all"
                  placeholder="admin@coffeehouse.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  required
                  type="password"
                  minLength={6}
                  className="focus:ring-1 focus:ring-slate-900 focus:border-slate-900 block w-full pl-10 sm:text-sm border-slate-200 rounded-xl py-2.5 border outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Register Business'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
