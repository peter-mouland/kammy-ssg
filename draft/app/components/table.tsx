import React, { useState, useMemo } from 'react';
import styles from './table.module.css';

// Types
export type SortDirection = 'asc' | 'desc' | null;
export type CellAlignment = 'left' | 'center' | 'right';
export type CellVariant = 'default' | 'numeric' | 'bold' | 'muted' | 'success' | 'warning' | 'error';
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'gray';
export type PositionType = 'gk' | 'def' | 'mid' | 'att';
export type TableSize = 'compact' | 'default' | 'comfortable';

export interface TableColumn<T = any> {
    key: string;
    header: React.ReactNode;
    accessor?: keyof T | ((item: T) => any);
    sortable?: boolean;
    sortKey?: string;
    width?: string | number;
    minWidth?: string | number;
    align?: CellAlignment;
    variant?: CellVariant;
    hideOnMobile?: boolean;
    fixed?: boolean;
    render?: (value: any, item: T, index: number) => React.ReactNode;
}

export interface TableAction<T = any> {
    icon: React.ReactNode;
    label: string;
    onClick: (item: T, index: number) => void;
    variant?: 'default' | 'primary' | 'success' | 'error';
    disabled?: (item: T) => boolean;
    hidden?: (item: T) => boolean;
}

export interface TableProps<T = any> {
    data: T[];
    columns: TableColumn<T>[];
    loading?: boolean;
    empty?: {
        icon?: React.ReactNode;
        title?: string;
        description?: string;
        action?: React.ReactNode;
    };
    size?: TableSize;
    bordered?: boolean;
    shadow?: boolean;
    maxHeight?: string | number;
    sortable?: boolean;
    defaultSort?: {
        key: string;
        direction: SortDirection;
    };
    onSort?: (key: string, direction: SortDirection) => void;
    onRowClick?: (item: T, index: number) => void;
    rowClassName?: (item: T, index: number) => string;
    actions?: TableAction<T>[];
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        onPageChange: (page: number) => void;
        onPageSizeChange?: (pageSize: number) => void;
    };
    className?: string;
    containerClassName?: string;
}

// Helper Components
export function TableBadge({
                               children,
                               variant = 'gray'
                           }: {
    children: React.ReactNode;
    variant?: BadgeVariant
}) {
    return (
        <span className={`${styles.cellBadge} ${styles[variant]}`}>
      {children}
    </span>
    );
}

export function PositionBadge({
                                  position,
                                  children
                              }: {
    position: PositionType;
    children: React.ReactNode
}) {
    return (
        <span className={`${styles.positionBadge} ${styles[position]}`}>
      {children}
    </span>
    );
}

export function RankBadge({
                              rank,
                              isTop = false
                          }: {
    rank: number;
    isTop?: boolean
}) {
    return (
        <span className={`${styles.rankBadge} ${isTop ? styles.top : styles.regular}`}>
      {rank}
    </span>
    );
}

