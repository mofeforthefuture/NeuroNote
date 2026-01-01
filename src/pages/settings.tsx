import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/**
 * Settings page
 * User profile, preferences, subscription, and account management
 */
export function SettingsPage() {
  const [profile, setProfile] = useState({
    displayName: 'John Doe',
    email: 'john@example.com',
    isMedicalField: true,
    timezone: 'UTC',
  })

  const [preferences, setPreferences] = useState({
    theme: 'dark',
    fontSize: 'medium',
    notifications: true,
    emailUpdates: false,
  })

  const handleProfileChange = (field: string, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handlePreferenceChange = (field: string, value: string | boolean) => {
    setPreferences((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-foreground-secondary">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) => handleProfileChange('displayName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={profile.timezone}
                  onChange={(e) => handleProfileChange('timezone', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isMedicalField"
                  checked={profile.isMedicalField}
                  onCheckedChange={(checked) =>
                    handleProfileChange('isMedicalField', checked === true)
                  }
                />
                <Label htmlFor="isMedicalField" className="cursor-pointer">
                  I am in the medical field
                </Label>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Study Preferences</CardTitle>
              <CardDescription>Customize your study experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-foreground-secondary">
                      Choose your preferred color theme
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={preferences.theme === 'dark' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => handlePreferenceChange('theme', 'dark')}
                    >
                      Dark
                    </Button>
                    <Button
                      variant={preferences.theme === 'light' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => handlePreferenceChange('theme', 'light')}
                    >
                      Light
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Font Size</Label>
                    <p className="text-sm text-foreground-secondary">
                      Adjust text size for readability
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map((size) => (
                      <Button
                        key={size}
                        variant={preferences.fontSize === size ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => handlePreferenceChange('fontSize', size)}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications</Label>
                    <p className="text-sm text-foreground-secondary">
                      Receive notifications for reviews and updates
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.notifications}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange('notifications', checked === true)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Updates</Label>
                    <p className="text-sm text-foreground-secondary">
                      Receive email updates about your progress
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.emailUpdates}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange('emailUpdates', checked === true)
                    }
                  />
                </div>
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background-tertiary p-4">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="text-sm text-foreground-secondary">
                    {profile.isMedicalField ? 'Medical Professional' : 'Base Plan'}
                  </p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-secondary">Next billing date</span>
                  <span className="font-medium">March 15, 2024</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-secondary">Amount</span>
                  <span className="font-medium">₦5,000/month</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Button variant="secondary" className="w-full">
                  Update Payment Method
                </Button>
                <Button variant="secondary" className="w-full">
                  View Billing History
                </Button>
                <Button variant="destructive" className="w-full">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input id="confirmNewPassword" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

