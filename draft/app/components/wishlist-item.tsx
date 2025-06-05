// components/wishlist-item.tsx
import React, { useState } from 'react';
import type { WishlistData } from '../types/wishlists';
import styles from './wishlist-item.module.css';

interface WishlistItemProps {
    wishlist: WishlistData;
    isSelected: boolean;
    isEditing: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onSave: (updates: Partial<WishlistData>) => void;
    onCancel: () => void;
    onDelete: () => void;
}

export function WishlistItem({
                                 wishlist,
                                 isSelected,
                                 isEditing,
                                 onSelect,
                                 onEdit,
                                 onSave,
                                 onCancel,
                                 onDelete
                             }: WishlistItemProps) {
    const [editLabel, setEditLabel] = useState(wishlist.label);
    const [editDescription, setEditDescription] = useState(wishlist.description || '');

    const handleSave = () => {
        onSave({
            label: editLabel.trim(),
            description: editDescription.trim() || undefined
        });
    };

    const handleCancel = () => {
        setEditLabel(wishlist.label);
        setEditDescription(wishlist.description || '');
        onCancel();
    };

    if (isEditing) {
        return (
            <div className={styles.editContainer}>
                <div className={styles.editFields}>
                    <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className={styles.editInput}
                        placeholder="Wishlist name..."
                        maxLength={50}
                    />
                    <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className={styles.editInput}
                        placeholder="Description (optional)..."
                        maxLength={100}
                    />
                    <div className={styles.editActions}>
                        <button
                            onClick={handleSave}
                            disabled={!editLabel.trim()}
                            className={`${styles.editButton} ${styles.saveButton}`}
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className={`${styles.editButton} ${styles.cancelButton}`}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const itemClasses = [
        styles.item,
        isSelected ? styles.selected : ''
    ].filter(Boolean).join(' ');

    return (
        <div
            className={itemClasses}
            onClick={onSelect}
        >
            <div className={styles.content}>
                <div className={styles.info}>
                    <div className={styles.header}>
                        <div
                            className={styles.colorDot}
                            style={{ backgroundColor: wishlist.color }}
                        />
                        <h4 className={styles.title}>
                            {wishlist.label}
                        </h4>
                    </div>
                    {wishlist.description && (
                        <p className={styles.description}>
                            {wishlist.description}
                        </p>
                    )}
                    <div className={styles.meta}>
            <span className={styles.playerCount}>
              {wishlist.playerIds.length} player{wishlist.playerIds.length !== 1 ? 's' : ''}
            </span>
                        <span className={styles.date}>
              {new Date(wishlist.updatedAt).toLocaleDateString()}
            </span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className={styles.actionButton}
                        title="Edit wishlist"
                    >
                        <svg className={styles.actionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Delete wishlist"
                    >
                        <svg className={styles.actionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
