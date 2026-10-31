import React, { useState, useMemo } from 'react';
import { Pencil, X, Plus } from 'lucide-react';
import { CATEGORIES, MOBILE_KEYPAD_EXPENSE_CATEGORIES } from '../services/storage';

/**
 * MobileCategoryPicker
 * Inline mobile Category picker rendered directly inside the Transaction form
 * (in the yellow marked area under the Category field):
 * - 3-column grid containing 12 categories (Food, Social Life, Pets, Transport, Culture, Household, Apparel, Beauty, Health, Education, Gift, Other)
 * - Header with "Category", pencil icon for adding custom categories, and close icon (✕)
 * - Themed top accent line (red for expense, green for income)
 * - Crisp 1px grid divider lines matching the dark/light system theme
 * - Strictly displayed in Mobile View (<= 768px) only; never alters system colors or desktop layout.
 */
export default function MobileCategoryPicker({
  isOpen,
  onClose,
  category,
  onSelectCategory,
  type = 'expense',
}) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('finance_user_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleAddCustomCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const newId = `custom_${Date.now()}_${trimmed.toLowerCase().replace(/\s+/g, '_')}`;
    const newCat = {
      id: newId,
      name: trimmed,
      icon: '🏷️',
      color: type === 'income' ? '#10B981' : '#F97316',
      type: type,
    };

    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    try {
      localStorage.setItem('finance_user_custom_categories', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save custom category:', err);
    }

    setNewCatName('');
    setIsAddingCustom(false);
    if (onSelectCategory) {
      onSelectCategory(newId);
    }
  };

  const categoriesList = useMemo(() => {
    const baseList = type === 'income' 
      ? CATEGORIES.income 
      : MOBILE_KEYPAD_EXPENSE_CATEGORIES;

    const userCustoms = customCategories.filter(c => (c.type || 'expense') === type);
    return [...baseList, ...userCustoms];
  }, [type, customCategories]);

  if (!isOpen) return null;

  return (
    <div 
      className="mobile-cat-picker-sheet" 
      role="region" 
      aria-label="Category Selection"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top colored accent line (Red for Expense, Green for Income) */}
      <div 
        className="mobile-cat-accent-strip" 
        style={{
          background: type === 'income' 
            ? 'var(--color-income, #10b981)' 
            : 'var(--color-expense, #ef4444)'
        }}
      />

      {/* Header Bar */}
      <div className="mobile-cat-picker-header">
        <div className="mobile-cat-header-left">
          <span className="mobile-cat-title">Category</span>
        </div>

        <div className="mobile-cat-header-right">
          <button
            type="button"
            className={`mobile-cat-btn-icon ${isAddingCustom ? 'active' : ''}`}
            onClick={() => setIsAddingCustom(prev => !prev)}
            title="Add Custom Category"
            aria-label="Add Custom Category"
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            className="mobile-cat-btn-icon"
            onClick={onClose}
            title="Close Category Picker"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Inline Add Custom Category Form */}
      {isAddingCustom && (
        <form onSubmit={handleAddCustomCategory} className="mobile-cat-add-form" autoComplete="off">
          <input
            type="text"
            className="mobile-cat-add-input"
            placeholder="Enter new category name..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          <button type="submit" className="mobile-cat-add-submit">
            <Plus size={15} /> Add
          </button>
        </form>
      )}

      {/* 3-Column Grid of Categories */}
      <div className="mobile-cat-grid">
        {categoriesList.map((cat) => {
          const isSelected = category === cat.id;
          const isOther = cat.id === 'other_exp' || cat.name === 'Other';
          return (
            <button
              key={cat.id}
              type="button"
              className={`mobile-cat-cell ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              title={cat.name}
            >
              {!isOther && cat.icon && (
                <span className="mobile-cat-cell-icon">{cat.icon}</span>
              )}
              <span className={`mobile-cat-cell-name ${isOther ? 'centered' : ''}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
