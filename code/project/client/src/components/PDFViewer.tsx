interface PDFViewerProps {
  url: string;
  title?: string;
}

export default function PDFViewer({ url, title }: PDFViewerProps) {
  return (
    <div className="flex flex-col h-full bg-[#16161f] border border-[#2a2a3a] rounded-2xl overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-[#2a2a3a] text-sm font-medium text-[#a0a0b8] truncate flex-shrink-0">
          {title}
        </div>
      )}
      <iframe
        src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
        className="flex-1 w-full border-none bg-white min-h-0"
        title={title || 'PDF Viewer'}
      />
      <div className="px-4 py-2 border-t border-[#2a2a3a] flex justify-end flex-shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e1e2a] border border-[#2a2a3a] text-[#a0a0b8] hover:border-[#3a3a4a] hover:text-[#f0f0ff] transition-colors"
        >
          Open in new tab ↗
        </a>
      </div>
    </div>
  );
}
