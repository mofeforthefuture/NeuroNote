import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import type { SignUpForm } from '@/types'

/**
 * Sign Up page
 * Minimal fields, focused on conversion
 */
export function SignUpPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
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
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
        variant: 'error',
      })
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'error',
      })
      return
    }

    setIsLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (authError) {
        console.error('Auth error:', authError)
        
        // Handle rate limiting specifically
        if (authError.message.includes('For security purposes')) {
          const match = authError.message.match(/(\d+) seconds/)
          const seconds = match ? match[1] : '60'
          throw new Error(`Too many signup attempts. Please wait ${seconds} seconds before trying again.`)
        }
        
        throw authError
      }

      if (!authData.user) {
        throw new Error('Failed to create user - no user data returned')
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          is_medical_field: formData.isMedicalField,
          country_code: null, // Will be auto-detected or set later
        })

      if (profileError) {
        console.error('Profile error:', profileError)
        
        // If profile creation fails due to RLS, provide helpful error
        if (profileError.code === '42501') {
          throw new Error(
            'Database configuration error: Missing INSERT policy. ' +
            'Please run the migration: database/migrations/004_add_user_profiles_insert_policy.sql ' +
            'in your Supabase SQL Editor.'
          )
        } else {
          throw profileError
        }
      }

      toast({
        title: 'Account created successfully',
        description: authData.session
          ? 'Welcome to NeuroNote!'
          : 'Please check your email to confirm your account',
        variant: 'success',
      })

      // If session exists, navigate immediately, otherwise wait for email confirmation
      if (authData.session) {
        navigate('/dashboard')
      } else {
        // Show message that email confirmation is needed
        setTimeout(() => {
          navigate('/signin')
        }, 2000)
      }
    } catch (error) {
      console.error('Signup error:', error)
      
      let errorMessage = 'An error occurred'
      let errorTitle = 'Sign up failed'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Provide more helpful error messages
        if (error.message.includes('Failed to fetch')) {
          errorTitle = 'Connection Error'
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.'
        } else if (error.message.includes('User already registered') || error.message.includes('already registered')) {
          errorTitle = 'Account Exists'
          errorMessage = 'An account with this email already exists. Please sign in instead.'
        } else if (error.message.includes('Invalid email')) {
          errorTitle = 'Invalid Email'
          errorMessage = 'Please enter a valid email address.'
        } else if (error.message.includes('Password')) {
          errorTitle = 'Password Error'
          errorMessage = 'Password does not meet requirements. Please use at least 8 characters.'
        } else if (error.message.includes('Too many signup attempts') || error.message.includes('For security purposes')) {
          errorTitle = 'Rate Limit'
          errorMessage = error.message
        } else if (error.message.includes('row-level security')) {
          errorTitle = 'Database Error'
          errorMessage = 'Unable to create profile. Please contact support if this persists.'
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
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

