import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table = ({ children, className = '', ...props }: TableProps) => (
  <div className="relative w-full overflow-auto rounded-xl border border-white/10 bg-black/20 backdrop-blur-md">
    <table className={`w-full text-sm text-left ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const THead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <thead className={`text-xs uppercase bg-white/5 text-white/70 border-b border-white/10 ${className}`}>
    {children}
  </thead>
);

export const TBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tbody className={`divide-y divide-white/5 ${className}`}>
    {children}
  </tbody>
);

export const TR = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`transition-colors hover:bg-white/5 ${className}`} {...props}>
    {children}
  </tr>
);

export const TH = ({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={`px-4 py-3 font-medium ${className}`} {...props}>
    {children}
  </th>
);

export const TD = ({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-4 py-3 ${className}`} {...props}>
    {children}
  </td>
);
