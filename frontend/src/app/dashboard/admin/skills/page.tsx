'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api } from '@/lib/api';

type SkillItem = { id: string; name: string; category: string | null; createdAt: string };

export default function SkillsPage() {
  const [items, setItems] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const token = getStoredToken();
  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.superAdmin.skills.list(token, categoryFilter ? { category: categoryFilter } : undefined);
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, categoryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setError(null);
    try {
      await api.superAdmin.skills.create({ name: name.trim(), category: category.trim() || undefined }, token);
      setName('');
      setCategory('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create skill');
    }
  };

  const handleUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await api.superAdmin.skills.update(id, { name: editName.trim(), category: editCategory.trim() || undefined }, token);
      setEditingId(null);
      setEditName('');
      setEditCategory('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update skill');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Remove this skill? Talent profiles may still show it until they update.')) return;
    setError(null);
    try {
      await api.superAdmin.skills.delete(id, token);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete skill');
    }
  };

  const startEdit = (s: SkillItem) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditCategory(s.category || '');
  };

  const categories = Array.from(new Set(items.map((s) => s.category).filter(Boolean))) as string[];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="font-semibold text-secondary mb-2">Skill Management</h2>
      <p className="text-gray-600 text-sm mb-6">
        Add and edit skills used in talent profiles and marketplace filters. Categories (e.g. Tech, Marketing, HR) are optional.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Skill name"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-48"
          required
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. Tech, HR)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-40"
        />
        <button type="submit" className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90">
          Add skill
        </button>
      </form>

      <div className="mb-4">
        <label className="text-sm text-gray-600 mr-2">Filter by category:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm">No skills yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 text-sm">
              {editingId === s.id ? (
                <form onSubmit={(e) => handleUpdate(e, s.id)} className="flex flex-wrap gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 w-40"
                    required
                  />
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Category"
                    className="rounded border border-gray-300 px-2 py-1 w-28"
                  />
                  <button type="submit" className="text-primary font-medium">Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setEditName(''); setEditCategory(''); }} className="text-gray-500">Cancel</button>
                </form>
              ) : (
                <>
                  <span className="font-medium text-gray-800">{s.name}</span>
                  {s.category && <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">{s.category}</span>}
                  <span className="flex gap-2">
                    <button type="button" onClick={() => startEdit(s)} className="text-primary text-xs font-medium">Edit</button>
                    <button type="button" onClick={() => handleDelete(s.id)} className="text-red-600 text-xs font-medium">Delete</button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
