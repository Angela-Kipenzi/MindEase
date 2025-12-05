import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, Shield } from "lucide-react";

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
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
                Privacy Policy
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
              <Shield className="h-8 w-8 text-indigo-600" />
              <h2 className="text-3xl font-bold">Our Commitment to Your Privacy</h2>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-4">1. Anonymous Model</h3>
                <p className="text-muted-foreground mb-3">
                  MindEase operates on a completely anonymous model. We do not collect, store, or process any personally identifiable information (PII).
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>No real names are required or stored</li>
                  <li>No email addresses or phone numbers</li>
                  <li>No physical addresses or locations</li>
                  <li>No government IDs or social security numbers</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">2. Data We Don't Collect</h3>
                <p className="text-muted-foreground">
                  Unlike traditional services, we specifically avoid collecting:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Personal Information</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Real names</li>
                        <li>• Contact information</li>
                        <li>• Birth dates</li>
                        <li>• Addresses</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Sensitive Data</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Medical history</li>
                        <li>• Insurance information</li>
                        <li>• Government IDs</li>
                        <li>• Financial details</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">3. Data We Do Collect</h3>
                <p className="text-muted-foreground mb-3">
                  We collect minimal, non-identifiable data necessary for service operation:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Randomly generated anonymous usernames</li>
                  <li>Session timestamps (for scheduling)</li>
                  <li>Aggregate, anonymized usage statistics</li>
                  <li>Technical data (browser type, device type - anonymized)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">4. End-to-End Encryption</h3>
                <p className="text-muted-foreground">
                  All therapy sessions (chat and voice) are encrypted end-to-end. This means:
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Only you and your therapist can read/hear the session content</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Not even MindEase staff can access session content</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Encryption keys are generated on your device and never leave it</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">5. Data Retention & Deletion</h3>
                <p className="text-muted-foreground">
                  We follow strict data minimization principles:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground mt-3">
                  <li>Session content is automatically deleted 24 hours after session completion</li>
                  <li>Anonymous usernames are rotated regularly</li>
                  <li>All data is purged after account inactivity of 90 days</li>
                  <li>You can request immediate deletion of all your data at any time</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">6. Legal Compliance</h3>
                <p className="text-muted-foreground mb-3">
                  While we collect minimal data, we comply with relevant privacy regulations:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium">GDPR Compliant</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium">HIPAA Aligned</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium">CCPA Ready</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium">PIPEDA Compliant</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">7. Contact & Questions</h3>
                <p className="text-muted-foreground">
                  For privacy-related questions or concerns, contact our Privacy Officer at:
                </p>
                <div className="mt-3 p-4 bg-indigo-50 rounded-lg">
                  <p className="font-medium">privacy@mindease.com</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We respond to all privacy inquiries within 48 hours
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                This privacy policy reflects our fundamental belief: mental health support should not require sacrificing privacy.
                We've built MindEase from the ground up to prove that effective therapy and complete privacy can coexist.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}