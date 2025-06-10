// components/wishlist-form.tsx - FIXED VERSION
import React, { useState } from 'react';
import { useWishlists } from '../lib/use-wishlists';
import type { WishlistData } from '../lib/types';
import styles from './wishlist-form.module.css';

interface CreateWishlistFormProps {
    onSuccess: (newWishlist?: WishlistData) => void;
    onCancel: () => void;
}

export function CreateWishlistForm({ onSuccess, onCancel }: CreateWishlistFormProps) {
    const { addWishlist, availableColors, allColors } = useWishlists();
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [selectedColor, setSelectedColor] = useState(availableColors[0] || Object.values(allColors)[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!label.trim()) return;

        setIsSubmitting(true);
        try {
            await addWishlist({ label: label.trim(), description: description.trim() || undefined, color: selectedColor });
            setLabel('');
            setDescription('');

            // Small delay to ensure React has processed the state update
            setTimeout(() => {
                onSuccess(label.trim());
            }, 100);
        } catch (error) {
            console.error('Error creating wishlist:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fields}>
                <div className={styles.field}>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Wishlist name..."
                        className={styles.input}
                        maxLength={50}
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div className={styles.field}>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)..."
                        className={styles.input}
                        maxLength={100}
                        disabled={isSubmitting}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Color</label>
                    <div className={styles.colorGrid}>
                        {Object.entries(allColors).map(([name, color]) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setSelectedColor(color)}
                                disabled={isSubmitting}
                                className={`${styles.colorButton} ${selectedColor === color ? styles.colorButtonSelected : ''}`}
                                style={{ backgroundColor: color }}
                                title={name}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="submit"
                        disabled={!label.trim() || isSubmitting}
                        className={`${styles.button} ${styles.primaryButton}`}
                    >
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className={`${styles.button} ${styles.secondaryButton}`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
}
