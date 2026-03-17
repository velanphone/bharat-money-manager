import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, categories(name, icon)')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        setRecentTransactions(data || []);

        // Calculate stats (in a real app, this might be a DB function for scale)
        const allTx = await supabase.from('transactions').select('amount, type').eq('user_id', user.id);
        if (allTx.data) {
          const summary = allTx.data.reduce(
            (acc, curr) => {
              if (curr.type === 'income') acc.income += Number(curr.amount);
              else acc.expense += Number(curr.amount);
              return acc;
            },
            { income: 0, expense: 0 }
          );
          setStats({
            income: summary.income,
            expense: summary.expense,
            balance: summary.income - summary.expense,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-12">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-zinc-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">
            Bharat Money Manager
          </h1>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 mt-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <p className="text-zinc-500 mb-1">Welcome back,</p>
            <h2 className="text-3xl font-bold">{user?.email?.split('@')[0]}</h2>
          </div>
          <button 
            onClick={() => navigate('/transactions')}
            className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md flex items-center gap-2"
          >
            <Activity className="w-4 h-4" /> Add Transaction
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 cursor-pointer transition">
          {/* Balance Card - Premium gradient */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-6 text-white shadow-xl shadow-zinc-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Wallet className="w-32 h-32" />
            </div>
            <p className="text-zinc-400 font-medium mb-2 relative z-10 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Total Balance
            </p>
            <h3 className="text-4xl font-bold tracking-tight relative z-10">
              ₹{stats.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <p className="text-zinc-500 font-medium">Total Income</p>
            </div>
            <h3 className="text-3xl font-bold text-zinc-900 mt-2">
              ₹{stats.income.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <p className="text-zinc-500 font-medium">Total Expense</p>
            </div>
            <h3 className="text-3xl font-bold text-zinc-900 mt-2">
              ₹{stats.expense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-zinc-900">Recent Transactions</h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-zinc-500">Loading your transactions...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-zinc-400" />
                </div>
                <h4 className="text-lg font-medium text-zinc-900 mb-1">No transactions yet</h4>
                <p className="text-zinc-500">Start by adding your first income or expense.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                        tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 text-lg">{tx.description || tx.categories?.name || 'Uncategorized'}</p>
                        <p className="text-zinc-500 text-sm font-medium">{new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className={`font-bold text-xl ${tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
