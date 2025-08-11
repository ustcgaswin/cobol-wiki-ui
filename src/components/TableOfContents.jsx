import React from 'react';
import { FileText } from 'lucide-react';

const TableOfContents = ({ headings, onTocClick }) => {
  return (
    <aside className="hidden lg:block w-80 border-l border-gray-200 bg-white overflow-auto">
      <div className="sticky top-0 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-gray-600" />
          On This Page
        </h2>
        <nav className="space-y-1">
          {headings.length > 0 ? (
            headings.map((h) => (
              <button
                key={h.id}
                onClick={() => onTocClick(h.id)}
                style={{ paddingLeft: (h.level - 1) * 16 + 8 }}
                className="block w-full text-left text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {h.text}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No headings found</p>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default React.memo(TableOfContents);