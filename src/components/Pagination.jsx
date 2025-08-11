import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="
          flex items-center justify-center
          w-10 h-10
          
          border border-gray-300
          bg-white
          text-gray-500
          hover:bg-gray-50
          disabled:opacity-50
          disabled:cursor-not-allowed
          transition-colors
          hover:cursor-pointer
        "
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === "..." ? (
            <span className="px-3 py-2 text-gray-500">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page)}
              className={`
                flex items-center justify-center
                w-10 h-10
                
                border
                hover:cursor-pointer
                transition-colors
                ${
                  currentPage === page
                    ? "bg-sky-800 text-white border-sky-900"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="
          flex items-center justify-center
          w-10 h-10
          
          border border-gray-300
          bg-white
          text-gray-500
          hover:bg-gray-50
          disabled:opacity-50
          disabled:cursor-not-allowed
          transition-colors
          hover:cursor-pointer
        "
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Pagination