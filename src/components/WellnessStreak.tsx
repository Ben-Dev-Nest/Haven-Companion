import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy, Target } from 'lucide-react';
import { useStreaks } from '@/hooks/useStreaks';
import { Badge } from '@/components/ui/badge';

export const WellnessStreak = () => {
  const { streak, achievements, loading } = useStreaks();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Wellness Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Wellness Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {streak.current_streak}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Current Streak
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-3xl font-bold text-accent">
              <Trophy className="w-6 h-6" />
              {streak.longest_streak}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Best Streak
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-3xl font-bold text-secondary">
              <Target className="w-6 h-6" />
              {streak.total_check_ins}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total Check-ins
            </div>
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Recent Achievements</h4>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 3).map((achievement) => (
                <Badge key={achievement.id} variant="secondary" className="text-xs">
                  🏆 {achievement.achievement_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {streak.current_streak === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Start your wellness journey today! 🌱
          </p>
        )}
      </CardContent>
    </Card>
  );
};
