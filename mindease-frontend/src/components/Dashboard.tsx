import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Heart, BookOpen, Activity, Sparkles } from "lucide-react";

interface MoodEntry {
  date: string;
  mood: string;
  note: string;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const getTodayMood = () => {
    const entries = JSON.parse(localStorage.getItem('moodEntries') || '[]') as MoodEntry[];
    const today = new Date().toISOString().split('T')[0];
    return entries.find(entry => entry.date === today);
  };

  const todayMood = getTodayMood();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>{greeting}</h1>
        <p className="text-muted-foreground">How are you feeling today?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onNavigate('mood')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Mood</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todayMood ? (
              <>
                <div className="text-2xl">{todayMood.mood}</div>
                <p className="text-xs text-muted-foreground">
                  {todayMood.note}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl">Not logged</div>
                <p className="text-xs text-muted-foreground">
                  Track your mood
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onNavigate('journal')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Journal</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">Write</div>
            <p className="text-xs text-muted-foreground">
              Express your thoughts
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onNavigate('exercises')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Exercises</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">Breathe</div>
            <p className="text-xs text-muted-foreground">
              Mindfulness practices
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onNavigate('resources')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Resources</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">Learn</div>
            <p className="text-xs text-muted-foreground">
              Tips and support
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start your wellness journey today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onNavigate('mood')}>
              Log Mood
            </Button>
            <Button variant="outline" onClick={() => onNavigate('exercises')}>
              Start Breathing Exercise
            </Button>
            <Button variant="outline" onClick={() => onNavigate('journal')}>
              Write in Journal
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Remember: It's okay to not be okay. Taking time for your mental health is a sign of strength, not weakness. 
            You're doing great by being here. 💙
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
