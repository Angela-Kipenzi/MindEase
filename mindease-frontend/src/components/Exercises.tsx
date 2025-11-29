import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Wind, Timer, Play, Pause, RotateCcw, ArrowLeft } from "lucide-react";

interface ExercisesProps {
  onBack?: () => void;
}

export function Exercises({ onBack }: ExercisesProps) {
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingCount, setBreathingCount] = useState(4);
  
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes default
  const [timerDuration, setTimerDuration] = useState(300);

  // Breathing exercise effect
  useEffect(() => {
    if (!breathingActive) return;

    const interval = setInterval(() => {
      setBreathingCount((prev) => {
        if (prev > 1) return prev - 1;

        // Move to next phase
        if (breathingPhase === "inhale") {
          setBreathingPhase("hold");
          return 4;
        } else if (breathingPhase === "hold") {
          setBreathingPhase("exhale");
          return 4;
        } else {
          setBreathingPhase("inhale");
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase]);

  // Meditation timer effect
  useEffect(() => {
    if (!timerActive || timerSeconds === 0) {
      if (timerSeconds === 0) {
        setTimerActive(false);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingPhase("inhale");
    setBreathingCount(4);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
  };

  const startTimer = (minutes: number) => {
    setTimerDuration(minutes * 60);
    setTimerSeconds(minutes * 60);
    setTimerActive(true);
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(timerDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getBreathingScale = () => {
    if (breathingPhase === "inhale") {
      return 1 + (4 - breathingCount) * 0.25;
    } else if (breathingPhase === "exhale") {
      return 2 - (4 - breathingCount) * 0.25;
    }
    return 2;
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
          <h1>Wellness Exercises</h1>
          <p className="text-muted-foreground">Mindfulness practices for better mental health</p>
        </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              <CardTitle>Breathing Exercise</CardTitle>
            </div>
            <CardDescription>4-4-4 breathing technique for relaxation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div
                className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center transition-transform duration-1000 ease-in-out"
                style={{
                  transform: `scale(${breathingActive ? getBreathingScale() : 1})`,
                }}
              >
                <div className="text-center">
                  {breathingActive ? (
                    <>
                      <div className="text-2xl capitalize">{breathingPhase}</div>
                      <div className="text-4xl mt-2">{breathingCount}</div>
                    </>
                  ) : (
                    <Wind className="h-12 w-12" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                {breathingActive
                  ? "Follow the circle and the instructions"
                  : "Click start to begin the breathing exercise"}
              </p>
              <div className="flex gap-2 justify-center">
                {!breathingActive ? (
                  <Button onClick={startBreathing}>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={stopBreathing} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <h4>How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Inhale deeply for 4 seconds</li>
                <li>Hold your breath for 4 seconds</li>
                <li>Exhale slowly for 4 seconds</li>
                <li>Repeat the cycle</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              <CardTitle>Meditation Timer</CardTitle>
            </div>
            <CardDescription>Guided meditation sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-6xl mb-4">{formatTime(timerSeconds)}</div>
              {timerDuration > 0 && (
                <Progress
                  value={((timerDuration - timerSeconds) / timerDuration) * 100}
                  className="w-full max-w-xs"
                />
              )}
            </div>

            {timerSeconds === timerDuration && !timerActive ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Choose a duration for your meditation
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => startTimer(5)} variant="outline">
                    5 min
                  </Button>
                  <Button onClick={() => startTimer(10)} variant="outline">
                    10 min
                  </Button>
                  <Button onClick={() => startTimer(15)} variant="outline">
                    15 min
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 justify-center">
                <Button onClick={toggleTimer}>
                  {timerActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                <Button onClick={resetTimer} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <h4>Meditation tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Find a quiet, comfortable space</li>
                <li>Focus on your breath</li>
                <li>Let thoughts pass without judgment</li>
                <li>Be patient with yourself</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Grounding Exercise</CardTitle>
          <CardDescription>5-4-3-2-1 technique for anxiety relief</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p>When feeling anxious, acknowledge:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="text-foreground">5 things</span> you can see</li>
              <li><span className="text-foreground">4 things</span> you can touch</li>
              <li><span className="text-foreground">3 things</span> you can hear</li>
              <li><span className="text-foreground">2 things</span> you can smell</li>
              <li><span className="text-foreground">1 thing</span> you can taste</li>
            </ul>
            <p className="text-sm text-muted-foreground pt-2">
              This exercise helps bring you back to the present moment and can reduce anxiety.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
