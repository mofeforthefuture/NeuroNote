import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { processDocument, type ProcessingProgress } from '@/lib/document-processor'
import { getCurrentUser } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { getCreditBalance, estimateDocumentCredits, type CreditEstimate } from '@/lib/credits'
import { CreditEstimate as CreditEstimateComponent } from '@/components/credits/credit-estimate'
import { CreditBalance } from '@/components/credits/credit-balance'
import { BuyCreditsModal } from '@/components/credits/buy-credits-modal'
import { extractTextFromPDF } from '@/lib/pdf-extractor'

/**
 * Document Upload page
 * Drag-and-drop zone for PDF uploads
 */
export function DocumentUploadPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState('')
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [creditEstimate, setCreditEstimate] = useState<CreditEstimate | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [pageCount, setPageCount] = useState<number | null>(null)

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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find((file) => file.type === 'application/pdf')
    
    if (pdfFile) {
      setSelectedFile(pdfFile)
      
      // Extract page count for estimation
      try {
        const extractResult = await extractTextFromPDF(pdfFile)
        if (extractResult.pageCount) {
          setPageCount(extractResult.pageCount)
        }
      } catch (error) {
        console.error('Failed to extract page count:', error)
        // Use file size as fallback estimate
        setPageCount(Math.max(1, Math.floor(pdfFile.size / 50000))) // Rough estimate
      }
    }
  }, [])

  // Load credit balance on mount
  useEffect(() => {
    loadCreditBalance()
  }, [])

  async function loadCreditBalance() {
    try {
      const user = await getCurrentUser()
      if (!user) return

      const { balance, error } = await getCreditBalance(user.id)
      if (error || !balance) return

      setCreditBalance(balance.balance)
    } catch (error) {
      console.error('Failed to load balance:', error)
    }
  }

  // Estimate credits when file is selected
  useEffect(() => {
    if (selectedFile && pageCount !== null) {
      estimateCredits()
    }
  }, [selectedFile, pageCount])

  async function estimateCredits() {
    if (!selectedFile || pageCount === null) return

    const estimatedTopics = Math.max(1, Math.floor(pageCount / 4))
    const complexity: 'simple' | 'medium' | 'complex' = 
      pageCount > 100 ? 'complex' : 
      pageCount > 50 ? 'medium' : 'simple'

    const estimate = estimateDocumentCredits(pageCount, estimatedTopics, complexity)
    setCreditEstimate(estimate)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      
      // Extract page count for estimation
      try {
        const extractResult = await extractTextFromPDF(file)
        if (extractResult.pageCount) {
          setPageCount(extractResult.pageCount)
        }
      } catch (error) {
        console.error('Failed to extract page count:', error)
        // Use file size as fallback estimate
        setPageCount(Math.max(1, Math.floor(file.size / 50000))) // Rough estimate: 50KB per page
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    // Check if user has enough credits
    if (creditBalance !== null && creditEstimate && creditBalance < creditEstimate.total) {
      toast({
        title: 'Insufficient credits',
        description: `You need ${creditEstimate.total - creditBalance} more credits to process this document.`,
        variant: 'error',
      })
      setShowBuyModal(true)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setProcessingMessage('')

    try {
      // Get current user
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('You must be signed in to upload documents')
      }

      // Process document with progress updates
      const result = await processDocument(selectedFile, user.id, (progress: ProcessingProgress) => {
        setUploadProgress(progress.progress)
        setProcessingMessage(progress.message)

        if (progress.error) {
          throw new Error(progress.error)
        }
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Reload balance after processing
      await loadCreditBalance()

      // Success - navigate to document
      toast({
        title: 'Document processed successfully',
        description: 'Your study materials are ready!',
        variant: 'success',
      })

      navigate(`/documents/${result.documentId}`)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'error',
      })
      setIsUploading(false)
      setUploadProgress(0)
      setProcessingMessage('')
      
      // Reload balance in case of refund
      await loadCreditBalance()
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setCreditEstimate(null)
    setPageCount(null)
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

      {/* Credit Balance */}
      {creditBalance !== null && (
        <CreditBalance
          showDetails={false}
          onBuyClick={() => setShowBuyModal(true)}
        />
      )}

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
                  <span className="text-foreground-secondary">
                    {processingMessage || 'Processing...'}
                  </span>
                  <span className="text-foreground-secondary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
                <p className="text-xs text-foreground-tertiary">
                  This may take a few minutes. Please don't close this page.
                </p>
              </div>
            )}

            {!isUploading && (
              <>
                {creditEstimate && creditBalance !== null && (
                  <div className="mt-6">
                    <CreditEstimateComponent
                      estimate={creditEstimate}
                      currentBalance={creditBalance}
                    />
                  </div>
                )}
                <div className="mt-6 flex gap-4">
                  <Button 
                    onClick={handleUpload} 
                    className="flex-1"
                    disabled={creditBalance !== null && creditEstimate !== null && creditBalance < creditEstimate.total}
                  >
                    Upload and Process
                  </Button>
                  <Button variant="secondary" onClick={handleRemove}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        open={showBuyModal}
        onOpenChange={setShowBuyModal}
        onPurchase={async () => {
          await loadCreditBalance()
          setShowBuyModal(false)
        }}
      />
    </div>
  )
}

