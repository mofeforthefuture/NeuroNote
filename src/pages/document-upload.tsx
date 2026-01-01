import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

/**
 * Document Upload page
 * Drag-and-drop zone for PDF uploads
 */
export function DocumentUploadPage() {
  const navigate = useNavigate()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find((file) => file.type === 'application/pdf')
    
    if (pdfFile) {
      setSelectedFile(pdfFile)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    // TODO: Implement actual file upload
    await new Promise((resolve) => setTimeout(resolve, 2000))

    clearInterval(interval)
    setUploadProgress(100)

    // Navigate to processing page
    setTimeout(() => {
      navigate(`/documents/processing?file=${encodeURIComponent(selectedFile.name)}`)
    }, 500)
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setUploadProgress(0)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Upload Document</h1>
        <p className="mt-2 text-foreground-secondary">
          Upload a PDF to transform it into study materials
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="border-dashed">
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-12 transition-colors ${
              isDragging
                ? 'bg-background-tertiary border-primary'
                : 'bg-background-secondary'
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className={`mb-4 rounded-full p-6 transition-colors ${
                  isDragging ? 'bg-primary/20' : 'bg-background-tertiary'
                }`}
              >
                <Upload
                  className={`h-12 w-12 transition-colors ${
                    isDragging ? 'text-primary' : 'text-foreground-tertiary'
                  }`}
                />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {isDragging ? 'Drop your PDF here' : 'Drag and drop your PDF'}
              </h3>
              <p className="mb-6 text-foreground-secondary">
                or click to browse files
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select PDF File
                </label>
              </Button>
              <p className="mt-4 text-sm text-foreground-tertiary">
                Maximum file size: 50MB
              </p>
            </div>
          </div>
        ) : (
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-background-tertiary p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-foreground-secondary">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-secondary">Uploading...</span>
                  <span className="text-foreground-secondary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {!isUploading && (
              <div className="mt-6 flex gap-4">
                <Button onClick={handleUpload} className="flex-1">
                  Upload and Process
                </Button>
                <Button variant="secondary" onClick={handleRemove}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

