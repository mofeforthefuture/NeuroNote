import { useEffect, useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDocuments } from '@/lib/documents'
import { getDocumentTopics } from '@/lib/documents'

/**
 * Home/Dashboard page
 * Shows user's documents and quick actions
 */
export function HomePage() {
  const [documents, setDocuments] = useState<Array<{
    id: string
    title: string
    topicCount: number
    lastStudied?: string
    processingStatus: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setIsLoading(true)
    const { documents: docs, error } = await getDocuments()

    if (error) {
      console.error('Failed to load documents:', error)
      setIsLoading(false)
      return
    }

    // Load topic counts for each document
    const docsWithCounts = await Promise.all(
      docs.map(async (doc) => {
        const { topics } = await getDocumentTopics(doc.id)
        return {
          id: doc.id,
          title: doc.title,
          topicCount: topics.length,
          processingStatus: doc.processingStatus,
        }
      })
    )

    setDocuments(docsWithCounts)
    setIsLoading(false)
  }

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
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-foreground-secondary">Loading documents...</p>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
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
                  {doc.processingStatus === 'completed'
                    ? `${doc.topicCount} topics • Ready to study`
                    : doc.processingStatus === 'processing'
                    ? 'Processing...'
                    : doc.processingStatus === 'failed'
                    ? 'Processing failed'
                    : 'Pending processing'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  variant="secondary"
                  className="w-full"
                  disabled={doc.processingStatus !== 'completed'}
                >
                  <Link to={`/documents/${doc.id}`}>
                    {doc.processingStatus === 'completed' ? 'Open' : 'Processing...'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

