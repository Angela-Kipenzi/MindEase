import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Heart, Shield, ArrowLeft } from "lucide-react";
import { authAPI } from "../lib/api";
import { Alert, AlertDescription } from "./ui/alert";

interface AuthPageProps {
  onLogin: () => void;
  onBack: () => void;
}

export function AuthPage({ onLogin, onBack }: AuthPageProps) {
  const [userType, setUserType] = useState<'user' | 'therapist'>('user');
  const [isSignup, setIsSignup] = useState(false);
  
  // User fields
  const [anonymousName, setAnonymousName] = useState(''); // NEW: For user-created anonymous name
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Therapist fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [bio, setBio] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isSignup) {
        if (userType === 'user') {
          // Updated validation for user signup
          if (!anonymousName || !username || !password || !confirmPassword) {
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
          
          // Use the provided anonymous name
          await authAPI.signup({
            username: username,
            password,
            role: 'user',
            anonymousName: anonymousName, // User-created anonymous name
          });
          
        } else {
          // Therapist signup remains the same
          if (!fullName || !email || !phone || !licenseNumber || !specialization || !yearsOfExperience) {
            setError('Please fill in all required fields');
            setIsLoading(false);
            return;
          }
          
          if (!termsAccepted) {
            setError('Please accept the terms and conditions');
            setIsLoading(false);
            return;
          }
          
          const signupData = {
            username: email,
            password: licenseNumber,
            role: 'therapist' as const,
            email: email,
            fullName: fullName,
            phone: phone,
            licenseNumber: licenseNumber,
            specialization: specialization,
            yearsOfExperience: parseInt(yearsOfExperience),
            credentials: `License: ${licenseNumber}, Specialization: ${specialization}, Experience: ${yearsOfExperience} years`
          };
          
          await authAPI.signup(signupData);
        }
      } else {
        // Login logic
        if (userType === 'user') {
          if (!username || !password) {
            setError('Please enter username and password');
            setIsLoading(false);
            return;
          }
        } else {
          if (!email || !licenseNumber) {
            setError('Please enter email and license number');
            setIsLoading(false);
            return;
          }
        }
        
        await authAPI.login({
          username: userType === 'user' ? username : email,
          password: userType === 'user' ? password : licenseNumber,
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
    setAnonymousName(''); // NEW: Reset anonymous name
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setEmail('');
    setPhone('');
    setLicenseNumber('');
    setSpecialization('');
    setYearsOfExperience('');
    setBio('');
    setTermsAccepted(false);
    setError('');
  };

  const handleUserTypeChange = (newUserType: 'user' | 'therapist') => {
    setUserType(newUserType);
    resetForm();
  };

  const handleAuthTypeToggle = () => {
    setIsSignup(!isSignup);
    resetForm();
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

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Branding */}
            <div className="space-y-8">
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
                    I'm a User
                  </Button>
                  <Button
                    variant={userType === 'therapist' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleUserTypeChange('therapist')}
                  >
                    I'm a Therapist
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

                  {/* USER LOGIN FORM */}
                  {!isSignup && userType === 'user' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="loginUsername">Username</Label>
                        <Input
                          id="loginUsername"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
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

                  {/* THERAPIST LOGIN FORM */}
                  {!isSignup && userType === 'therapist' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="therapistEmail">Email Address</Label>
                        <Input
                          id="therapistEmail"
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
                        <Label htmlFor="therapistLicense">License Number</Label>
                        <Input
                          id="therapistLicense"
                          type="text"
                          placeholder="Enter your license number"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
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
                        <Label htmlFor="anonymousName">Choose Your Anonymous Name *</Label>
                        <Input
                          id="anonymousName"
                          type="text"
                          placeholder="Create your unique anonymous name (e.g., CalmTiger, PeacefulOwl, etc.)"
                          value={anonymousName}
                          onChange={(e) => setAnonymousName(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          This name will protect your identity during sessions. Choose something meaningful to you.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">Username for Login *</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username for logging in"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="h-12"
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
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
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
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
      <Label htmlFor="fullName">Full Name *</Label>
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
      <p className="text-xs text-muted-foreground">
        This will be your professional name displayed to clients
      </p>
    </div>
    
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
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
                        <Label htmlFor="bio">Professional Bio (Optional)</Label>
                        <textarea
                          id="bio"
                          placeholder="Tell us about your experience and approach to therapy..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full p-3 border rounded-md min-h-[100px] resize-vertical"
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+(254)700XXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="h-12"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="licenseNumber">License Number *</Label>
                          <Input
                            id="licenseNumber"
                            type="text"
                            placeholder="LIC123456"
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
                          <Label htmlFor="specialization">Specialization *</Label>
                          <Input
                            id="specialization"
                            type="text"
                            placeholder="Anxiety, Depression, etc."
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            required
                            className="h-12"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
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
                            I agree to the terms and conditions of the service *
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
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}