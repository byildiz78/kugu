import 'swagger-ui-react/swagger-ui.css'

export const metadata = {
  title: 'Air CRM API Documentation',
  description: 'Interactive API documentation for Air CRM',
}

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="api-docs">
      {children}
    </div>
  )
}