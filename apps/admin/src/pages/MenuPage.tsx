import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';
import toast from 'react-hot-toast';

interface MenuItem {
  _id: string; name: string; description: string; categoryId: string; basePrice: number;
  emoji?: string; isAvailable: boolean; imageUrl?: string;
}
interface Category { _id: string; name: string; icon: string; }

export default function MenuPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [] } = useQuery<MenuItem[]>({
    queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data),
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'], queryFn: () => api.get('/menu/categories').then(r => r.data),
  });

  const { register, handleSubmit, reset, setValue } = useForm<any>();

  const openCreate = () => { setEditItem(null); reset({ isAvailable: true, emoji: '🍔' }); setShowForm(true); };
  const openEdit = (item: MenuItem) => { setEditItem(item); reset({ ...item, basePrice: item.basePrice / 100 }); setShowForm(true); };

  const saveItem = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, basePrice: Math.round(parseFloat(data.basePrice) * 100) };
      if (editItem) return api.patch(`/menu/${editItem._id}`, payload);
      return api.post('/menu', payload);
    },
    onSuccess: () => { toast.success(editItem ? 'Item updated!' : 'Item created!'); qc.invalidateQueries({ queryKey: ['menu'] }); setShowForm(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/${id}`),
    onSuccess: () => { toast.success('Item deleted'); qc.invalidateQueries({ queryKey: ['menu'] }); },
  });

  const toggleAvailable = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) => api.patch(`/menu/${id}`, { isAvailable: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setValue('imageUrl', data.url);
      toast.success('Image uploaded!');
    } catch { toast.error('Upload failed'); }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Menu Manager</h1>
        <div className="flex-gap">
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['items', 'categories'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, background: activeTab === t ? 'var(--primary)' : 'transparent', color: activeTab === t ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                {t === 'items' ? '🍔 Items' : '📂 Categories'}
              </button>
            ))}
          </div>
          {activeTab === 'items' && <button className="btn btn-primary" onClick={openCreate}>+ Add Item</button>}
        </div>
      </div>

      {activeTab === 'items' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Item</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {(items as MenuItem[]).map(item => (
                  <tr key={item._id}>
                    <td>
                      <div className="flex-gap">
                        <span style={{ fontSize: 24 }}>{item.emoji ?? '🍽️'}</span>
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {(categories as Category[]).find(c => c._id === item.categoryId)?.name ?? '—'}
                    </td>
                    <td className="font-bold text-primary">{formatMoneyCompact(item.basePrice)}</td>
                    <td>
                      <button onClick={() => toggleAvailable.mutate({ id: item._id, val: !item.isAvailable })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}>
                        {item.isAvailable ? '🟢' : '🔴'}
                      </button>
                    </td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item._id); }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No items yet — click "+ Add Item"</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {(categories as Category[]).map(cat => (
            <div key={cat._id} className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40 }}>{cat.icon}</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{cat.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                {(items as MenuItem[]).filter(i => i.categoryId === cat._id).length} items
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700 }}>{editItem ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSubmit(d => saveItem.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="input-group"><label className="label">Name *</label><input className="input" {...register('name', { required: true })} /></div>
                <div className="input-group"><label className="label">Emoji</label><input className="input" {...register('emoji')} style={{ fontSize: 24, textAlign: 'center' }} /></div>
              </div>
              <div className="input-group"><label className="label">Description</label><textarea className="input" rows={2} {...register('description')} style={{ resize: 'vertical' }} /></div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="label">Category *</label>
                  <select className="input" {...register('categoryId', { required: true })}>
                    <option value="">Select…</option>
                    {(categories as Category[]).map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="input-group"><label className="label">Base Price (Rs.) *</label><input type="number" step="0.01" className="input" {...register('basePrice', { required: true })} /></div>
              </div>
              {/* Image upload */}
              <div className="input-group">
                <label className="label">Image</label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImage} />
                <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>📷 Upload Image</button>
                <input className="input" style={{ marginTop: 6 }} placeholder="Or paste image URL" {...register('imageUrl')} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" {...register('isAvailable')} />
                <span style={{ fontSize: 14 }}>Available for ordering</span>
              </label>
              <div className="flex-gap" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveItem.isPending}>{saveItem.isPending ? 'Saving…' : 'Save Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
