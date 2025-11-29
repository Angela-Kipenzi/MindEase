import { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { UserDashboard } from "./components/UserDashboard";
import { TherapistDashboard } from "./components/TherapistDashboard";

import { LiveSession } from "./components/LiveSession";
import { TherapistLiveSession } from "./components/TherapistLiveSession";
import { UpcomingSessions } from "./components/UpcomingSessions";
import { SessionHistory } from "./components/SessionHistory";
import { MoodTracker } from "./components/MoodTracker";
import { Journal } from "./components/Journal";
import { Exercises } from "./components/Exercises";
import { Resources } from "./components/Resources";
import { TherapistDiscovery } from "./components/TherapistDiscovery";
import { getCurrentUser, logout } from "./lib/api";
import { Toaster } from "./components/ui/sonner";

// Import the User type from the API
import type { User } from "./lib/api";

type AppPage = 
  | 'landing' 
  | 'auth' 
  | 'user-dashboard' 
  | 'therapist-dashboard' 
  | 'sessions' 
  | 'upcoming-sessions'
  | 'session-history'
  | 'live-session'
  | 'therapist-live-session'
  | 'mood'
  | 'journal'
  | 'exercises'
  | 'resources'
  | 'progress'
  | 'therapist-discovery';

// Simple error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-700 mb-4">
            There was an error loading the page. This might be due to a missing component or styling issue.
          </p>
          {error && (
            <details className="mb-4">
              <summary className="cursor-pointer font-medium">Error details</summary>
              <pre className="mt-2 text-sm text-gray-600 overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Safe component wrapper
function SafeComponent({ component: Component, fallback, ...props }: any) {
  const [hasError, setHasError] = useState(false);

  try {
    if (hasError) {
      return fallback;
    }
    return <Component {...props} />;
  } catch (error) {
    console.error('Component error:', error);
    setHasError(true);
    return fallback;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('landing');
  const [sessionDetails, setSessionDetails] = useState({
    therapistName: 'Dr. Serene Mind',
    therapistInitials: 'SM',
    sessionType: 'chat' as 'chat' | 'audio',
    sessionId: ''
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user on app start and set up consistent user state
  useEffect(() => {
    const loadUser = () => {
      const user = getCurrentUser();
      console.log('Current user on app load:', user);
      
      if (user) {
        setCurrentUser(user);
        if (user.role === 'therapist') {
          setCurrentPage('therapist-dashboard');
          
          // Ensure therapist has a session for testing
          const savedSession = localStorage.getItem('currentSession');
          if (!savedSession) {
            const mockSession = {
              sessionId: 'test-therapist-session-' + Date.now(),
              sessionType: 'audio',
              clientName: 'Anonymous Client',
              therapistName: user.fullName || `Dr. ${user.anonymousName}`,
              therapistInitials: (user.fullName || user.anonymousName).split(' ').map(n => n[0]).join('').slice(0, 2)
            };
            localStorage.setItem('currentSession', JSON.stringify(mockSession));
            console.log('Created mock session for therapist testing');
          }
        } else {
          setCurrentPage('user-dashboard');
        }
      } else {
        setCurrentPage('landing');
      }
    };

    loadUser();
  }, []);

  const handleLogin = () => {
    const user = getCurrentUser();
    console.log('User logged in:', user);
    
    if (user) {
      setCurrentUser(user);
      if (user.role === 'therapist') {
        setCurrentPage('therapist-dashboard');
      } else {
        setCurrentPage('user-dashboard');
      }
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  const handleNavigate = (page: string, sessionType?: 'chat' | 'audio') => {
    console.log('Navigating to:', page, 'with session type:', sessionType);
    
    if (page === 'live-session' && sessionType) {
      setSessionDetails(prev => ({
        ...prev,
        sessionType: sessionType
      }));
    }
    
    if (page === 'therapist-live-session') {
      const savedSession = localStorage.getItem('currentSession');
      if (!savedSession) {
        const mockSession = {
          sessionId: 'therapist-session-' + Date.now(),
          sessionType: sessionType || 'audio',
          clientName: 'Anonymous Client',
          therapistName: currentUser?.fullName || `Dr. ${currentUser?.anonymousName}`,
          therapistInitials: (currentUser?.fullName || currentUser?.anonymousName || 'DT').split(' ').map(n => n[0]).join('').slice(0, 2)
        };
        localStorage.setItem('currentSession', JSON.stringify(mockSession));
        console.log('Created session for therapist:', mockSession);
      }
    }
    
    setCurrentPage(page as AppPage);
  };

  const handleSessionBooked = (
    _therapistId: string,
    therapistName: string,
    therapistInitials: string,
    sessionType: 'chat' | 'audio',
    _date: Date,
    _time: string
  ) => {
    setSessionDetails({
      therapistName,
      therapistInitials,
      sessionType,
      sessionId: ''
    });
    setCurrentPage('upcoming-sessions');
  };

  const handleJoinSession = (sessionType: 'chat' | 'audio', therapistName: string, therapistInitials: string, sessionId?: string) => {
    setSessionDetails({
      therapistName,
      therapistInitials,
      sessionType,
      sessionId: sessionId || 'default-session-id'
    });
    setCurrentPage('live-session');
  };

  // Fallback component for errors
  const FallbackComponent = ({ pageName }: { pageName: string }) => (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-600 mb-4">Component Loading Issue</h2>
        <p className="text-gray-700 mb-4">There was a problem loading the {pageName} page.</p>
        <button
          onClick={() => setCurrentPage(currentUser?.role === 'therapist' ? 'therapist-dashboard' : 'user-dashboard')}
          className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const renderPage = () => {
    console.log('Rendering page:', currentPage);
    
    try {
      switch (currentPage) {
        case 'landing':
          return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
        
        case 'auth':
          return (
            <AuthPage
              onLogin={handleLogin}
              onBack={() => setCurrentPage('landing')}
            />
          );
        
        case 'user-dashboard':
          return (
            <UserDashboard
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        
        case 'therapist-dashboard':
          return (
            <TherapistDashboard 
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          );
        
        case 'sessions':
          return (
            <TherapistDiscovery
              onBack={() => setCurrentPage('user-dashboard')}
              onSessionBooked={handleSessionBooked}
            />
          );
        
        case 'upcoming-sessions':
          return (
            <UpcomingSessions
              onBack={() => setCurrentPage('user-dashboard')}
              onJoinSession={handleJoinSession}
            />
          );
        
        case 'session-history':
          return (
            <SessionHistory
              onBack={() => setCurrentPage('user-dashboard')}
            />
            
          );
        
        case 'live-session':
          const user = getCurrentUser();
          return (
            <LiveSession
              therapistName={sessionDetails.therapistName}
              therapistInitials={sessionDetails.therapistInitials}
              sessionType={sessionDetails.sessionType}
              onBack={() => setCurrentPage(user?.role === 'therapist' ? 'therapist-dashboard' : 'user-dashboard')}
            />
          );
        
        case 'therapist-live-session':
          return (
            <TherapistLiveSession 
                onLogout={handleLogout} 
                onNavigate={handleNavigate} 
           />
       );
        
        case 'mood':
          return (
            <MoodTracker
              onBack={() => setCurrentPage('user-dashboard')}
            />
          );
        
        case 'journal':
          return (
            <Journal
              onBack={() => setCurrentPage('user-dashboard')}
            />
          );
        
        case 'exercises':
          return (
            <Exercises
              onBack={() => setCurrentPage('user-dashboard')}
            />
          );
        
        case 'resources':
          return (
            <Resources
              onBack={() => setCurrentPage('user-dashboard')}
            />
          );
        
        case 'progress':
          return (
            <MoodTracker
              onBack={() => setCurrentPage('user-dashboard')}
            />
          );
        
        case 'therapist-discovery':
          return (
            <SafeComponent
              component={TherapistDiscovery}
              fallback={<FallbackComponent pageName="Therapist Discovery" />}
              onBack={() => setCurrentPage('user-dashboard')}
              onSessionBooked={handleSessionBooked}
            />
          );
        
        default:
          return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
      }
    } catch (error) {
      console.error('Error in renderPage:', error);
      return <FallbackComponent pageName={currentPage} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="size-full">
        {renderPage()}
      </div>
      <Toaster />
    </ErrorBoundary>
  );
}