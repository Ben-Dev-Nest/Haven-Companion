import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Smile, Meh, Frown, Angry, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const moods = [
  { value: "great", label: "Great", icon: Smile, color: "text-green-500" },
  { value: "good", label: "Good", icon: Heart, color: "text-blue-500" },
  { value: "okay", label: "Okay", icon: Meh, color: "text-yellow-500" },
  { value: "bad", label: "Bad", icon: Frown, color: "text-orange-500" },
  { value: "terrible", label: "Terrible", icon: Angry, color: "text-red-500" },
];

const MoodTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: moodHistory } = useQuery({
    queryKey: ["mood-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("mood_entries").insert({
        user_id: user.id,
        mood: selectedMood,
        intensity,
        note: note || null,
      });

      if (error) throw error;

      toast({
        title: "Mood logged successfully",
        description: "Keep tracking your emotional journey!",
      });

      setSelectedMood("");
      setIntensity(3);
      setNote("");
    } catch (error) {
      console.error("Error logging mood:", error);
      toast({
        title: "Failed to log mood",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mood Tracker</h1>
            <p className="text-muted-foreground">How are you feeling today?</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log Your Mood</CardTitle>
            <CardDescription>
              Track your emotional state to identify patterns and triggers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-3 block">Select Mood</label>
              <div className="grid grid-cols-5 gap-2">
                {moods.map((mood) => {
                  const Icon = mood.icon;
                  return (
                    <Button
                      key={mood.value}
                      variant={selectedMood === mood.value ? "default" : "outline"}
                      className="flex flex-col h-auto py-4"
                      onClick={() => setSelectedMood(mood.value)}
                    >
                      <Icon className={`h-8 w-8 mb-2 ${mood.color}`} />
                      <span className="text-xs">{mood.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">
                Intensity: {intensity}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">
                Add a note (optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
              />
            </div>

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
              Log Mood
            </Button>
          </CardContent>
        </Card>

        {moodHistory && moodHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moodHistory.map((entry) => {
                  const mood = moods.find((m) => m.value === entry.mood);
                  const Icon = mood?.icon || Meh;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <Icon className={`h-6 w-6 mt-1 ${mood?.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{entry.mood}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Intensity: {entry.intensity}/5
                        </p>
                        {entry.note && (
                          <p className="text-sm mt-2">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;
