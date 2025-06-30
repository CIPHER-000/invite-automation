import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Mail, Users, BarChart3, Shield } from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/shady5_no_bg_cropped_strict_1751311214067.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img src={logoPath} alt="Logo" className="h-20 w-auto" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                System Active
              </Badge>
              <Link href="/dashboard">
                <Button>Access Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Automate Your Calendar Invitations
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your Google Sheets into powerful calendar invite campaigns. 
            Intelligently schedule, send, and track personalized meeting invitations 
            with advanced load balancing and real-time analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Launch Dashboard
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Automation Features
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to scale your calendar invite campaigns
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Intelligent time slot management with 30-minute gaps and timezone awareness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Dynamic time slot allocation</li>
                  <li>• Timezone-aware scheduling</li>
                  <li>• Configurable intervals</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Multi-Account Support</CardTitle>
                <CardDescription>
                  Load balance across multiple Google accounts with health monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Multiple account rotation</li>
                  <li>• Health score monitoring</li>
                  <li>• Automatic cooldown periods</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Mail className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>Google Sheets Integration</CardTitle>
                <CardDescription>
                  Read prospect data directly from Google Sheets with real-time updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Direct sheet data reading</li>
                  <li>• Status tracking updates</li>
                  <li>• Merge field support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle>Real-Time Analytics</CardTitle>
                <CardDescription>
                  Track campaign performance with detailed metrics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Acceptance rate tracking</li>
                  <li>• Campaign performance metrics</li>
                  <li>• Activity monitoring</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle>Service Account Security</CardTitle>
                <CardDescription>
                  Secure authentication using Google Service Account credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• No OAuth restrictions</li>
                  <li>• Enterprise-grade security</li>
                  <li>• Persistent authentication</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="w-8 h-8 text-teal-600 mb-2" />
                <CardTitle>Automated Processing</CardTitle>
                <CardDescription>
                  Background queue processing with confirmation emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Background job processing</li>
                  <li>• Automatic confirmation emails</li>
                  <li>• Queue status monitoring</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Automate Your Calendar Campaigns?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Get started and transform how you manage calendar invitations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Access Dashboard
              </Button>
            </Link>
            <Link href="/service-account-setup">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Setup Service Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Shady 5.0</h3>
            <p className="text-gray-400">
              Advanced Calendar Invite Automation System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}