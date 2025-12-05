import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, FileText } from "lucide-react";

interface TermsOfServicePageProps {
  onBack: () => void;
}

export function TermsOfServicePage({ onBack }: TermsOfServicePageProps) {
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
                Terms of Service
              </h1>
              <p className="text-sm text-muted-foreground">Last updated: December 5, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="h-8 w-8 text-indigo-600" />
              <h2 className="text-3xl font-bold">MindEase Terms of Service</h2>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using MindEase, you agree to be bound by these Terms of Service. 
                  If you disagree with any part of these terms, you may not access our service.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">2. Anonymous Service</h3>
                <p className="text-muted-foreground mb-3">
                  MindEase operates as an anonymous mental health support platform:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>You will be assigned a random anonymous username</li>
                  <li>No personal information is required or stored</li>
                  <li>You agree not to attempt to disclose your identity to therapists</li>
                  <li>Therapists agree not to attempt to learn your identity</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">3. Eligibility</h3>
                <p className="text-muted-foreground">
                  You must be at least 18 years old to use MindEase. By using our service, you represent and warrant that you are at least 18 years old.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">4. Therapeutic Relationship</h3>
                <p className="text-muted-foreground mb-3">
                  Important limitations of our service:
                </p>
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-semibold mb-2">Not for Emergencies</p>
                  <p className="text-yellow-700 text-sm">
                    MindEase is not a crisis service. If you are experiencing a mental health emergency, 
                    please call 988 (Suicide & Crisis Lifeline) or 911 immediately.
                  </p>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Therapists are independent professionals, not employees of MindEase</li>
                  <li>MindEase facilitates connections but does not provide therapy</li>
                  <li>You are responsible for choosing therapists that meet your needs</li>
                  <li>All therapeutic decisions are between you and your therapist</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">5. User Responsibilities</h3>
                <p className="text-muted-foreground mb-3">You agree to:</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Use the service only for lawful purposes</li>
                  <li>Not harass, threaten, or abuse therapists or other users</li>
                  <li>Not attempt to circumvent the anonymous system</li>
                  <li>Not use the service while under the influence of impairing substances</li>
                  <li>Provide accurate (though anonymous) information about your needs</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">6. Payments and Refunds</h3>
                <p className="text-muted-foreground mb-3">
                  Our payment and refund policies:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Payments are processed through secure third-party processors</li>
                  <li>We do not store your payment information</li>
                  <li>Sessions cancelled with 24+ hours notice receive full refunds</li>
                  <li>Late cancellations (less than 24 hours) receive 50% refunds</li>
                  <li>No-shows are not refundable</li>
                  <li>Dissatisfaction with session content may qualify for refund - contact support</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">7. Intellectual Property</h3>
                <p className="text-muted-foreground">
                  All content on the MindEase platform, including text, graphics, logos, and software, 
                  is the property of MindEase or its licensors and is protected by intellectual property laws.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">8. Limitation of Liability</h3>
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold mb-2">Important Legal Notice</p>
                  <p className="text-red-700 text-sm">
                    MindEase is not liable for any decisions made or actions taken based on therapy sessions. 
                    We provide a platform for connection but do not control therapeutic outcomes.
                  </p>
                </div>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, MindEase shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages resulting from your use of the service.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">9. Changes to Terms</h3>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. We will notify users of 
                  significant changes via the platform. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">10. Governing Law</h3>
                <p className="text-muted-foreground">
                  These terms shall be governed by and construed in accordance with the laws of 
                  the State of Delaware, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">11. Contact Information</h3>
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact:
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">legal@mindease.com</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    MindEase Inc., 123 Privacy Lane, Wilmington, DE 19801
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                <p className="text-sm text-muted-foreground">
                  By using MindEase, you acknowledge that you have read, understood, and agree to be bound 
                  by these Terms of Service. These terms represent the entire agreement between you and MindEase 
                  regarding your use of the service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}