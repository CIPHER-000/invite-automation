import { useState } from "react";
import { Search, ChevronDown, ChevronRight, Mail, Play, Book, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'getting-started' | 'campaigns' | 'inboxes' | 'scheduling' | 'troubleshooting';
  tags: string[];
}

interface Guide {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'campaigns' | 'inboxes' | 'scheduling' | 'troubleshooting';
  steps: string[];
}

const faqs: FAQ[] = [
  {
    id: 'getting-started-1',
    question: 'How do I get started with Shady 5.0?',
    answer: 'Start by connecting your Google account through the Inbox Setup page. Then create your first campaign by uploading a CSV file with your prospect data. The system will automatically schedule and send calendar invitations based on your preferences.',
    category: 'getting-started',
    tags: ['setup', 'google', 'campaigns']
  },
  {
    id: 'getting-started-2',
    question: 'What file format should I use for my prospect data?',
    answer: 'Upload a CSV file with columns for Name, Email, Company, and any custom fields you want to use in your templates. The system supports merge fields like {{name}}, {{email}}, {{company}}, and {{sender_name}}.',
    category: 'getting-started',
    tags: ['csv', 'upload', 'merge-fields']
  },
  {
    id: 'campaigns-1',
    question: 'How do I create a new campaign?',
    answer: 'Go to the Campaigns page and click "Create Campaign". Fill in your campaign details, upload your CSV file, customize your email template, and select which inboxes to use. The system will automatically start scheduling invitations.',
    category: 'campaigns',
    tags: ['create', 'template', 'scheduling']
  },
  {
    id: 'campaigns-2',
    question: 'Can I pause or stop a campaign?',
    answer: 'Yes, you can pause or stop any campaign from the Campaigns page. Pausing will stop new invitations from being sent but keep existing scheduled ones. Stopping will cancel all pending invitations.',
    category: 'campaigns',
    tags: ['pause', 'stop', 'control']
  },
  {
    id: 'inboxes-1',
    question: 'How many Google accounts can I connect?',
    answer: 'You can connect multiple Google accounts to distribute your sending load. Each account has daily sending limits that the system automatically manages to prevent hitting API limits.',
    category: 'inboxes',
    tags: ['google', 'accounts', 'limits']
  },
  {
    id: 'inboxes-2',
    question: 'Why is my inbox showing as disconnected?',
    answer: 'This usually happens when your Google OAuth token expires or is revoked. Go to Inbox Management and click "Reconnect" next to the affected inbox to restore the connection.',
    category: 'inboxes',
    tags: ['disconnected', 'oauth', 'reconnect']
  },
  {
    id: 'scheduling-1',
    question: 'How does the smart scheduling work?',
    answer: 'The system automatically schedules invitations based on business hours, timezone detection, and your daily sending limits. It spreads sends across multiple days and times to maximize delivery success.',
    category: 'scheduling',
    tags: ['smart', 'timezone', 'business-hours']
  },
  {
    id: 'scheduling-2',
    question: 'Can I customize the scheduling preferences?',
    answer: 'Yes, you can set preferred sending hours, lead times, and timezone preferences in the campaign settings. The system will respect these preferences when scheduling invitations.',
    category: 'scheduling',
    tags: ['preferences', 'hours', 'lead-time']
  },
  {
    id: 'troubleshooting-1',
    question: 'Why are my invitations not being sent?',
    answer: 'Check your inbox connections in Inbox Management. Make sure your Google accounts are connected and active. Also verify that your campaign is active and has available sending capacity.',
    category: 'troubleshooting',
    tags: ['not-sending', 'debug', 'inbox-status']
  },
  {
    id: 'troubleshooting-2',
    question: 'How do I track invitation responses?',
    answer: 'The system automatically tracks RSVP responses and updates your campaign statistics. You can view acceptance rates, declines, and tentative responses in your campaign dashboard.',
    category: 'troubleshooting',
    tags: ['rsvp', 'tracking', 'responses']
  }
];

