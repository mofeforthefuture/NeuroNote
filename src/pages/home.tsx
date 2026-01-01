import { FileText, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Home/Dashboard page
 * Shows user's documents and quick actions
 */
export function HomePage() {
  // TODO: Fetch documents from API
  const documents: Array<{
    id: string
    title: string
    topicCount: number
    lastStudied?: string
  }> = []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your Documents</h1>
          <p className="mt-2 text-foreground-secondary">
            Upload PDFs and transform them into study materials
          </p>
        </div>
        <Button asChild>
          <Link to="/documents/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload PDF
          </Link>
        </Button>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-foreground-tertiary" />
            <CardTitle>No documents yet</CardTitle>
            <CardDescription>
              Upload your first PDF to get started with creating study materials
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/documents/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First PDF
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="line-clamp-2">{doc.title}</CardTitle>
                <CardDescription>
                  {doc.topicCount} topics • {doc.lastStudied ? `Last studied ${doc.lastStudied}` : 'Not started'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="w-full">
                  <Link to={`/documents/${doc.id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

