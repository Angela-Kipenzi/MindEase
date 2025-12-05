import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Shield, MessageCircle, Calendar, Heart, Lock, Users } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignUp: () => void;
  onFooterLinkClick?: (linkType: string) => void;
}

export function LandingPage({ onGetStarted, onSignUp, onFooterLinkClick }: LandingPageProps) {
  const handleLearnMore = () => {
    const featuresSection = document.querySelector('#features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle footer link clicks
  const handleFooterLinkClick = (linkType: string) => {
    // Handle features separately since it's local functionality
    if (linkType === 'features') {
      const featuresSection = document.querySelector('#features-section');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
      return; // Always handle features locally, don't pass to parent
    }
    
    // If onFooterLinkClick prop is provided, use it for other links
    if (onFooterLinkClick) {
      onFooterLinkClick(linkType);
      return;
    }
    
    // Fallback to local handling if prop not provided
    switch (linkType) {
      case 'pricing':
        alert('Pricing information coming soon!');
        break;
      case 'faq':
        alert('FAQ section coming soon!');
        break;
      case 'help-center':
        alert('Help Center coming soon!');
        break;
      case 'privacy-policy':
        alert('Privacy Policy coming soon!');
        break;
      case 'terms-of-service':
        alert('Terms of Service coming soon!');
        break;
      case 'suicide-hotline':
        window.open('tel:988', '_self');
        break;
      case 'crisis-text-line':
        window.open('sms:741741', '_self');
        break;
      case 'emergency':
        window.open('tel:911', '_self');
        break;
      default:
        break;
    }
  };

  const oceanBackgroundUrl = "https://www.hdwallpapers.in/download/nice_beautiful_ocean_waves_beach_sand_in_purple_red_clouds_sky_background_during_sunset_hd_beach-1920x1080.jpg3";

  return (
    <div className="min-h-screen w-full">
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all duration-200">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between w-full">
            {/* Logo, App Name and Tagline */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    MindEase
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    A quiet place for loud feelings
                  </span>
                </div>
              </div>
            </div>

            {/* Auth Buttons - Right */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="hidden sm:flex text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                onClick={onGetStarted}
              >
                Login
              </Button>
              <Button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={onSignUp}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Ocean Background */}
      <div 
        className="relative w-full min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url('${oceanBackgroundUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative w-full px-6 py-24 sm:py-32 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto">
            <div className="space-y-8 text-white">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm border border-white/30">
                100% Anonymous & Confidential
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                <span className="block mt-4">You're not Alone, Just Anonymous.</span>
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Connect with licensed therapists anonymously. Share your thoughts freely without revealing your identity. 
                Your journey to wellness starts here.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="text-lg px-8 h-14" onClick={onSignUp}>
                  Get Started 
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14" onClick={handleLearnMore}>
                  Learn More
                </Button>
              </div>
              <div className="flex items-center gap-8 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-white" />
                  <span>End-to-end encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-white" />
                  <span>No personal data stored</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1658881516403-7e6aa4a73b9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZXJlbmUlMjB3ZWxsbmVzc3xlbnwxfHx8fDE3NjAzNTU2NzN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Peaceful wellness"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-sm text-muted-foreground">Licensed Therapists</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the page with white background */}
      <div className="bg-white">
        {/* Features Section */}
        <div id="features-section" className="w-full px-6 py-24">
          <div className="text-center mb-16 w-full max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">How MindEase Works</h2>
            <p className="text-xl text-muted-foreground">
              Simple, secure, and completely anonymous therapy sessions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
            <Card className="border-2 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle>Complete Anonymity</CardTitle>
                <CardDescription>
                  Your identity is protected with randomly generated anonymous names. No personal information required.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <CardTitle>Easy Booking</CardTitle>
                <CardDescription>
                  Browse available therapists, check their specialties, and book sessions that fit your schedule.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <CardTitle>Secure Sessions</CardTitle>
                <CardDescription>
                  Chat or audio call with therapists in a safe, encrypted environment. Voice masking available for added privacy.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-transparent py-24 w-full">
          <div className="w-full px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto">
              <div className="relative w-full">
                <ImageWithFallback
                  src="https://th.bing.com/th/id/R.2a06f4d02a69584c774b28ee70df3f25?rik=XT1MNvVcS44kWg&riu=http%3a%2f%2feskipaper.com%2fimages%2fnature-27.jpg&ehk=LY39AAHbOwiAg9rcwkGtL1FwCVWrT4gYRYD0rAL76dw%3d&risl=&pid=ImgRaw&r=0"
                  alt="Meditation"
                  className="rounded-3xl shadow-2xl w-full h-[400px] object-cover"
                />
              </div>
              <div className="space-y-6 w-full">
                <h2 className="text-4xl font-bold">Why Choose Anonymous Therapy?</h2>
                <ul className="space-y-4">
                  {[
                    'Share without fear of judgment or stigma',
                    'No insurance paperwork or records',
                    'Lower barriers to seeking help',
                    'More honest and open conversations',
                    'Accessible from anywhere',
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Heart className="h-3 w-3 text-indigo-600" />
                      </div>
                      <span className="text-lg">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="mt-4" onClick={onSignUp}>
                  Start Your Journey
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-0 text-white w-full">
              <CardContent className="p-12 text-center w-full">
                <h2 className="text-4xl font-bold mb-4">Ready to Take the First Step?</h2>
                <p className="text-xl text-indigo-100 mb-8">
                  Join thousands who have found peace and support through anonymous therapy. 
                  Your mental health matters, and so does your privacy.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button size="lg" variant="secondary" className="text-lg px-8 h-14" onClick={onSignUp}>
                    Get Started Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 w-full">
          <div className="w-full px-6 py-12">
            <div className="grid md:grid-cols-4 gap-8 w-full max-w-7xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold">MindEase</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Anonymous, secure mental health support for everyone.
                </p>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('features')}
                      className="text-muted-foreground hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Features
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('pricing')}
                      className="text-muted-foreground hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Pricing
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('faq')}
                      className="text-muted-foreground hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      FAQ
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('help-center')}
                      className="text-muted-foreground hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Help Center
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('privacy-policy')}
                      className="text-muted-foreground hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('terms-of-service')}
                      className="text-muted-foreground hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Terms of Service
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold">Crisis Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('suicide-hotline')}
                      className="text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                    >
                      988 Suicide Hotline
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('crisis-text-line')}
                      className="text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Crisis Text Line
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => handleFooterLinkClick('emergency')}
                      className="text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Emergency: 911
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground w-full max-w-7xl mx-auto">
              © 2025 MindEase. All rights reserved. Your privacy is our priority.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}