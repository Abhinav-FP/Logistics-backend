import React from 'react'

export default function Error() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-6xl font-bold text-red-500 mb-4">404</div>
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-[#1C5FE8] text-white font-medium rounded-md shadow hover:bg-blue-600 transition"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  )
}
