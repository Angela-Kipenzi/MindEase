import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Heart, Shield, ArrowLeft } from "lucide-react";
import { authAPI } from "../lib/api";
import { Alert, AlertDescription } from "./ui/alert";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";

interface AuthPageProps {
  onLogin: () => void;
  onBack: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthPage({ onLogin, onBack, initialMode = 'login' }: AuthPageProps) {
  const [userType, setUserType] = useState<'user' | 'therapist'>('user');
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');
  const [isForcedSignup, setIsForcedSignup] = useState(initialMode === 'signup');
  
  // User fields
  const [anonymousName, setAnonymousName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Therapist fields
  const [fullName, setFullName] = useState('');
  const [therapistEmail, setTherapistEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [bio, setBio] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [newLanguage, setNewLanguage] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Available languages for selection
  const availableLanguages = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Hindi',
    'Arabic', 'Portuguese', 'Russian', 'Japanese', 'Swahili'
  ];

  // Prevent switching to login if forced to signup
  useEffect(() => {
    if (initialMode === 'signup') {
      setIsSignup(true);
      setIsForcedSignup(true);
    }
  }, [initialMode]);

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !selectedLanguages.includes(newLanguage.trim())) {
      setSelectedLanguages([...selectedLanguages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (language: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l !== language));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLanguage();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isSignup) {
        if (userType === 'user') {
          // User signup validation
          if (!anonymousName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
          }
          
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
          }
          
          if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
          }
          
          // Email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
          }
          
          await authAPI.signup({
            email: email,
            password: password,
            role: 'user',
            anonymousName: anonymousName,
          });
          
        } else {
          // Therapist signup validation
          if (!fullName || !therapistEmail || !password || !confirmPassword || !phone || !licenseNumber || !specialization || !yearsOfExperience || !bio || selectedLanguages.length === 0) {
            setError('Please fill in all required fields');
            setIsLoading(false);
            return;
          }
          
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
          }
          