const guides: Guide[] = [
  {
    id: 'first-campaign',
    title: 'Creating Your First Campaign',
    description: 'Step-by-step guide to set up and launch your first calendar invite campaign',
    category: 'getting-started',
    steps: [
      'Connect your Google account via Inbox Setup',
      'Go to Campaigns and click "Create Campaign"',
      'Enter campaign name and description',
      'Upload your CSV file with prospect data',
      'Customize your email template with merge fields',
      'Select which connected inboxes to use',
      'Set your scheduling preferences',
      'Review and launch your campaign'
    ]
  },
  {
    id: 'inbox-management',
    title: 'Managing Your Connected Inboxes',
    description: 'Learn how to connect, monitor, and maintain your Google accounts',
    category: 'inboxes',
    steps: [
      'Navigate to Inbox Setup to connect new accounts',
      'Use OAuth flow to authorize Google access',
      'Monitor connection status in Inbox Management',
      'Check daily usage limits and health scores',
      'Reconnect accounts if they become disconnected',
      'Remove accounts that are no longer needed'
    ]
  },
  {
    id: 'optimize-delivery',
    title: 'Optimizing Email Delivery',
    description: 'Best practices for improving your invitation delivery rates',
    category: 'campaigns',
    steps: [
      'Use personalized subject lines with merge fields',
      'Keep email templates concise and professional',
      'Respect recipient timezones for better engagement',
      'Monitor your sender reputation across accounts',
      'Adjust daily sending limits based on performance',
      'Use A/B testing for different templates'
    ]
  },
  {
    id: 'troubleshooting-guide',
    title: 'Troubleshooting Common Issues',
    description: 'Solutions to the most common problems users encounter',
    category: 'troubleshooting',
    steps: [
      'Check inbox connection status first',
      'Verify CSV file format and required columns',
      'Review campaign settings and scheduling preferences',
      'Monitor activity logs for error messages',
      'Test with a small sample before full campaigns',
      'Contact support if issues persist'
    ]
  }
];

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Topics', icon: Book },
    { id: 'getting-started', label: 'Getting Started', icon: Play },
    { id: 'campaigns', label: 'Campaigns', icon: MessageCircle },
    { id: 'inboxes', label: 'Inboxes', icon: Mail },
    { id: 'scheduling', label: 'Scheduling', icon: ChevronRight },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Search }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = searchTerm === '' || 
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleSupportEmail = () => {
    window.location.href = 'mailto:support@shadyapps.com?subject=Shady 5.0 Support Request';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <MessageCircle className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions, follow step-by-step guides, and get the support you need to succeed with Shady 5.0.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search for answers, guides, or topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 py-3 text-lg"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Tutorial Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-600" />
            Video Tutorial
          </CardTitle>
          <CardDescription>
            Watch our comprehensive walkthrough to get started quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="bg-blue-100 p-4 rounded-full inline-block">
                <Play className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Getting Started with Shady 5.0</h3>
                <p className="text-gray-600">Complete setup and first campaign walkthrough</p>
              </div>
              <Button onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}>
                Watch Tutorial
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Frequently Asked Questions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {filteredFAQs.map(faq => (
              <Card key={faq.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    {expandedFAQ === faq.id ? (
                      <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                </CardHeader>
                {expandedFAQ === faq.id && (
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {faq.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            {filteredFAQs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No FAQs found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Step-by-Step Guides */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Book className="h-6 w-6 text-blue-600" />
            Step-by-Step Guides
          </h2>
          <div className="space-y-4">
            {filteredGuides.map(guide => (
              <Card key={guide.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {guide.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
            {filteredGuides.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No guides found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support Contact */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="bg-blue-100 p-3 rounded-full inline-block">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Still Need Help?</h3>
              <p className="text-gray-600 mt-2">
                Can't find what you're looking for? Our support team is here to help you succeed.
              </p>
            </div>
            <Button 
              onClick={handleSupportEmail}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <p className="text-sm text-gray-500">
              📧 support@shadyapps.com | We typically respond within 24 hours
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}