// Main Table Component
export function Table<T = any>({
                                   data,
                                   columns,
                                   loading = false,
                                   empty,
                                   size = 'default',
                                   bordered = true,
                                   shadow = false,
                                   maxHeight,
                                   sortable = true,
                                   defaultSort,
                                   onSort,
                                   onRowClick,
                                   rowClassName,
                                   actions,
                                   pagination,
                                   className = '',
                                   containerClassName = ''
                               }: TableProps<T>) {
    // Sorting state
    const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key || null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSort?.direction || null);

    // Handle sorting
    const handleSort = (column: TableColumn<T>) => {
        if (!column.sortable || !sortable) return;

        const key = column.sortKey || column.key;
        let newDirection: SortDirection = 'asc';

        if (sortKey === key) {
            if (sortDirection === 'asc') {
                newDirection = 'desc';
            } else if (sortDirection === 'desc') {
                newDirection = null;
            }
        }

        setSortKey(newDirection ? key : null);
        setSortDirection(newDirection);
        onSort?.(key, newDirection);
    };

    // Sort data if not externally controlled
    const sortedData = useMemo(() => {
        if (!sortKey || !sortDirection || onSort) {
            return data;
        }

        const column = columns.find(col => (col.sortKey || col.key) === sortKey);
        if (!column) return data;

        return [...data].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (column.accessor) {
                if (typeof column.accessor === 'function') {
                    aValue = column.accessor(a);
                    bValue = column.accessor(b);
                } else {
                    aValue = a[column.accessor];
                    bValue = b[column.accessor];
                }
            } else {
                aValue = a;
                bValue = b;
            }

            // Handle different data types
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            const aStr = String(aValue || '').toLowerCase();
            const bStr = String(bValue || '').toLowerCase();

            if (sortDirection === 'asc') {
                return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
            } else {
                return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
            }
        });
    }, [data, sortKey, sortDirection, columns, onSort]);

    // Get cell value
    const getCellValue = (item: T, column: TableColumn<T>) => {
        if (column.accessor) {
            if (typeof column.accessor === 'function') {
                return column.accessor(item);
            }
            return item[column.accessor];
        }
        return item;
    };

    // Render cell content
    const renderCell = (item: T, column: TableColumn<T>, index: number) => {
        const value = getCellValue(item, column);

        if (column.render) {
            return column.render(value, item, index);
        }

        return value;
    };

    // Get sort icon
    const getSortIcon = (column: TableColumn<T>) => {
        if (!column.sortable || !sortable) return null;

        const key = column.sortKey || column.key;
        if (sortKey !== key) {
            return <span className={styles.sortIcon}>↕</span>;
        }

        if (sortDirection === 'asc') {
            return <span className={styles.sortIcon}>↑</span>;
        } else if (sortDirection === 'desc') {
            return <span className={styles.sortIcon}>↓</span>;
        }

        return <span className={styles.sortIcon}>↕</span>;
    };

    // Container classes
    const containerClasses = [
        styles.tableContainer,
        bordered && styles.bordered,
        shadow && styles.shadow,
        containerClassName
    ].filter(Boolean).join(' ');

    // Table classes
    const tableClasses = [
        styles.table,
        size !== 'default' && styles[size],
        className
    ].filter(Boolean).join(' ');

    // Custom CSS for max height
    const wrapperStyle = maxHeight ? { '--table-max-height': maxHeight } as React.CSSProperties : undefined;

    // Loading state
    if (loading) {
        return (
            <div className={containerClasses}>
                <div className={styles.loading}>
                    <div>Loading...</div>
                </div>
            </div>
        );
    }

    // Empty state
    if (sortedData.length === 0) {
        return (
            <div className={containerClasses}>
                <div className={styles.emptyState}>
                    {empty?.icon && <div className={styles.emptyIcon}>{empty.icon}</div>}
                    {empty?.title && <h3 className={styles.emptyTitle}>{empty.title}</h3>}
                    {empty?.description && <p className={styles.emptyDescription}>{empty.description}</p>}
                    {empty?.action}
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <div className={styles.tableWrapper} style={wrapperStyle}>
                <table className={tableClasses}>
                    <thead>
                    <tr>
                        {columns.map((column) => {
                            const headerClasses = [
                                column.sortable && sortable && styles.sortableHeader,
                                sortKey === (column.sortKey || column.key) && styles.sorted,
                                column.hideOnMobile && styles.hideOnMobile,
                                column.fixed && styles.fixedColumn,
                                column.align && styles[`cell${column.align.charAt(0).toUpperCase() + column.align.slice(1)}`]
                            ].filter(Boolean).join(' ');

                            const headerStyle: React.CSSProperties = {};
                            if (column.width) headerStyle.width = column.width;
                            if (column.minWidth) headerStyle.minWidth = column.minWidth;

                            return (
                                <th
                                    key={column.key}
                                    className={headerClasses}
                                    style={headerStyle}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className={styles.sortIndicator}>
                                        {column.header}
                                        {getSortIcon(column)}
                                    </div>
                                </th>
                            );
                        })}
                        {actions && actions.length > 0 && (
                            <th className={styles.cellCenter}>Actions</th>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {sortedData.map((item, index) => {
                        const rowClasses = [
                            rowClassName?.(item, index)
                        ].filter(Boolean).join(' ');

                        return (
                            <tr
                                key={index}
                                className={rowClasses}
                                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                                style={{ cursor: onRowClick ? 'pointer' : undefined }}
                            >
                                {columns.map((column) => {
                                    const cellClasses = [
                                        column.align && styles[`cell${column.align.charAt(0).toUpperCase() + column.align.slice(1)}`],
                                        column.variant && column.variant !== 'default' && styles[`cell${column.variant.charAt(0).toUpperCase() + column.variant.slice(1)}`],
                                        column.hideOnMobile && styles.hideOnMobile,
                                        column.fixed && styles.fixedColumn
                                    ].filter(Boolean).join(' ');

                                    return (
                                        <td key={column.key} className={cellClasses}>
                                            {renderCell(item, column, index)}
                                        </td>
                                    );
                                })}
                                {actions && actions.length > 0 && (
                                    <td className={styles.cellCenter}>
                                        <div className={styles.cellActions}>
                                            {actions.map((action, actionIndex) => {
                                                if (action.hidden?.(item)) return null;

                                                const isDisabled = action.disabled?.(item);
                                                const buttonClasses = [
                                                    styles.actionButton,
                                                    action.variant && action.variant !== 'default' && styles[action.variant]
                                                ].filter(Boolean).join(' ');

                                                return (
                                                    <button
                                                        key={actionIndex}
                                                        className={buttonClasses}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            action.onClick(item, index);
                                                        }}
                                                        disabled={isDisabled}
                                                        title={action.label}
                                                    >
                                                        {action.icon}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className={styles.paginationContainer}>
                    <div className={styles.paginationInfo}>
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                        {pagination.total} results
                    </div>
                    <div className={styles.paginationControls}>
                        {/* Basic pagination - you can enhance this */}
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                        >
                            Previous
                        </button>
                        <span>Page {pagination.page}</span>
                        <button
                            disabled={pagination.page * pagination.pageSize >= pagination.total}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
