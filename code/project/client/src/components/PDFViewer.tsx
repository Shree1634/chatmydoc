interface PDFViewerProps {
  url: string;
  title?: string;
}

export default function PDFViewer({ url, title }: PDFViewerProps) {
  // Convert Cloudinary raw PDF URL to an embeddable URL
  // Cloudinary raw PDFs can be embedded directly via iframe
  const embedUrl = url.includes('cloudinary.com') && url.includes('/raw/')
    ? url.replace('/raw/', '/image/').replace(/\.pdf$/, '.pdf') // keep pdf
    : url;

  return (
    <div className="pdf-viewer">
      {title && <div className="pdf-viewer-header"><span>{title}</span></div>}
      <iframe
        src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
        className="pdf-iframe"
        title={title || 'PDF Viewer'}
      />
      <div className="pdf-viewer-footer">
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          Open in new tab ↗
        </a>
      </div>

      <style>{`
        .pdf-viewer {
          display: flex; flex-direction: column;
          height: 100%; background: var(--bg-card);
          border-radius: var(--radius-lg); overflow: hidden;
          border: 1px solid var(--border);
        }
        .pdf-viewer-header {
          padding: .75rem 1rem;
          border-bottom: 1px solid var(--border);
          font-size: .85rem; font-weight: 500;
          color: var(--text-secondary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pdf-iframe {
          flex: 1; width: 100%; border: none;
          background: #fff; min-height: 400px;
        }
        .pdf-viewer-footer {
          padding: .65rem 1rem;
          border-top: 1px solid var(--border);
          display: flex; justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
