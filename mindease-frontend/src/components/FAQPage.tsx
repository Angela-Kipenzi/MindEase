import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface FaqPageProps {
  onBack: () => void;
}

export function FaqPage({ onBack }: FaqPageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does anonymous therapy work?",
      answer: "You're assigned a random anonymous name when you sign up. You use this name for all communications with therapists. No personal information is collected or shared."
    },
    {
      question: "Is it really 100% anonymous?",
      answer: "Yes! We don't ask for your real name, address, phone number, or any personal identifiers. All sessions are encrypted end-to-end."
    },
    {
      question: "Are the therapists licensed?",
      answer: "All our therapists are licensed professionals with verified credentials. They undergo thorough background checks and training in anonymous therapy."
    },
    {
      question: "What types of therapy are available?",
      answer: "We offer both chat-based and voice call sessions. Voice calls include optional voice masking technology for added privacy."
    },
    {
      question: "How do I book a session?",
      answer: "Browse available therapists, view their specialties and availability, then book a session that fits your schedule. No appointments needed for instant sessions."
    },
    {
      question: "Can I choose my therapist?",
      answer: "Yes! You can browse therapist profiles and select one based on their specialties, approach, and availability."
    },
    {
      question: "What if I need to cancel or reschedule?",
      answer: "You can cancel or reschedule sessions up to 24 hours before the appointment without any charge."
    },
    {
      question: "Is there a crisis hotline?",
      answer: "Yes! We provide direct links to crisis resources including the 988 Suicide & Crisis Lifeline and Crisis Text Line in our footer."
    },
    {
      question: "How is my data protected?",
      answer: "All data is encrypted in transit and at rest. We use industry-standard security practices and regularly undergo security audits."
    },
    {
      question: "What if I'm not satisfied with my session?",
      answer: "We offer a satisfaction guarantee. If you're not happy with your session, contact support for a full refund."
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
                Frequently Asked Questions
              </h1>
              <p className="text-sm text-muted-foreground">Find answers to common questions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Common Questions</h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about MindEase
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <button
                className="w-full p-6 text-left flex items-center justify-between"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-indigo-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {openIndex === index && (
                <CardContent className="pt-0 px-6 pb-6">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                Contact our support team for personalized assistance
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline">Contact Support</Button>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  Browse Therapists
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}