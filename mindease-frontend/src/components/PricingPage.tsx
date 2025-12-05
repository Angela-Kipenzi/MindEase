import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Check } from "lucide-react";

interface PricingPageProps {
  onBack: () => void;
}

export function PricingPage({ onBack }: PricingPageProps) {
  const plans = [
    {
      name: "Basic",
      description: "Perfect for occasional support",
      price: "$29",
      period: "per session",
      features: [
        "30-minute chat session",
        "Anonymous identity",
        "Basic support",
        "Email support"
      ]
    },
    {
      name: "Standard",
      description: "Most popular for regular therapy",
      price: "$49",
      period: "per session",
      features: [
        "50-minute session (chat or voice)",
        "Anonymous identity",
        "Voice masking available",
        "Priority booking",
        "Email & chat support"
      ],
      highlighted: true
    },
    {
      name: "Premium",
      description: "Comprehensive mental health support",
      price: "$79",
      period: "per session",
      features: [
        "60-minute extended sessions",
        "All session types",
        "Advanced voice masking",
        "24/7 crisis support",
        "Personalized therapist matching",
        "Priority support"
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
                Pricing Plans
              </h1>
              <p className="text-sm text-muted-foreground">Choose the plan that fits your needs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground">
            All plans include complete anonymity and end-to-end encryption
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.highlighted ? 'border-2 border-indigo-500 shadow-lg' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${plan.highlighted ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}`}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Is therapy really anonymous?</h4>
                  <p className="text-muted-foreground">
                    Yes! We use randomly generated anonymous names and never ask for personal information. 
                    All sessions are end-to-end encrypted.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Can I change plans later?</h4>
                  <p className="text-muted-foreground">
                    Absolutely. You can upgrade or downgrade your plan at any time.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Do you accept insurance?</h4>
                  <p className="text-muted-foreground">
                    Currently, we don't work directly with insurance providers due to our anonymous model. 
                    However, we can provide receipts for reimbursement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}