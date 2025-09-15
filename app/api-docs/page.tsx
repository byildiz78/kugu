'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => setSpec(data))
      .catch(err => console.error('Error loading API spec:', err))
  }, [])

  if (!spec) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">🚀 Air CRM API Documentation</h1>
          <p className="text-blue-100">
            Interactive API documentation with Bearer Token authentication support
          </p>
          <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
            <h3 className="font-semibold mb-2">🔐 Authentication Methods:</h3>
            <div className="space-y-1 text-sm">
              <div>• <strong>Bearer Token:</strong> air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c</div>
              <div>• <strong>Session Auth:</strong> Login through web interface</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <SwaggerUI 
          spec={spec}
          docExpansion="list"
          defaultModelExpandDepth={2}
          tryItOutEnabled={true}
          supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
          plugins={[]}
          requestInterceptor={(request: any) => {
            // Log requests for debugging
            console.log('Swagger Request:', request)
            return request
          }}
          responseInterceptor={(response: any) => {
            // Log responses for debugging
            console.log('Swagger Response:', response)
            return response
          }}
        />
      </div>
    </div>
  )
}