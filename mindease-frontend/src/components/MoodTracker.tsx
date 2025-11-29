import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft } from "lucide-react";
import { moodAPI } from "../lib/api";
import { toast } from "sonner";

interface MoodEntry {
  date: string;
  mood: string;
  note: string;
}

// Updated to match backend expected values
const moodEmojis = [
  { emoji: "😄", label: "Great", value: 5 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😔", label: "Not Great", value: 2 },  // Changed from "Low" to "Not Great"
  { emoji: "😢", label: "Bad", value: 1 },        // Changed from "Difficult" to "Bad"
];

interface MoodTrackerProps {
  onBack?: () => void;
}

export function MoodTracker({ onBack }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMoodEntries();
  }, []);

  const loadMoodEntries = async () => {
    try {
      setLoading(true);
      // Try to load from database first
      const dbEntries = await moodAPI.getAll();
      
      // Convert database entries to display format
      const displayEntries = dbEntries.map(entry => {
        const moodEmoji = moodEmojis.find(m => m.label === entry.mood)?.emoji || '😐';
        return {
          date: entry.date,
          mood: moodEmoji,
          note: entry.note || '', // Handle empty notes
        };
      });
      
      setEntries(displayEntries);
      
      // Also update localStorage with the latest data
      localStorage.setItem('moodEntries', JSON.stringify(displayEntries));
      
    } catch (error) {
      console.error('Failed to load from database, using localStorage:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('moodEntries');
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveMood = async () => {
    if (!selectedMood) {
      toast.error("Please select a mood first");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Convert emoji to text mood for database
    const moodText = moodEmojis.find(m => m.emoji === selectedMood)?.label;
    if (!moodText) {
      toast.error("Invalid mood selection");
      return;
    }
    
    console.log('Saving mood:', { date: today, mood: moodText, note: note || '' }); // Debug log
    
    const newEntry = {
      date: today,
      mood: moodText as 'Great' | 'Good' | 'Okay' | 'Not Great' | 'Bad',
      note: note || '', // Ensure note is never undefined
    };

    try {
      setLoading(true);
      // Save to database
      await moodAPI.create(newEntry);
      
      // Also update localStorage for immediate UI updates
      const updatedEntries = entries.filter(e => e.date !== today);
      updatedEntries.push({
        date: today,
        mood: selectedMood, // Keep emoji for display
        note: note,
      });
      updatedEntries.sort((a, b) => b.date.localeCompare(a.date));

      setEntries(updatedEntries);
      localStorage.setItem('moodEntries', JSON.stringify(updatedEntries));
      setNote("");
      setSelectedMood("");
      
      toast.success("Mood saved successfully!");
    } catch (error: any) {
      console.error('Failed to save mood:', error);
      
      // More specific error messages
      if (error.message.includes('Date and mood are required')) {
        toast.error("Please select a mood to save");
      } else if (error.message.includes('Invalid mood value')) {
        toast.error("Invalid mood selection. Please try again.");
      } else {
        toast.error("Failed to save mood. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    return entries
      .slice(0, 7)
      .reverse()
      .map(entry => {
        const mood = moodEmojis.find(m => m.emoji === entry.mood);
        return {
          date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: mood?.value || 0,
        };
      });
  };

  const todayEntry = entries.find(e => e.date === new Date().toISOString().split('T')[0]);

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
          <h1>Mood Tracker</h1>
          <p className="text-muted-foreground">Track how you're feeling each day</p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
          <CardDescription>Select your mood and add a note</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Your Mood</Label>
            <div className="flex gap-4 flex-wrap">
              {moodEmojis.map((mood) => (
                <button
                  key={mood.emoji}
                  onClick={() => setSelectedMood(mood.emoji)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedMood === mood.emoji
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-4xl">{mood.emoji}</span>
                  <span className="text-sm">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notes (optional)</Label>
            <Textarea
              id="note"
              placeholder="What's on your mind?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={saveMood} disabled={!selectedMood || loading}>
            {loading ? "Saving..." : todayEntry ? "Update Today's Mood" : "Save Mood"}
          </Button>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Mood This Week</CardTitle>
              <CardDescription>Visual representation of your recent moods</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries.slice(0, 10).map((entry) => (
                  <div
                    key={entry.date}
                    className="flex items-start gap-4 p-4 rounded-lg border"
                  >
                    <span className="text-3xl">{entry.mood}</span>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      {entry.note && (
                        <p className="mt-1">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </div>
  );
}