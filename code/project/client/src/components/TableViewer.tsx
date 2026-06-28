import { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, Download, RefreshCw } from 'lucide-react';
import { getTablesApi } from '../api/pdf.api';
import toast from 'react-hot-toast';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface TableViewerProps {
  pdfId: string;
  initialTables?: TableData[];
}

function exportToCSV(table: TableData, index: number) {
  const headers = table.headers ?? [];
  const rows = table.rows ?? [];
  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${c ?? ''}"`).join(','))
    .join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `table-${index + 1}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function TableViewer({ pdfId, initialTables }: TableViewerProps) {
  const [tables, setTables] = useState<TableData[]>(initialTables || []);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTables = async (force = false) => {
    setIsLoading(true);
    const toastId = toast.loading('Extracting tables...');
    try {
      const { data } = await getTablesApi(pdfId, force);
      if (data.success) {
        const found = data.data.tables || [];
        setTables(found);
        toast.success(
          found.length ? `Found ${found.length} table(s)!` : 'No tables found in this document',
          { id: toastId }
        );
      } else toast.error(data.message || 'Failed', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between pb-4 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2 font-semibold text-[#f0f0ff]">
          <Table size={17} className="text-blue-400" />
          Extracted Tables
          {tables.length > 0 && (
            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-semibold">
              {tables.length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {tables.length > 0 && (
            <button
              onClick={() => fetchTables(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#606078] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Force Re-extract
            </button>
          )}
          <button
            onClick={() => fetchTables(false)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><div className="spinner w-3 h-3" /> Extracting...</>
              : <><RefreshCw size={12} /> {tables.length ? 'Re-extract' : 'Extract Tables'}</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4">
        {tables.length > 0 ? (
          tables.map((table, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#16161f] border border-[#2a2a3a] rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#111118] border-b border-[#2a2a3a]">
                <span className="text-xs font-semibold text-[#a0a0b8]">Table {i + 1}</span>
                <button
                  onClick={() => exportToCSV(table, i)}
                  className="flex items-center gap-1 text-xs text-[#606078] hover:text-[#f0f0ff] transition-colors"
                >
                  <Download size={12} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {(table.headers ?? []).length > 0
                        ? (table.headers ?? []).map((h, j) => (
                            <th
                              key={j}
                              className="bg-purple-500/10 text-purple-400 px-4 py-2 text-left font-semibold whitespace-nowrap border-b border-[#2a2a3a]"
                            >
                              {h || '—'}
                            </th>
                          ))
                        : (
                            <th className="bg-purple-500/10 text-purple-400 px-4 py-2 text-left font-semibold border-b border-[#2a2a3a]">
                              No headers
                            </th>
                          )}
                    </tr>
                  </thead>
                  <tbody>
                    {(table.rows ?? []).length > 0
                      ? (table.rows ?? []).map((row, r) => (
                          <tr key={r} className="border-b border-[#2a2a3a] last:border-0 hover:bg-[#1e1e2a] transition-colors">
                            {(row ?? []).map((cell, c) => (
                              <td key={c} className="px-4 py-2 text-[#a0a0b8]">
                                {cell ?? '—'}
                              </td>
                            ))}
                          </tr>
                        ))
                      : (
                          <tr>
                            <td className="px-4 py-3 text-[#606078] text-center" colSpan={Math.max(1, (table.headers ?? []).length)}>
                              No rows
                            </td>
                          </tr>
                        )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
            <Table size={40} className="text-[#2a2a3a]" />
            <div>
              <h3 className="font-semibold text-[#a0a0b8] mb-1">No tables extracted yet</h3>
              <p className="text-sm text-[#606078]">Click "Extract Tables" to find all tables in this document</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