          if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
          }
          
          if (!termsAccepted) {
            setError('Please accept the terms and conditions');
            setIsLoading(false);
            return;
          }
          
          // Email validation for therapist
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(therapistEmail)) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
          }
          
          // IMPORTANT: Do NOT include anonymousName for therapists
          const signupData = {
            email: therapistEmail,
            password: password,
            role: 'therapist' as const,
            fullName: fullName,
            phone: phone,
            licenseNumber: licenseNumber,
            specialization: specialization,
            yearsOfExperience: parseInt(yearsOfExperience),
            bio: bio,
            languages: selectedLanguages,
            credentials: `License: ${licenseNumber}, Specialization: ${specialization}, Experience: ${yearsOfExperience} years, Languages: ${selectedLanguages.join(', ')}`
          };
          
          await authAPI.signup(signupData);
        }
      } else {
        // Login logic
        const loginEmail = userType === 'user' ? email : therapistEmail;
        if (!loginEmail || !password) {
          setError('Please enter email and password');
          setIsLoading(false);
          return;
        }
        
        await authAPI.login({
          username: loginEmail,
          password: password,
          role: userType
        });
      }
      
      onLogin();
      
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAnonymousName(''); 
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setTherapistEmail('');
    setPhone('');
    setLicenseNumber('');
    setSpecialization('');
    setYearsOfExperience('');
    setBio('');
    setSelectedLanguages(['English']);
    setNewLanguage('');
    setTermsAccepted(false);
    setError('');
  };

  const handleUserTypeChange = (newUserType: 'user' | 'therapist') => {
    setUserType(newUserType);
    resetForm();
  };

  const handleAuthTypeToggle = () => {
    // Don't allow toggle if forced to signup
    if (!isForcedSignup) {
      setIsSignup(!isSignup);
      resetForm();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNEgxNHYyMGgyMHYtMjB6bTAtNDBoLTIwdjIwaDIwdi0yMHptLTQwIDQwSDB2MjBoMjB2LTIwem0wLTQwSDB2MjBoMjB2LTIweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <div className="grid lg:grid-cols-2 gap-8 items-start lg:items-center">
            
            {/* Left Side - Branding - Moved UP with negative margin */}
            <div className="space-y-8 -mt-8 lg:mt-0">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <span className="text-4xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  MindEase
                </span>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-tight">
                  Welcome to Your Safe Space
                </h1>
                <p className="text-xl text-muted-foreground">
                  Connect with licensed therapists anonymously. Your identity is protected every step of the way.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-white/50 backdrop-blur rounded-xl">
                  <Shield className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Complete Anonymity</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose your own anonymous name. No personal data required.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/50 backdrop-blur rounded-xl">
                  <Heart className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Professional Support</h4>
                    <p className="text-sm text-muted-foreground">
                      All therapists are licensed and verified professionals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <Card className="backdrop-blur-sm bg-white/80 shadow-2xl border-2">
              <CardHeader className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={userType === 'user' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleUserTypeChange('user')}
                  >
                    User
                  </Button>
                  <Button
                    variant={userType === 'therapist' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleUserTypeChange('therapist')}
                  >
                    Therapist
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {isSignup ? 'Create Account' : 'Welcome Back'}
                  </CardTitle>
                  <CardDescription>
                    {isSignup
                      ? `Sign up as a ${userType}`
                      : `Sign in to your ${userType} account`}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* LOGIN FORM (Common for both user types) */}
                  {!isSignup && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="loginEmail">Email Address</Label>
                        <Input
                          id="loginEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={userType === 'user' ? email : therapistEmail}
                          onChange={(e) => userType === 'user' ? setEmail(e.target.value) : setTherapistEmail(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loginPassword">Password</Label>
                        <Input
                          id="loginPassword"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  )}

                  {/* USER SIGNUP FORM */}
                  {isSignup && userType === 'user' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="anonymousName">Anonymous Name </Label>
                        <Input
                          id="anonymousName"
                          type="text"
                          placeholder="Create your unique anonymous name"
                          value={anonymousName}
                          onChange={(e) => setAnonymousName(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          This name will protect your identity during sessions. Choose something describing you.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  )}

                  {/* THERAPIST SIGNUP FORM */}
                  {isSignup && userType === 'therapist' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name </Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Dr. Alice Smith"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                        
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="therapistEmail">Email Address </Label>
                        <Input
                          id="therapistEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={therapistEmail}
                          onChange={(e) => setTherapistEmail(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional Bio </Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about your experience, approach to therapy, and what clients can expect..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          required
                          className="min-h-[120px] resize-vertical"
                          disabled={isLoading}
                        />
                        
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+254 712 345 678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="h-12"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="licenseNumber">License Number </Label>
                          <Input
                            id="licenseNumber"
                            type="text"
                            placeholder=" "
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            required
                            className="h-12"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialization">Specialization </Label>
                          <Input
                            id="specialization"
                            type="text"
                            placeholder="Anxiety"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            required
                            className="h-12"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yearsOfExperience">Years of Experience </Label>
                          <Input
                            id="yearsOfExperience"
                            type="number"
                            placeholder="10"
                            value={yearsOfExperience}
                            onChange={(e) => setYearsOfExperience(e.target.value)}
                            required
                            min="0"
                            className="h-12"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Languages Section */}
                      <div className="space-y-2">
                        <Label htmlFor="languages">Languages  </Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            id="languages"
                            type="text"
                            placeholder="Add a language you speak"
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1"
                            disabled={isLoading}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleAddLanguage}
                            disabled={isLoading}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {/* Language badges */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedLanguages.map(language => (
                            <Badge 
                              key={language} 
                              variant="secondary"
                              className="px-3 py-1"
                            >
                              {language}
                              <button
                                type="button"
                                onClick={() => handleRemoveLanguage(language)}
                                className="ml-2 text-xs hover:text-red-500"
                                disabled={isLoading}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {availableLanguages.map(language => (
                            <Badge 
                              key={language}
                              variant={selectedLanguages.includes(language) ? "default" : "outline"}
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => {
                                if (!selectedLanguages.includes(language)) {
                                  setSelectedLanguages([...selectedLanguages, language]);
                                }
                              }}
                            >
                              {language}
                            </Badge>
                          ))}
                        </div>
                        
                        
                      </div>

                      <div className="flex items-start space-x-3 py-4">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                          disabled={isLoading}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="terms"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            I agree to the terms and conditions of the service 
                          </label>
                          <p className="text-xs text-muted-foreground">
                            By registering, you agree to our privacy policy and code of conduct
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12" 
                  
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isSignup ? 'Creating Account...' : 'Signing In...'}
                      </div>
                    ) : (
                      isSignup ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                  
                  {/* Only show the toggle link if not forced to signup */}
                  {!isForcedSignup && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleAuthTypeToggle}
                        className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {isSignup
                          ? 'Already have an account? Sign in'
                          : "Don't have an account? Sign up"}
                      </button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}