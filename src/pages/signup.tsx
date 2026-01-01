import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { SignUpForm } from '@/types'

/**
 * Sign Up page
 * Minimal fields, focused on conversion
 */
export function SignUpPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SignUpForm>({
    email: '',
    password: '',
    confirmPassword: '',
    isMedicalField: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      // TODO: Show error toast
      return
    }

    setIsLoading(true)
    
    // TODO: Implement registration
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    navigate('/dashboard')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-semibold">NeuroNote</span>
          </Link>
        </div>

        {/* Sign Up Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Get started with your free 7-day trial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isMedicalField"
                  name="isMedicalField"
                  checked={formData.isMedicalField}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isMedicalField: checked === true }))
                  }
                />
                <Label
                  htmlFor="isMedicalField"
                  className="text-sm font-normal cursor-pointer"
                >
                  Are you in the medical field?
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-foreground-secondary">
              Already have an account?{' '}
              <Link to="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

