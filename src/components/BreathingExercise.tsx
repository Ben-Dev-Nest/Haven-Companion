import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind } from "lucide-react";

const exercises = [
  {
    name: "Box Breathing",
    description: "Inhale, hold, exhale, hold - each for 4 seconds",
    phases: [
      { name: "Inhale", duration: 4 },
      { name: "Hold", duration: 4 },
      { name: "Exhale", duration: 4 },
      { name: "Hold", duration: 4 },
    ],
  },
  {
    name: "4-7-8 Breathing",
    description: "Inhale for 4, hold for 7, exhale for 8 seconds",
    phases: [
      { name: "Inhale", duration: 4 },
      { name: "Hold", duration: 7 },
      { name: "Exhale", duration: 8 },
    ],
  },
  {
    name: "Calm Breathing",
    description: "Simple 5-second inhale and exhale",
    phases: [
      { name: "Inhale", duration: 5 },
      { name: "Exhale", duration: 5 },
    ],
  },
];

const BreathingExercise = () => {
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const exercise = exercises[selectedExercise];

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft === 0) {
      const nextPhase = (currentPhase + 1) % exercise.phases.length;
      setCurrentPhase(nextPhase);
      setTimeLeft(exercise.phases[nextPhase].duration);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isActive, timeLeft, currentPhase, exercise.phases]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentPhase(0);
    setTimeLeft(exercise.phases[0].duration);
  };

  const handleStop = () => {
    setIsActive(false);
    setCurrentPhase(0);
    setTimeLeft(0);
  };

  const progress = timeLeft > 0
    ? ((exercise.phases[currentPhase].duration - timeLeft) / exercise.phases[currentPhase].duration) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wind className="h-5 w-5" />
          Breathing Exercises
        </CardTitle>
        <CardDescription>
          Take a moment to center yourself with guided breathing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          {exercises.map((ex, index) => (
            <Button
              key={ex.name}
              variant={selectedExercise === index ? "default" : "outline"}
              onClick={() => {
                setSelectedExercise(index);
                handleStop();
              }}
              size="sm"
            >
              {ex.name}
            </Button>
          ))}
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{exercise.description}</p>

          {isActive ? (
            <div className="space-y-6">
              <div className="relative w-48 h-48 mx-auto">
                <div
                  className="absolute inset-0 rounded-full border-8 border-primary/20 transition-all duration-1000"
                  style={{
                    transform: `scale(${0.5 + (progress / 200)})`,
                    opacity: 0.3 + (progress / 200),
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{timeLeft}</div>
                    <div className="text-lg text-muted-foreground">
                      {exercise.phases[currentPhase].name}
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={handleStop} variant="outline">
                Stop
              </Button>
            </div>
          ) : (
            <Button onClick={handleStart} size="lg">
              Start Exercise
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BreathingExercise;
