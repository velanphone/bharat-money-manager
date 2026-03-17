import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, categories(name, icon)')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;
        
        // Top 5 recent for list
        setRecentTransactions(data ? data.slice(0, 5) : []);

        if (data) {
          // Calculate summary stats
          const summary = data.reduce(
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

          // Compute Monthly Chart Data (Last 6 Months)
          const monthlyData = {};
          
          data.forEach(tx => {
            const date = new Date(tx.date);
            const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            
            if (!monthlyData[monthYear]) {
              monthlyData[monthYear] = { name: monthYear, Income: 0, Expense: 0, sortKey: date.getTime() };
            }
            
            if (tx.type === 'income') {
              monthlyData[monthYear].Income += Number(tx.amount);
            } else {
              monthlyData[monthYear].Expense += Number(tx.amount);
            }
          });

          const sortedChartData = Object.values(monthlyData)
            .sort((a, b) => a.sortKey - b.sortKey)
            .slice(-6); // Keep last 6 months

          setChartData(sortedChartData);
        }
      } catch (error) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user]);

  return (
    <div className="animate-in fade-in duration-500 pb-20 md:pb-0">
      {/* Header handled by AppLayout now, just page title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h2>
          <p className="text-zinc-500 mt-1">Here's your financial overview for this period.</p>
        </div>
        <button 
          onClick={() => navigate('/transactions')}
          className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
        >
          <Activity className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm">
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

        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
          <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
            Cash Flow Analytics
          </h3>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">Loading chart...</div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 flex-col gap-2">
                <Activity className="w-8 h-8 opacity-50" />
                <p>Not enough data to display chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{fill: '#f4f4f5'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'}}
                    formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-zinc-900">Recent</h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Loading transactions...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-500 text-sm">No recent activity.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-zinc-900 text-sm truncate">{tx.description || tx.categories?.name || 'Uncategorized'}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`font-bold text-sm flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
