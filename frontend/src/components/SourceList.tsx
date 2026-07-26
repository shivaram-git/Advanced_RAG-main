import React, { useState } from 'react';

interface Source {
  document_name: string;
  page?: number;
  pdf_url?: string;
}

interface SourceListProps {
  sources: Source[];
  theme?: 'light' | 'dark';
  onViewPdf?: (source: Source) => void;
}

const SourceList: React.FC<SourceListProps> = ({ sources, theme = 'light', onViewPdf }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const visibleSources = isExpanded ? sources : sources.slice(0, 3);
  const hasMore = sources.length > 3;

  return (
    <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
      <button
        onClick={() => setIsExpanded((p) => !p)}
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2.5 transition-colors ${
          theme === 'dark'
            ? 'text-indigo-400 hover:text-indigo-300'
            : 'text-indigo-600 hover:text-indigo-700'
        }`}
        aria-expanded={isExpanded}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Sources ({sources.length})
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="flex flex-wrap gap-2">
        {visibleSources.map((source, index) => {
          const isClickable = !!(source.pdf_url && onViewPdf);
          const ChipTag = isClickable ? 'button' : 'div';
          const chipProps = isClickable
            ? { onClick: () => onViewPdf?.(source) }
            : {};
          return (
            <ChipTag
              key={index}
              {...chipProps}
              className={`source-chip inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs border ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              } ${
                theme === 'dark'
                  ? 'bg-indigo-950/50 border-indigo-800/50 text-indigo-300 hover:bg-indigo-900/50'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
              title={`${source.document_name}${source.page ? ` — page ${source.page}` : ''}${isClickable ? '\nClick to view PDF' : ''}`}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="font-medium truncate max-w-[140px]">{source.document_name}</span>
              {source.page && (
                <span className={`flex-shrink-0 ${theme === 'dark' ? 'text-indigo-500' : 'text-indigo-400'}`}>
                  p.{source.page}
                </span>
              )}
              {isClickable && (
                <svg className={`w-3 h-3 flex-shrink-0 ${theme === 'dark' ? 'text-indigo-500' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </ChipTag>
          );
        })}

        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
            }`}
          >
            +{sources.length - 3} more
          </button>
        )}
      </div>
    </div>
  );
};

export default SourceList;
