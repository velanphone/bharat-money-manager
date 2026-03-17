import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Transactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    try {
      const [txRes, catRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, categories(name, icon)')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (txRes.error) throw txRes.error;
      if (catRes.error) throw catRes.error;

      setTransactions(txRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !type || !date) return;
    
    setIsSubmitting(true);
    try {
      // For MVP, directly connect to Supabase
      const { error } = await supabase.from('transactions').insert([{
        user_id: user.id,
        amount: Number(amount),
        type,
        description,
        date,
        category_id: categoryId || null
      }]);

      if (error) throw error;
      
      // Reset form
      setShowForm(false);
      setAmount('');
      setDescription('');
      fetchData();
    } catch (err) {
      console.error(err.message);
      alert('Failed to add transaction. ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete.');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Transactions</h2>
        <p className="text-zinc-500 mt-1">Manage all your income and expenses.</p>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight">All Transactions</h2>
        <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md flex items-center gap-2"
          >
            {showForm ? 'Cancel' : <><Plus className="w-4 h-4"/> Add New</>}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold mb-4">New Transaction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Type</label>
                <div className="flex rounded-xl bg-zinc-100 p-1">
                  <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${type === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-zinc-500 hover:text-zinc-700'}`}>Expense</button>
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'}`}>Income</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Amount (₹)</label>
                <input 
                  type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-500 mb-1">Description</label>
                <input 
                  type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="What was this for?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Date</label>
                <input 
                  type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Category</label>
                <select 
                  value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">None (Uncategorized)</option>
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              type="submit" disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl transition-all shadow-md mt-2"
            >
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </form>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-zinc-500">Loading your transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-zinc-500">No transactions recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm flex-shrink-0 ${
                      tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 leading-tight">{tx.description || tx.categories?.name || 'Uncategorized'}</p>
                      <p className="text-zinc-500 text-sm mt-0.5">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-bold text-lg text-right ${tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="text-zinc-300 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
