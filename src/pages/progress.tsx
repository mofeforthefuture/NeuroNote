import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, GraduationCap, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { getDocuments } from '@/lib/documents'

interface ProgressStats {
  topicsMastered: number
  totalTopics: number
  flashcardsReviewed: number
  questionsAnswered: number
  upcomingReviews: number
  studyStreak: number
}

interface UpcomingReview {
  id: string
  title: string
  dueIn: string
  progress: number
}

/**
 * Progress Dashboard page
 * Overview of learning progress and upcoming reviews
 */
export function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats>({
    topicsMastered: 0,
    totalTopics: 0,
    flashcardsReviewed: 0,
    questionsAnswered: 0,
    upcomingReviews: 0,
    studyStreak: 0,
  })
  const [upcomingTopics, setUpcomingTopics] = useState<UpcomingReview[]>([])
  const [documentProgress, setDocumentProgress] = useState<
    Array<{ title: string; topics: number; mastered: number }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    try {
      setIsLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Get all documents
      const { documents } = await getDocuments()

      // Get all topics for user's documents
      const documentIds = documents.map(d => d.id)
      const { data: topics } = await supabase
        .from('topics')
        .select('id, document_id, title')
        .in('document_id', documentIds)

      const totalTopics = topics?.length || 0

      // Get all flashcards and questions for these topics
      const topicIds = topics?.map(t => t.id) || []

      const [flashcardsResult, questionsResult] = await Promise.all([
        topicIds.length > 0
          ? supabase.from('flashcards').select('id, topic_id').in('topic_id', topicIds)
          : { data: [] },
        topicIds.length > 0
          ? supabase.from('exam_questions').select('id, topic_id').in('topic_id', topicIds)
          : { data: [] },
      ])

      // Create maps for quick lookup
      const flashcardToTopic = new Map((flashcardsResult.data || []).map(f => [f.id, f.topic_id]))
      const questionToTopic = new Map((questionsResult.data || []).map(q => [q.id, q.topic_id]))

      // Get user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)

      // Calculate stats
      const flashcardsReviewed =
        progressData?.filter(p => p.content_type === 'flashcard').length || 0
      const questionsAnswered =
        progressData?.filter(p => p.content_type === 'exam_question').length || 0

      // Get topics with mastery >= 80%
      const masteredTopicIds = new Set<string>()
      progressData?.forEach(p => {
        if (p.mastery_level >= 80) {
          let topicId: string | undefined
          if (p.content_type === 'flashcard') {
            topicId = flashcardToTopic.get(p.content_id)
          } else if (p.content_type === 'exam_question') {
            topicId = questionToTopic.get(p.content_id)
          }
          if (topicId) {
            masteredTopicIds.add(topicId)
          }
        }
      })

      // Get upcoming reviews (items with next_review_at in the next 7 days)
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcoming =
        progressData?.filter(p => {
          if (!p.next_review_at) return false
          const reviewDate = new Date(p.next_review_at)
          return reviewDate >= now && reviewDate <= nextWeek
        }) || []

      // Group upcoming reviews by topic
      const upcomingByTopic = new Map<string, { count: number; earliest: Date; topicId: string }>()
      upcoming.forEach(p => {
        if (!p.next_review_at) return

        let topicId: string | undefined
        if (p.content_type === 'flashcard') {
          topicId = flashcardToTopic.get(p.content_id)
        } else if (p.content_type === 'exam_question') {
          topicId = questionToTopic.get(p.content_id)
        }

        if (topicId) {
          const existing = upcomingByTopic.get(topicId)
          const reviewDate = new Date(p.next_review_at)
          if (!existing || reviewDate < existing.earliest) {
            upcomingByTopic.set(topicId, {
              count: (existing?.count || 0) + 1,
              earliest: reviewDate,
              topicId,
            })
          }
        }
      })

      // Format upcoming topics
      const upcomingTopicsList: UpcomingReview[] = Array.from(upcomingByTopic.entries())
        .map(([topicId, data]) => {
          const topic = topics?.find(t => t.id === topicId)
          if (!topic) return null

          const daysUntil = Math.ceil(
            (data.earliest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
          const dueIn =
            daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`

          // Calculate progress for this topic
          const topicFlashcards = (flashcardsResult.data || [])
            .filter(f => f.topic_id === topicId)
            .map(f => f.id)
          const topicQuestions = (questionsResult.data || [])
            .filter(q => q.topic_id === topicId)
            .map(q => q.id)
          const topicContentIds = [...topicFlashcards, ...topicQuestions]
          const topicProgress =
            progressData?.filter(
              p => topicContentIds.includes(p.content_id) && p.mastery_level >= 80
            ).length || 0
          const topicTotal = topicContentIds.length
          const progress = topicTotal > 0 ? Math.round((topicProgress / topicTotal) * 100) : 0

          return {
            id: topicId,
            title: topic.title,
            dueIn,
            progress,
          }
        })
        .filter((t): t is UpcomingReview => t !== null)
        .slice(0, 5)

      // Calculate document-level progress
      const docProgress = documents.map(doc => {
        const docTopics = topics?.filter(t => t.document_id === doc.id) || []
        const docTopicIds = docTopics.map(t => t.id)
        const docFlashcardIds = (flashcardsResult.data || [])
          .filter(f => docTopicIds.includes(f.topic_id))
          .map(f => f.id)
        const docQuestionIds = (questionsResult.data || [])
          .filter(q => docTopicIds.includes(q.topic_id))
          .map(q => q.id)
        const docContentIds = [...docFlashcardIds, ...docQuestionIds]
        const mastered =
          progressData?.filter(p => docContentIds.includes(p.content_id) && p.mastery_level >= 80)
            .length || 0
        const total = docContentIds.length
        const masteredPercent = total > 0 ? Math.round((mastered / total) * 100) : 0

        return {
          title: doc.title,
          topics: docTopics.length,
          mastered: masteredPercent,
        }
      })

      // Calculate study streak (simplified - count consecutive days with reviews)
      let studyStreak = 0
      if (progressData && progressData.length > 0) {
        const reviewDates = progressData
          .map(p => (p.last_reviewed_at ? new Date(p.last_reviewed_at).toDateString() : null))
          .filter((d): d is string => d !== null)
        const uniqueDates = [...new Set(reviewDates)].sort().reverse()

        let currentStreak = 0
        for (let i = 0; i < uniqueDates.length; i++) {
          const date = new Date(uniqueDates[i])
          const expectedDate = new Date()
          expectedDate.setDate(expectedDate.getDate() - i)
          if (date.toDateString() === expectedDate.toDateString()) {
            currentStreak++
          } else {
            break
          }
        }
        studyStreak = currentStreak
      }

      setStats({
        topicsMastered: masteredTopicIds.size,
        totalTopics,
        flashcardsReviewed,
        questionsAnswered,
        upcomingReviews: upcoming.length,
        studyStreak,
      })
      setUpcomingTopics(upcomingTopicsList)
      setDocumentProgress(docProgress)
    } catch (error) {
      console.error('Failed to load progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const masteryPercentage =
    stats.totalTopics > 0 ? (stats.topicsMastered / stats.totalTopics) * 100 : 0

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-foreground-secondary">Loading progress...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Your Progress</h1>
        <p className="mt-2 text-foreground-secondary">Track your learning journey and mastery</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics Mastered</CardTitle>
            <GraduationCap className="h-4 w-4 text-foreground-tertiary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topicsMastered}</div>
            <p className="text-xs text-foreground-secondary">of {stats.totalTopics} total topics</p>
            <Progress value={masteryPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flashcards Reviewed</CardTitle>
            <BookOpen className="h-4 w-4 text-foreground-tertiary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flashcardsReviewed}</div>
            <p className="text-xs text-foreground-secondary">total reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
            <FileText className="h-4 w-4 text-foreground-tertiary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.questionsAnswered}</div>
            <p className="text-xs text-foreground-secondary">practice questions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground-tertiary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studyStreak}</div>
            <p className="text-xs text-foreground-secondary">days in a row</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Reviews</CardTitle>
              <CardDescription>{stats.upcomingReviews} items scheduled for review</CardDescription>
            </div>
            <Button variant="secondary" asChild>
              <Link to="/study/reviews">Review All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingTopics.map(topic => (
              <div
                key={topic.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background-tertiary p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{topic.title}</h3>
                    <Badge variant="outline">{topic.dueIn}</Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-secondary">Progress</span>
                      <span className="text-foreground-secondary">{topic.progress}%</span>
                    </div>
                    <Progress value={topic.progress} />
                  </div>
                </div>
                <Button variant="secondary" size="sm" asChild className="ml-4">
                  <Link to={`/topics/${topic.id}`}>Study</Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mastery Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Mastery Overview</CardTitle>
          <CardDescription>Your progress across all documents</CardDescription>
        </CardHeader>
        <CardContent>
          {documentProgress.length === 0 ? (
            <p className="text-center text-foreground-secondary py-8">
              No documents yet. Upload a document to start tracking your progress!
            </p>
          ) : (
            <div className="space-y-4">
              {documentProgress.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background-tertiary p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{doc.title}</h3>
                    <p className="text-sm text-foreground-secondary">{doc.topics} topics</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{doc.mastered}%</p>
                      <p className="text-xs text-foreground-secondary">Mastered</p>
                    </div>
                    <Progress value={doc.mastered} className="w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
