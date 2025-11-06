import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Streak {
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
  last_check_in_date: string | null;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  earned_at: string;
}

export const useStreaks = () => {
  const { toast } = useToast();
  const [streak, setStreak] = useState<Streak>({
    current_streak: 0,
    longest_streak: 0,
    total_check_ins: 0,
    last_check_in_date: null,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
    loadAchievements();
  }, []);

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wellness_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setStreak(data);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAchievements(data);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const updateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Check if already checked in today
      if (streak.last_check_in_date === today) {
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (streak.last_check_in_date === yesterdayStr) {
        newStreak = streak.current_streak + 1;
      }

      const newLongest = Math.max(newStreak, streak.longest_streak);
      const newTotal = streak.total_check_ins + 1;

      const { error } = await supabase
        .from('wellness_streaks')
        .upsert({
          user_id: user.id,
          current_streak: newStreak,
          longest_streak: newLongest,
          total_check_ins: newTotal,
          last_check_in_date: today,
        });

      if (error) throw error;

      setStreak({
        current_streak: newStreak,
        longest_streak: newLongest,
        total_check_ins: newTotal,
        last_check_in_date: today,
      });

      // Check for achievements
      await checkAchievements(newStreak, newTotal);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const checkAchievements = async (currentStreak: number, totalCheckIns: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const milestones = [
      { streak: 3, name: 'Getting Started', type: 'streak' },
      { streak: 7, name: 'Week Warrior', type: 'streak' },
      { streak: 14, name: 'Two Week Champion', type: 'streak' },
      { streak: 30, name: 'Monthly Master', type: 'streak' },
      { streak: 100, name: 'Century Club', type: 'streak' },
    ];

    const totalMilestones = [
      { total: 10, name: 'Check-in Beginner', type: 'total' },
      { total: 50, name: 'Check-in Pro', type: 'total' },
      { total: 100, name: 'Check-in Expert', type: 'total' },
      { total: 365, name: 'Year-Round Warrior', type: 'total' },
    ];

    // Check streak achievements
    for (const milestone of milestones) {
      if (currentStreak === milestone.streak) {
        const { error } = await supabase
          .from('achievements')
          .insert({
            user_id: user.id,
            achievement_type: milestone.type,
            achievement_name: milestone.name,
          });

        if (!error) {
          toast({
            title: '🎉 Achievement Unlocked!',
            description: `${milestone.name} - ${milestone.streak} day streak!`,
          });
          loadAchievements();
        }
      }
    }

    // Check total check-ins achievements
    for (const milestone of totalMilestones) {
      if (totalCheckIns === milestone.total) {
        const { error } = await supabase
          .from('achievements')
          .insert({
            user_id: user.id,
            achievement_type: milestone.type,
            achievement_name: milestone.name,
          });

        if (!error) {
          toast({
            title: '🎉 Achievement Unlocked!',
            description: `${milestone.name} - ${milestone.total} total check-ins!`,
          });
          loadAchievements();
        }
      }
    }
  };

  return {
    streak,
    achievements,
    loading,
    updateStreak,
  };
};
