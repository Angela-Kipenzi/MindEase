import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ExternalLink, Phone, MessageCircle, Heart, Brain, Users, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ResourcesProps {
  onBack?: () => void;
}

export function Resources({ onBack }: ResourcesProps) {
  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <div className="p-8 space-y-6">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
        <div>
          <h1>Resources & Support</h1>
          <p className="text-muted-foreground">Helpful information and support services</p>
        </div>

      <Alert>
        <Phone className="h-4 w-4" />
        <AlertTitle>Crisis Support</AlertTitle>
        <AlertDescription>
          If you're in crisis or having thoughts of suicide, please reach out immediately:
          <div className="mt-2 space-y-1">
            <div><strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988</div>
            <div><strong>Crisis Text Line:</strong> Text "HELLO" to 741741</div>
            <div><strong>Emergency:</strong> Call 911</div>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <CardTitle>Mental Health Tips</CardTitle>
            </div>
            <CardDescription>Daily practices for better mental health</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>Practice self-compassion:</strong> Treat yourself with the same kindness you'd offer a friend
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>Maintain routines:</strong> Regular sleep, meals, and activities provide structure
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>Stay connected:</strong> Reach out to friends, family, or support groups
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>Move your body:</strong> Physical activity can improve mood and reduce anxiety
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>
                  <strong>Limit stress:</strong> Set boundaries and make time for activities you enjoy
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <CardTitle>Self-Care Ideas</CardTitle>
            </div>
            <CardDescription>Ways to nurture your wellbeing</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>Take a walk in nature</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>Practice mindfulness or meditation</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>Journal your thoughts and feelings</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>Listen to calming music</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>Connect with loved ones</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>Engage in a creative hobby</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>Take a relaxing bath</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <div>Practice gratitude</div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Support Services</CardTitle>
          </div>
          <CardDescription>Professional help and resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">National Alliance on Mental Illness (NAMI)</h4>
                <p className="text-sm text-muted-foreground">
                  Information, support groups, and resources for mental health conditions
                </p>
                <p className="text-sm mt-1">Helpline: 1-800-950-NAMI (6264)</p>
                <p className="text-xs text-blue-600 mt-1">www.nami.org</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.nami.org')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Mental Health America (MHA)</h4>
                <p className="text-sm text-muted-foreground">
                  Screening tools, educational resources, and advocacy
                </p>
                <p className="text-xs text-blue-600 mt-1">www.mhanational.org</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.mhanational.org')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">SAMHSA National Helpline</h4>
                <p className="text-sm text-muted-foreground">
                  Treatment referral and information service for mental health and substance use
                </p>
                <p className="text-sm mt-1">Helpline: 1-800-662-HELP (4357)</p>
                <p className="text-xs text-blue-600 mt-1">www.samhsa.gov</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.samhsa.gov')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Psychology Today Therapist Directory</h4>
                <p className="text-sm text-muted-foreground">
                  Find licensed therapists, psychiatrists, and treatment centers
                </p>
                <p className="text-xs text-blue-600 mt-1">www.psychologytoday.com</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.psychologytoday.com')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Crisis Text Line</h4>
                <p className="text-sm text-muted-foreground">
                  Free, 24/7 crisis support via text message
                </p>
                <p className="text-sm mt-1">Text "HOME" to 741741</p>
                <p className="text-xs text-blue-600 mt-1">www.crisistextline.org</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.crisistextline.org')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">National Suicide Prevention Lifeline</h4>
                <p className="text-sm text-muted-foreground">
                  24/7 free and confidential support for people in distress
                </p>
                <p className="text-sm mt-1">Call or text 988</p>
                <p className="text-xs text-blue-600 mt-1">www.988lifeline.org</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.988lifeline.org')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Anxiety and Depression Association of America (ADAA)</h4>
                <p className="text-sm text-muted-foreground">
                  Resources for anxiety, depression, and related disorders
                </p>
                <p className="text-xs text-blue-600 mt-1">www.adaa.org</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.adaa.org')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">National Institute of Mental Health (NIMH)</h4>
                <p className="text-sm text-muted-foreground">
                  Research-based information on mental health disorders
                </p>
                <p className="text-xs text-blue-600 mt-1">www.nimh.nih.gov</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.nimh.nih.gov')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mobile Apps & Digital Resources</CardTitle>
          <CardDescription>Helpful apps and online tools for mental health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Headspace</h4>
                <p className="text-sm text-muted-foreground">
                  Meditation and mindfulness app
                </p>
                <p className="text-xs text-blue-600 mt-1">www.headspace.com</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.headspace.com')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Calm</h4>
                <p className="text-sm text-muted-foreground">
                  Sleep, meditation, and relaxation app
                </p>
                <p className="text-xs text-blue-600 mt-1">www.calm.com</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.calm.com')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">MindShift CBT</h4>
                <p className="text-sm text-muted-foreground">
                  Anxiety relief using CBT techniques
                </p>
                <p className="text-xs text-blue-600 mt-1">www.anxietycanada.com</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.anxietycanada.com')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Woebot</h4>
                <p className="text-sm text-muted-foreground">
                  AI-powered mental health chatbot
                </p>
                <p className="text-xs text-blue-600 mt-1">www.woebothealth.com</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExternalLink('https://www.woebothealth.com')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Understanding Mental Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">What is mental health?</h4>
            <p className="text-muted-foreground">
              Mental health includes our emotional, psychological, and social well-being. It affects how we think, 
              feel, and act. It also helps determine how we handle stress, relate to others, and make choices.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">When to seek help:</h4>
            <ul className="text-muted-foreground space-y-2 mt-2">
              <li>• Feeling sad or down for extended periods</li>
              <li>• Excessive worries or fears</li>
              <li>• Extreme mood changes</li>
              <li>• Withdrawal from friends and activities</li>
              <li>• Difficulty concentrating or sleeping</li>
              <li>• Changes in eating habits</li>
              <li>• Thoughts of self-harm</li>
            </ul>
          </div>
          <Alert>
            <MessageCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>REMEMBER:</strong> Seeking help is a sign of strength, not weakness. Mental health conditions are treatable, 
              and recovery is possible. You don't have to face challenges alone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}