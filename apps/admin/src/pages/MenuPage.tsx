import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '@/lib/api';
import { queryKeys } from '@/api/queryKeys';
import { unwrapList } from '@/api/unwrap';
import { useAdminStore } from '@/store/admin.store';
import { formatMoneyCompact } from '@fastfood/utils';
import toast from 'react-hot-toast';
import { Icon } from '@/components/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

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
  icon?: string;
  sortOrder?: number;
}

export default function MenuPage() {
  const qc = useQueryClient();
  const { user } = useAdminStore();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Queries using queryKeys
  const {
    data: rawItems,
    isLoading: itemsLoading,
    isError: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: queryKeys.menu.items,
    queryFn: async () => {
      const res = await api.get('/menu');
      return unwrapList<MenuItem>(res.data);
    },
  });

  const {
    data: rawCategories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: queryKeys.menu.categories,
    queryFn: async () => {
      const res = await api.get('/menu/categories');
      return unwrapList<Category>(res.data);
    },
  });

  const items: MenuItem[] = useMemo(() => unwrapList<MenuItem>(rawItems), [rawItems]);
  const categories: Category[] = useMemo(() => unwrapList<Category>(rawCategories), [rawCategories]);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<any>();
  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({ control, name: 'sizes' });
  const { fields: addOnFields, append: appendAddOn, remove: removeAddOn } = useFieldArray({ control, name: 'addOns' });

  const openCreate = () => {
    setEditItem(null);
    reset({ isAvailable: true, emoji: '🍔', basePrice: '' });
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    reset({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      basePrice: item.basePrice / 100,
      emoji: item.emoji || '🍔',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      sizes: (item as any).sizes ?? [],
      addOns: (item as any).addOns ?? [],
    });
    setShowForm(true);
  };

  const saveItem = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        basePrice: Math.round(parseFloat(data.basePrice) * 100),
        emoji: data.emoji,
        imageUrl: data.imageUrl,
        isAvailable: Boolean(data.isAvailable),
        // Sizes: [{ label: string, price: number (paisa) }]
        sizes: (data.sizes ?? []).filter((s: any) => s.label?.trim()).map((s: any) => ({
          label: s.label.trim(),
          price: Math.round(parseFloat(s.price || 0) * 100),
        })),
        // Add-ons: [{ label: string, price: number (paisa) }]
        addOns: (data.addOns ?? []).filter((a: any) => a.label?.trim()).map((a: any) => ({
          label: a.label.trim(),
          price: Math.round(parseFloat(a.price || 0) * 100),
        })),
      };
      if (editItem) return api.patch(`/menu/${editItem._id}`, payload);
      return api.post('/menu', payload);
    },
    onSuccess: () => {
      toast.success(editItem ? 'Item updated!' : 'Item created!');
      qc.invalidateQueries({ queryKey: queryKeys.menu.items });
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save item'),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/${id}`),
    onSuccess: () => {
      toast.success('Item deleted');
      qc.invalidateQueries({ queryKey: queryKeys.menu.items });
      setItemToDelete(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete item'),
  });

  const toggleAvailable = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      return api.patch(`/menu/${id}`, { isAvailable: val });
    },
    onMutate: async ({ id, val }) => {
      await qc.cancelQueries({ queryKey: queryKeys.menu.items });
      const previous = qc.getQueryData<MenuItem[]>(queryKeys.menu.items);
      if (previous) {
        qc.setQueryData<MenuItem[]>(
          queryKeys.menu.items,
          previous.map((it) => (it._id === id ? { ...it, isAvailable: val } : it)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.menu.items, context.previous);
      }
      toast.error('Failed to update availability');
    },
    onSuccess: (_, vars) => {
      toast.success(vars.val ? 'Item marked Available' : 'Item marked Sold Out (86)');
      qc.invalidateQueries({ queryKey: queryKeys.menu.items });
    },
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [items, selectedCategory, searchQuery]);

  if (itemsError || categoriesError) {
    return (
      <div className="page">
        <PageHeader title="Menu & Inventory" subtitle="Manage food offerings" />
        <ErrorState
          title="Failed to load menu"
          message="Could not load food catalog. Please retry."
          onRetry={() => {
            refetchItems();
            refetchCategories();
          }}
        />
      </div>
    );
  }

  return (
    <div className="page">
      {/* 1. Header with Tab Switcher */}
      <PageHeader
        title="Menu & Inventory"
        subtitle="Manage food catalog, availability toggle, and pricing"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Items / Categories Segmented Control */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bg-sunken)',
                padding: 3,
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('items')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === 'items' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'items' ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'items' ? 'var(--shadow-1)' : 'none',
                }}
              >
                Food Items
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  background: activeTab === 'categories' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'categories' ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'categories' ? 'var(--shadow-1)' : 'none',
                }}
              >
                Categories
              </button>
            </div>

            {/* Add Item Button */}
            {activeTab === 'items' && isAdmin && (
              <button type="button" onClick={openCreate} className="btn btn-primary" style={{ fontWeight: 700 }}>
                <Icon name="plus" size={16} />
                <span>Add Item</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Items Tab */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Toolbar: Category Chips + Search */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedCategory === 'ALL' ? 'var(--action-bg)' : 'var(--border)',
                  background: selectedCategory === 'ALL' ? 'var(--chip-bg)' : 'var(--bg-surface)',
                  color: selectedCategory === 'ALL' ? 'var(--chip-fg)' : 'var(--text)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                All Items ({items.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setSelectedCategory(cat._id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selectedCategory === cat._id ? 'var(--action-bg)' : 'var(--border)',
                    background: selectedCategory === cat._id ? 'var(--chip-bg)' : 'var(--bg-surface)',
                    color: selectedCategory === cat._id ? 'var(--chip-fg)' : 'var(--text)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.icon || '🍔'} {cat.name}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 240 }}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food item…"
                className="input"
                style={{ paddingLeft: 34, height: 38 }}
              />
              <Icon
                name="search"
                size={16}
                style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-subtle)' }}
              />
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              icon="utensils"
              title="No items found"
              description={searchQuery ? `No menu item matched "${searchQuery}".` : 'No items in this category.'}
              actionLabel={isAdmin ? 'Create New Item' : undefined}
              onAction={isAdmin ? openCreate : undefined}
            />
          ) : (
            <>
              {/* Desktop & Tablet Table (>= 768px) */}
              <div className="table-wrap desktop-menu-table">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Availability</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const category = categories.find((c) => c._id === item.categoryId);
                      return (
                        <tr key={item._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 'var(--r-md)',
                                  background: 'var(--bg-sunken)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 22,
                                  overflow: 'hidden',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <span>{item.emoji || '🍔'}</span>
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {item.description || '—'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {category?.name || 'General'}
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                              {formatMoneyCompact(item.basePrice)}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => toggleAvailable.mutate({ id: item._id, val: !item.isAvailable })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 12px',
                                borderRadius: 'var(--r-pill)',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: '1px solid',
                                background: item.isAvailable ? 'var(--success-bg)' : 'var(--danger-bg)',
                                color: item.isAvailable ? 'var(--success)' : 'var(--danger)',
                                borderColor: item.isAvailable ? 'var(--success)' : 'var(--danger)',
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: 'currentColor',
                                }}
                              />
                              <span>{item.isAvailable ? 'Available' : 'Sold Out (86)'}</span>
                            </button>
                          </td>
                          {isAdmin && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => openEdit(item)}
                                  className="btn btn-ghost btn-sm"
                                  title="Edit Item"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete(item)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--danger)' }}
                                  title="Delete Item"
                                >
                                  <Icon name="trash" size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (< 768px) */}
              <div className="mobile-menu-cards" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
                {filteredItems.map((item) => (
                  <div key={item._id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--r-md)',
                            background: 'var(--bg-sunken)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 24,
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span>{item.emoji || '🍔'}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--action-bg)' }}>
                            {formatMoneyCompact(item.basePrice)}
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" onClick={() => openEdit(item)} className="btn btn-ghost btn-sm">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {item.description || '—'}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => toggleAvailable.mutate({ id: item._id, val: !item.isAvailable })}
                        style={{
                          width: '100%',
                          minHeight: 44,
                          borderRadius: 'var(--r-md)',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          border: '1px solid',
                          background: item.isAvailable ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: item.isAvailable ? 'var(--success)' : 'var(--danger)',
                          borderColor: item.isAvailable ? 'var(--success)' : 'var(--danger)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                        <span>{item.isAvailable ? 'Available (Tap to 86)' : 'Sold Out (Tap to Restock)'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <style>{`
                @media (max-width: 767px) {
                  .desktop-menu-table {
                    display: none !important;
                  }
                  .mobile-menu-cards {
                    display: flex !important;
                  }
                }
              `}</style>
            </>
          )}
        </div>
      )}

      {/* 3. Categories Tab */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Reorder categories to change their display order in the customer menu.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((cat, idx) => (
              <div
                key={cat._id}
                className="card"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name="grip" size={18} style={{ color: 'var(--text-subtle)' }} />
                  <span style={{ fontSize: 20 }}>{cat.icon || '🍔'}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{cat.name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => toast.success(`Moved "${cat.name}" up`)}
                    className="btn btn-ghost btn-sm"
                    aria-label={`Move ${cat.name} up`}
                  >
                    Move Up
                  </button>
                  <button
                    type="button"
                    disabled={idx === categories.length - 1}
                    onClick={() => toast.success(`Moved "${cat.name}" down`)}
                    className="btn btn-ghost btn-sm"
                    aria-label={`Move ${cat.name} down`}
                  >
                    Move Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Item Drawer */}
      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-overlay)',
            zIndex: 'var(--z-dialog)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="animate-slide-in"
            style={{
              width: 'min(440px, 100%)',
              height: '100dvh',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: 'var(--space-5)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editItem ? 'Edit Food Item' : 'New Food Item'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-ghost"
                style={{ width: 36, height: 36, padding: 0 }}
                aria-label="Close form"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit((data) => saveItem.mutate(data))}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              <div className="input-group">
                <label className="label" htmlFor="item-name">Item Name *</label>
                <input
                  id="item-name"
                  className="input"
                  placeholder="e.g. Crispy Zinger Burger"
                  {...register('name', { required: true })}
                />
              </div>

              <div className="input-group">
                <label className="label" htmlFor="item-category">Category *</label>
                <select id="item-category" className="input" {...register('categoryId', { required: true })}>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="label" htmlFor="item-price">Base Price (PKR) *</label>
                <input
                  id="item-price"
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="e.g. 650"
                  {...register('basePrice', { required: true })}
                />
              </div>

              <div className="input-group">
                <label className="label" htmlFor="item-desc">Description</label>
                <textarea
                  id="item-desc"
                  rows={3}
                  className="input"
                  placeholder="Crispy fried chicken fillet with spicy mayo..."
                  {...register('description')}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="input-group">
                <label className="label" htmlFor="item-emoji">Emoji Icon</label>
                <input id="item-emoji" className="input" placeholder="🍔" {...register('emoji')} />
              </div>

              <div className="input-group">
                <label className="label">Item Image</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  onChange={uploadImage}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn btn-ghost"
                  style={{ gap: 8, justifyContent: 'flex-start' }}
                >
                  <Icon name="camera" size={16} />
                  <span>Upload Photo</span>
                </button>
              </div>

              {/* ── Sizes Editor ───────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="label" style={{ margin: 0 }}>Sizes (optional)</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => appendSize({ label: '', price: '' })}
                  >
                    <Icon name="plus" size={14} /> Add Size
                  </button>
                </div>
                {sizeFields.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>
                    No sizes — all orders use the Base Price.
                  </p>
                )}
                {sizeFields.map((field, idx) => (
                  <div key={field.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="input"
                      placeholder="Label (e.g. Large)"
                      style={{ flex: 2 }}
                      {...register(`sizes.${idx}.label`, { required: true })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="PKR"
                      style={{ flex: 1 }}
                      {...register(`sizes.${idx}.price`, { required: true })}
                    />
                    <button
                      type="button"
                      onClick={() => removeSize(idx)}
                      className="btn btn-ghost btn-sm"
                      aria-label={`Remove size ${idx + 1}`}
                      style={{ color: 'var(--danger)', flexShrink: 0 }}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Add-ons Editor ─────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="label" style={{ margin: 0 }}>Add-ons (optional)</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => appendAddOn({ label: '', price: '' })}
                  >
                    <Icon name="plus" size={14} /> Add Option
                  </button>
                </div>
                {addOnFields.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>
                    No add-ons — customer sees no extras at checkout.
                  </p>
                )}
                {addOnFields.map((field, idx) => (
                  <div key={field.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="input"
                      placeholder="Label (e.g. Extra Cheese)"
                      style={{ flex: 2 }}
                      {...register(`addOns.${idx}.label`, { required: true })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="PKR"
                      style={{ flex: 1 }}
                      {...register(`addOns.${idx}.price`, { required: true })}
                    />
                    <button
                      type="button"
                      onClick={() => removeAddOn(idx)}
                      className="btn btn-ghost btn-sm"
                      aria-label={`Remove add-on ${idx + 1}`}
                      style={{ color: 'var(--danger)', flexShrink: 0 }}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveItem.isPending}
                  className="btn btn-primary"
                  style={{ flex: 1, fontWeight: 700 }}
                >
                  {saveItem.isPending ? 'Saving…' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Themed Dialog (F10) */}
      <ConfirmDialog
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) deleteItem.mutate(itemToDelete._id);
        }}
        title={`Delete "${itemToDelete?.name}"?`}
        message="Are you sure you want to delete this menu item? Past completed orders will keep their historical name and line total."
        confirmLabel="Delete Item"
        tone="danger"
        loading={deleteItem.isPending}
      />
    </div>
  );
}
