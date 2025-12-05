import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, Search, Mail, MessageCircle, Phone, Shield } from "lucide-react";

interface HelpCenterPageProps {
  onBack: () => void;
}

export function HelpCenterPage({ onBack }: HelpCenterPageProps) {
  const helpTopics = [
    {
      category: "Getting Started",
      articles: [
        "How to create an account",
        "Booking your first session",
        "Understanding anonymous names",
        "Choosing between chat and voice sessions"
      ]
    },
    {
      category: "Technical Support",
      articles: [
        "Troubleshooting audio issues",
        "Voice masking setup",
        "Browser compatibility",
        "Mobile app installation"
      ]
    },
    {
      category: "Account & Billing",
      articles: [
        "Updating payment methods",
        "Cancelling subscriptions",
        "Requesting refunds",
        "Understanding pricing"
      ]
    },
    {
      category: "Privacy & Security",
      articles: [
        "How anonymity works",
        "Data protection measures",
        "End-to-end encryption",
        "Reporting concerns"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Help Center
              </h1>
              <p className="text-sm text-muted-foreground">Find help and support resources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">Get help within 24 hours</p>
              <Button variant="outline" className="w-full">Email Us</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">Available 9AM-5PM EST</p>
              <Button variant="outline" className="w-full">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Emergency Resources</h3>
              <p className="text-sm text-muted-foreground mb-4">Immediate crisis support</p>
              <Button variant="outline" className="w-full text-red-600 border-red-200">View Resources</Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Topics */}
        <div className="grid md:grid-cols-2 gap-8">
          {helpTopics.map((topic, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">{topic.category}</h3>
                <ul className="space-y-3">
                  {topic.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <button className="text-left text-blue-600 hover:text-blue-800 hover:underline w-full">
                        {article}
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Privacy Note */}
        <Card className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-indigo-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Your Privacy Matters</h3>
                <p className="text-sm text-muted-foreground">
                  All support requests are handled with the same level of anonymity as your therapy sessions. 
                  We never ask for personal information and all communications are encrypted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}