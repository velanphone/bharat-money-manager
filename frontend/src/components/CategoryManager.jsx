import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, ChevronDown, ChevronRight, Tag, FolderTree, X, Pencil, Check } from 'lucide-react';

export default function CategoryManager() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('expense');
  const [newParentId, setNewParentId] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Expand/collapse state
  const [expanded, setExpanded] = useState({});

  // Edit state: { id, name, icon }
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [user]);

  async function fetchCategories() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase.from('categories').insert([{
        user_id: user.id,
        name: newName.trim(),
        type: newType,
        parent_id: newParentId || null,
        icon: newIcon || null,
      }]);

      if (error) throw error;

      setNewName('');
      setNewIcon('');
      setNewParentId('');
      setShowForm(false);
      setMessage('Category added!');
      setTimeout(() => setMessage(''), 3000);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Sub-categories will also be removed.')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      if (editingId === id) setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editName.trim(), icon: editIcon || null })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setMessage('Category updated!');
      setTimeout(() => setMessage(''), 3000);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId);

  const incomeCategories = parentCategories.filter(c => c.type === 'income');
  const expenseCategories = parentCategories.filter(c => c.type === 'expense');

  const renderEditRow = (cat, isChild = false) => (
    <div className={`flex items-center gap-2 ${isChild ? 'p-2.5' : 'p-3'} bg-brand-50/50 rounded-xl border border-brand-200`}>
      <input
        type="text"
        value={editIcon}
        onChange={(e) => setEditIcon(e.target.value)}
        placeholder="🏷️"
        maxLength={4}
        className={`${isChild ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'} text-center bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 flex-shrink-0`}
      />
      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveEdit(cat.id);
          if (e.key === 'Escape') cancelEdit();
        }}
        className={`flex-1 bg-white border border-zinc-300 rounded-lg px-3 ${isChild ? 'py-1.5 text-sm' : 'py-2'} text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500`}
      />
      <button
        onClick={() => saveEdit(cat.id)}
        disabled={editSaving}
        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
        title="Save"
      >
        <Check className={`${isChild ? 'w-4 h-4' : 'w-5 h-5'}`} />
      </button>
      <button
        onClick={cancelEdit}
        className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg transition"
        title="Cancel"
      >
        <X className={`${isChild ? 'w-4 h-4' : 'w-5 h-5'}`} />
      </button>
    </div>
  );

  const renderCategoryItem = (cat) => {
    const children = getChildren(cat.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded[cat.id];
    const isEditing = editingId === cat.id;

    if (isEditing) {
      return <div key={cat.id}>{renderEditRow(cat)}</div>;
    }

    return (
      <div key={cat.id}>
        <div className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasChildren ? (
              <button onClick={() => toggleExpand(cat.id)} className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
              cat.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {cat.icon || <Tag className="w-4 h-4" />}
            </div>
            <span className="font-medium text-zinc-900 truncate">{cat.name}</span>
            {hasChildren && (
              <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full flex-shrink-0">
                {children.length} sub
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
            <button
              onClick={() => startEdit(cat)}
              className="p-2 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-8 pl-4 border-l-2 border-zinc-100 space-y-0.5">
            {children.map(child => {
              const isChildEditing = editingId === child.id;
              if (isChildEditing) {
                return <div key={child.id}>{renderEditRow(child, true)}</div>;
              }
              return (
                <div key={child.id} className="flex items-center justify-between p-2.5 hover:bg-zinc-50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0 ${
                      child.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {child.icon || <Tag className="w-3 h-3" />}
                    </div>
                    <span className="text-sm text-zinc-700 truncate">{child.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                    <button
                      onClick={() => startEdit(child)}
                      className="p-1.5 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(child.id)}
                      className="p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title, items, typeColor) => (
    <div className="mb-4">
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 px-3 ${typeColor}`}>{title}</h4>
      {items.length === 0 ? (
        <p className="text-zinc-400 text-sm px-3 py-2">No {title.toLowerCase()} categories yet.</p>
      ) : (
        <div className="space-y-0.5">{items.map(renderCategoryItem)}</div>
      )}
    </div>
  );

  return (
    <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderTree className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-zinc-900">Categories & Sub-Categories</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showForm
              ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/20'
          }`}
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Category</>}
        </button>
      </div>

      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-xl text-sm font-medium ${
          message.includes('Error') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="p-6 border-b border-zinc-100 bg-zinc-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Category Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Groceries"
                required
                className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Type</label>
              <div className="flex rounded-xl bg-zinc-100 p-1">
                <button
                  type="button"
                  onClick={() => { setNewType('expense'); setNewParentId(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${newType === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => { setNewType('income'); setNewParentId(''); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${newType === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  Income
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Parent Category (Optional)</label>
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
              >
                <option value="">None (Top-Level Category)</option>
                {parentCategories.filter(c => c.type === newType).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Icon (Emoji, Optional)</label>
              <input
                type="text"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="🛒"
                maxLength={4}
                className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Category'}
          </button>
        </form>
      )}

      <div className="p-6">
        {loading ? (
          <p className="text-zinc-400 text-sm text-center py-4">Loading categories...</p>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <FolderTree className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No categories yet. Click "Add Category" to get started.</p>
          </div>
        ) : (
          <>
            {renderSection('Expense Categories', expenseCategories, 'text-rose-500')}
            {renderSection('Income Categories', incomeCategories, 'text-emerald-500')}
          </>
        )}
      </div>
    </section>
  );
}
