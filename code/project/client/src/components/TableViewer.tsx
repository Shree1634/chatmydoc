import { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, Download, RefreshCw } from 'lucide-react';
import { getPDFTablesApi } from '../api/pdf.api';
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
  const rows = [table.headers, ...table.rows];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `table-${index + 1}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TableViewer({ pdfId, initialTables }: TableViewerProps) {
  const [tables, setTables] = useState<TableData[]>(initialTables || []);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTables = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Extracting tables...');
    try {
      const { data } = await getPDFTablesApi(pdfId);
      if (data.success) {
        setTables(data.data.tables || []);
        toast.success(
          data.data.tables?.length ? `Found ${data.data.tables.length} table(s)!` : 'No tables found in this PDF',
          { id: toastId }
        );
      } else {
        toast.error(data.message || 'Failed to extract tables', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to extract tables', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="table-viewer">
      <div className="table-viewer-header">
        <div className="table-viewer-title">
          <Table size={18} color="var(--accent-blue)" />
          <span>Extracted Tables</span>
          {tables.length > 0 && (
            <span className="badge badge-blue">{tables.length}</span>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchTables} disabled={isLoading}>
          {isLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Extracting...</> : <><RefreshCw size={14} /> {tables.length ? 'Re-extract' : 'Extract Tables'}</>}
        </button>
      </div>

      <div className="tables-content">
        {tables.length > 0 ? (
          tables.map((table, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * .1 }}
              className="table-card"
            >
              <div className="table-card-header">
                <span className="table-label">Table {i + 1}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => exportToCSV(table, i)}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      {table.headers.map((h, j) => <th key={j}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => <td key={c}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <Table size={40} style={{ margin: '0 auto 1rem', opacity: .3 }} />
            <h3>No tables extracted yet</h3>
            <p>Click "Extract Tables" to find and display all tables in this document</p>
          </div>
        )}
      </div>

      <style>{`
        .table-viewer { height: 100%; display: flex; flex-direction: column; gap: 1rem; }
        .table-viewer-header {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 1rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .table-viewer-title { display: flex; align-items: center; gap: .5rem; font-weight: 600; font-size: 1rem; }
        .tables-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem; }
        .table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .table-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: .75rem 1rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border);
        }
        .table-label { font-size: .85rem; font-weight: 600; color: var(--text-secondary); }
        .table-scroll { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
        .data-table th {
          background: rgba(139,92,246,.1); color: var(--accent-purple);
          padding: .6rem 1rem; text-align: left; font-weight: 600;
          white-space: nowrap; border-bottom: 1px solid var(--border);
        }
        .data-table td { padding: .55rem 1rem; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:nth-child(even) td { background: rgba(255,255,255,.02); }
        .data-table tr:hover td { background: var(--bg-card-hover); }
      `}</style>
    </div>
  );
}
