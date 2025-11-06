import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Smile } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const moods = [
  { value: 'great', label: 'Great', color: '#10b981' },
  { value: 'good', label: 'Good', color: '#3b82f6' },
  { value: 'okay', label: 'Okay', color: '#f59e0b' },
  { value: 'bad', label: 'Bad', color: '#ef4444' },
  { value: 'terrible', label: 'Terrible', color: '#991b1b' },
];

const MoodInsights = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);

  const { data: moodEntries, isLoading } = useQuery({
    queryKey: ['mood-insights', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = startOfDay(subDays(new Date(), days));

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Prepare data for charts
  const moodOverTime = moodEntries?.map((entry) => ({
    date: format(new Date(entry.created_at), 'MMM dd'),
    mood: entry.mood,
    intensity: entry.intensity,
  })) || [];

  const moodFrequency = moods.map((mood) => ({
    name: mood.label,
    count: moodEntries?.filter((e) => e.mood === mood.value).length || 0,
    color: mood.color,
  }));

  const avgIntensity = moodEntries?.length
    ? (moodEntries.reduce((sum, e) => sum + e.intensity, 0) / moodEntries.length).toFixed(1)
    : 0;

  const mostCommonMood = moodFrequency.reduce((prev, current) =>
    current.count > prev.count ? current : prev
  );

  return (
    <div className="min-h-screen bg-gradient-calm p-4">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            Mood Insights
          </h1>
          <p className="text-muted-foreground">
            Visualize your emotional patterns and trends
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={days === 7 ? 'default' : 'outline'}
            onClick={() => setDays(7)}
            size="sm"
          >
            7 Days
          </Button>
          <Button
            variant={days === 30 ? 'default' : 'outline'}
            onClick={() => setDays(30)}
            size="sm"
          >
            30 Days
          </Button>
          <Button
            variant={days === 90 ? 'default' : 'outline'}
            onClick={() => setDays(90)}
            size="sm"
          >
            90 Days
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : moodEntries && moodEntries.length > 0 ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Check-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {moodEntries.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Intensity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {avgIntensity}/10
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Most Common Mood</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Smile className="w-6 h-6" style={{ color: mostCommonMood.color }} />
                    {mostCommonMood.name}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Mood Intensity Over Time</CardTitle>
                  <CardDescription>Track how your mood intensity changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={moodOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="intensity"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>How often you experience each mood</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={moodFrequency.filter((m) => m.count > 0)}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {moodFrequency.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Mood Frequency</CardTitle>
                  <CardDescription>Count of each mood logged</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={moodFrequency}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count">
                        {moodFrequency.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Smile className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No mood data yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your moods to see insights and trends
              </p>
              <Button onClick={() => navigate('/mood-tracker')}>
                Track Your Mood
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MoodInsights;
