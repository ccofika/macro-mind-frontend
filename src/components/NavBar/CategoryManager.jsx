import React, { useState } from 'react';
import './CategoryManager.css';

const CategoryManager = ({ categories, onUpdateCategories, onClose }) => {
  const [localCategories, setLocalCategories] = useState([...categories]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const iconOptions = [
    { value: 'document', label: '📄', name: 'Document' },
    { value: 'link', label: '🔗', name: 'Link' },
    { value: 'grid', label: '⚏', name: 'Grid' },
    { value: 'folder', label: '📁', name: 'Folder' },
    { value: 'star', label: '⭐', name: 'Star' },
    { value: 'tag', label: '🏷️', name: 'Tag' },
    { value: 'bookmark', label: '🔖', name: 'Bookmark' },
    { value: 'tool', label: '🔧', name: 'Tool' }
  ];

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      icon: 'folder',
      isDefault: false
    };
    
    setLocalCategories([...localCategories, newCategory]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (categoryId) => {
    const category = localCategories.find(cat => cat.id === categoryId);
    if (category?.isDefault) {
      alert('Cannot delete default categories');
      return;
    }
    
    setLocalCategories(localCategories.filter(cat => cat.id !== categoryId));
  };

  const handleUpdateCategory = (categoryId, updates) => {
    setLocalCategories(localCategories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
  };

  const handleSave = async () => {
    try {
      await onUpdateCategories(localCategories);
      onClose();
    } catch (error) {
      console.error('Error saving categories:', error);
      alert('Failed to save categories. Please try again.');
    }
  };

  // Handle input key events to prevent shortcuts
  const handleInputKeyDown = (e) => {
    e.stopPropagation();
  };

  const getIconDisplay = (iconValue) => {
    const icon = iconOptions.find(opt => opt.value === iconValue);
    return icon ? icon.label : '📁';
  };

  return (
    <div className="category-manager-overlay">
      <div className="category-manager">
        <div className="category-manager-header">
          <h3>Manage Categories</h3>
          <button className="close-button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="category-manager-content">
          {/* Add new category */}
          <div className="add-category-section">
            <h4>Add New Category</h4>
            <div className="add-category-form">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  handleInputKeyDown(e);
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
                placeholder="Enter category name"
                className="category-name-input"
              />
              <button 
                onClick={handleAddCategory}
                className="add-category-button"
                disabled={!newCategoryName.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add
              </button>
            </div>
          </div>

          {/* Existing categories */}
          <div className="existing-categories-section">
            <h4>Existing Categories</h4>
            <div className="categories-list">
              {localCategories.map(category => (
                <div key={category.id} className="category-item">
                  <div className="category-icon-selector">
                    <select
                      value={category.icon}
                      onChange={(e) => handleUpdateCategory(category.id, { icon: e.target.value })}
                      onKeyDown={handleInputKeyDown}
                      className="icon-select"
                    >
                      {iconOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                    onKeyDown={handleInputKeyDown}
                    className="category-name-edit"
                    disabled={category.isDefault}
                  />
                  
                  {category.isDefault && (
                    <span className="default-badge">Default</span>
                  )}
                  
                  {!category.isDefault && (
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="delete-category-button"
                      title="Delete category"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="category-manager-footer">
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button onClick={handleSave} className="save-button">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager; 