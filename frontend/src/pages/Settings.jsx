import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, User, Shield, Info } from 'lucide-react';
import CategoryManager from '../components/CategoryManager';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Profile State
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    async function getProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('Profile fetch error or no profile:', error);
        }

        if (data) {
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user]);

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date()
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      setMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error updating profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20 md:pb-0 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-zinc-400" />
          Settings
        </h2>
        <p className="text-zinc-500 mt-1">Manage your account preferences and details.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
            <User className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-zinc-900">Personal Profile</h3>
          </div>
          
          <form onSubmit={updateProfile} className="p-6">
            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.includes('Error') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {message}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  disabled
                  value={user?.email || ''} 
                  className="w-full bg-zinc-100/50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500 mt-2">Email changes must be done via Supabase auth verification.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Display Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Avatar URL (Optional)</label>
                <input 
                  type="url" 
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-end">
              <button
                type="submit"
                disabled={loading || saving}
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Category & Sub-Category Management */}
        <CategoryManager />

        {/* Security Section (Placeholders for future use) */}
        <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
            <Shield className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-zinc-900">Security</h3>
          </div>
          <div className="p-6">
            <p className="text-zinc-500 text-sm mb-4">Password resets and Multi-Factor authentication can be enabled here in future updates.</p>
            <button disabled className="bg-zinc-100 text-zinc-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed">
              Change Password
            </button>
          </div>
        </section>

        {/* App Info Section */}
        <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden mb-8">
           <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-zinc-900">About Bharat Money Manager</h3>
          </div>
          <div className="p-6 flex flex-col items-start gap-1">
            <p className="font-medium text-zinc-900">Version 2.0 (Phase 2 MVP)</p>
            <p className="text-sm text-zinc-500">Built using React, TailwindCSS, Vite, Node.js, and Supabase.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
