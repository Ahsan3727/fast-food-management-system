import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';
import toast from 'react-hot-toast';
import { Icon } from '@/components/Icon';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  emoji?: string;
  isAvailable: boolean;
  imageUrl?: string;
}

interface Category {
  _id: string;
  name: string;
  icon: string;
}

export default function MenuPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu'],
    queryFn: () => api.get('/menu').then(r => r.data),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  });

  const { register, handleSubmit, reset, setValue } = useForm<any>();

  const openCreate = () => {
    setEditItem(null);
    reset({ isAvailable: true, emoji: '🍔' });
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    reset({ ...item, basePrice: item.basePrice / 100 });
    setShowForm(true);
  };

  const saveItem = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        basePrice: Math.round(parseFloat(data.basePrice) * 100),
      };
      if (editItem) return api.patch(`/menu/${editItem._id}`, payload);
      return api.post('/menu', payload);
    },
    onSuccess: () => {
      toast.success(editItem ? 'Item updated!' : 'Item created!');
      qc.invalidateQueries({ queryKey: ['menu'] });
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save item'),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/${id}`),
    onSuccess: () => {
      toast.success('Item deleted');
      qc.invalidateQueries({ queryKey: ['menu'] });
    },
  });

  const toggleAvailable = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) =>
      api.patch(`/menu/${id}`, { isAvailable: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
    onError: () => toast.error('Failed to update stock status'),
  });

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/uploads/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue('imageUrl', data.url);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Menu & Inventory</h2>
          <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '2px 0 0' }}>
            Manage food offerings, instant 86/available toggle, and pricing
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--sunken)',
              padding: 3,
              borderRadius: 10,
              border: '1px solid var(--border)',
            }}
          >
            {(['items', 'categories'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === tab ? 'var(--surface)' : 'transparent',
                  color: activeTab === tab ? 'var(--text)' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {tab === 'items' ? 'Menu Items' : 'Categories'}
              </button>
            ))}
          </div>

          {activeTab === 'items' && (
            <button
              onClick={openCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 10,
                background: 'var(--action)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Icon name="plus" size={16} />
              Add Item
            </button>
          )}
        </div>
      </div>

      {activeTab === 'items' && (
        <>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '0 12px',
                height: 38,
                flex: '1 1 240px',
                maxWidth: 360,
              }}
            >
              <Icon name="search" size={16} style={{ color: 'var(--subtle)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search items by name or ingredients..."
                style={{
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  fontSize: 13,
                  width: '100%',
                }}
              />
            </div>

            {/* Category chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedCategory === 'ALL' ? 'var(--action)' : 'var(--border)',
                  background: selectedCategory === 'ALL' ? 'var(--action)' : 'var(--surface)',
                  color: selectedCategory === 'ALL' ? '#fff' : 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                All ({items.length})
              </button>
              {categories.map(cat => {
                const count = items.filter(i => i.categoryId === cat._id).length;
                const isSelected = selectedCategory === cat._id;
                return (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--action)' : 'var(--border)',
                      background: isSelected ? 'var(--action)' : 'var(--surface)',
                      color: isSelected ? '#fff' : 'var(--muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {cat.icon} {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--sunken)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)' }}>Item</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)' }}>Category</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)' }}>Price</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)' }}>Available</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const cat = categories.find(c => c._id === item.categoryId);
                    return (
                      <tr
                        key={item._id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: 'var(--sunken)',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: 22,
                                flexShrink: 0,
                              }}
                            >
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                                />
                              ) : (
                                item.emoji || '🍔'
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--subtle)',
                                  maxWidth: 280,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.description || 'No description provided'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>
                          {cat ? `${cat.icon} ${cat.name}` : '—'}
                        </td>

                        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, color: 'var(--action)' }}>
                          {formatMoneyCompact(item.basePrice)}
                        </td>

                        {/* Availability toggle switch */}
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            type="button"
                            onClick={() => toggleAvailable.mutate({ id: item._id, val: !item.isAvailable })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                            title={item.isAvailable ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                width: 36,
                                height: 20,
                                borderRadius: 999,
                                background: item.isAvailable ? 'var(--ok)' : 'var(--strong)',
                                position: 'relative',
                                transition: 'background 0.2s ease',
                              }}
                            >
                              <span
                                style={{
                                  position: 'absolute',
                                  top: 2,
                                  left: item.isAvailable ? 18 : 2,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: '#fff',
                                  transition: 'left 0.2s cubic-bezier(0.2,0,0,1)',
                                }}
                              />
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: item.isAvailable ? 'var(--ok)' : 'var(--subtle)',
                              }}
                            >
                              {item.isAvailable ? 'In Stock' : '86ed'}
                            </span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => openEdit(item)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                                background: 'var(--sunken)',
                                color: 'var(--text)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item._id);
                              }}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: '1px solid rgba(239,68,68,0.2)',
                                background: 'var(--bad-bg)',
                                color: 'var(--bad)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                              title="Delete Item"
                            >
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--subtle)' }}>
                        {isLoading ? 'Loading menu items...' : 'No items match your filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {categories.map(cat => {
            const count = items.filter(i => i.categoryId === cat._id).length;
            return (
              <div
                key={cat._id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 24,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    background: 'var(--sunken)',
                    fontSize: 28,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {cat.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{cat.name}</div>
                <div style={{ fontSize: 13, color: 'var(--subtle)' }}>{count} items active</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--raised)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {editItem ? 'Edit Menu Item' : 'New Menu Item'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--subtle)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <Icon name="ban" size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(d => saveItem.mutate(d))}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                    Item Name *
                  </label>
                  <input
                    className="input"
                    {...register('name', { required: true })}
                    placeholder="e.g. Zinger Burger"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                    Emoji
                  </label>
                  <input
                    className="input"
                    {...register('emoji')}
                    style={{ fontSize: 20, textAlign: 'center' }}
                    placeholder="🍔"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  className="input"
                  rows={2}
                  {...register('description')}
                  placeholder="Ingredients, preparation details..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                    Category *
                  </label>
                  <select className="input" {...register('categoryId', { required: true })}>
                    <option value="">Select Category...</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                    Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="input"
                    {...register('basePrice', { required: true })}
                    placeholder="450"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                  Photo (Optional)
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImage} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--sunken)',
                      color: 'var(--text)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Upload Photo
                  </button>
                  <input
                    className="input"
                    placeholder="Or enter image URL"
                    {...register('imageUrl')}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                <input type="checkbox" {...register('isAvailable')} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  In Stock & Available to Customers
                </span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveItem.isPending}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--action)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {saveItem.isPending ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
