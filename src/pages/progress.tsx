import { Link } from 'react-router-dom'
import { BookOpen, FileText, GraduationCap, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

/**
 * Progress Dashboard page
 * Overview of learning progress and upcoming reviews
 */
export function ProgressPage() {
  // TODO: Fetch progress data from API
  const stats = {
    topicsMastered: 8,
    totalTopics: 24,
    flashcardsReviewed: 156,
    questionsAnswered: 89,
    upcomingReviews: 12,
    studyStreak: 5,
  }

  const masteryPercentage = (stats.topicsMastered / stats.totalTopics) * 100

  const upcomingTopics = [
    { id: '1', title: 'Neurons and Synapses', dueIn: '2 days', progress: 75 },
    { id: '2', title: 'Neurotransmitters', dueIn: '3 days', progress: 60 },
    { id: '3', title: 'Brain Anatomy', dueIn: '5 days', progress: 45 },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Your Progress</h1>
        <p className="mt-2 text-foreground-secondary">
          Track your learning journey and mastery
        </p>
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
            <p className="text-xs text-foreground-secondary">
              of {stats.totalTopics} total topics
            </p>
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
              <CardDescription>
                {stats.upcomingReviews} items scheduled for review
              </CardDescription>
            </div>
            <Button variant="secondary" asChild>
              <Link to="/study/reviews">Review All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingTopics.map((topic) => (
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
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background-tertiary p-4">
              <div className="flex-1">
                <h3 className="font-medium">Introduction to Neuroscience</h3>
                <p className="text-sm text-foreground-secondary">12 topics</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">35%</p>
                  <p className="text-xs text-foreground-secondary">Mastered</p>
                </div>
                <Progress value={35} className="w-24" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background-tertiary p-4">
              <div className="flex-1">
                <h3 className="font-medium">Advanced Neurobiology</h3>
                <p className="text-sm text-foreground-secondary">18 topics</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">22%</p>
                  <p className="text-xs text-foreground-secondary">Mastered</p>
                </div>
                <Progress value={22} className="w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

