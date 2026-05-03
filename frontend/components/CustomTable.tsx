'use client';
import React from "react";

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface CustomTableProps {
    columns: Column[];
    data: any[];
    isLoading?: boolean;
    emptyMessage?: React.ReactNode;
}

export const CustomTable = ({ columns, data, isLoading, emptyMessage = 'No data' }: CustomTableProps) => {
    return (
        <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    {columns.map((column) => (
                        <th className="table-th" key={column.key}>{column.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                    [...Array(8)].map((_, i) => (
                        <tr key={i}>
                            {columns.map((_, j) => (
                                <td key={j} className="table-td">
                                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                </td>
                            ))}
                        </tr>
                    ))
                ) : data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="table-td text-center text-gray-400 py-12">
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    data.map((row, rowIndex) => (
                        <tr key={row.id ?? rowIndex} className="hover:bg-gray-50 transition-colors">
                            {columns.map((column) => (
                                <td key={column.key} className="table-td">
                                    {column.render
                                        ? column.render(row[column.key], row)
                                        : (row[column.key] ?? <span className="text-gray-400">—</span>)
                                    }
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
};