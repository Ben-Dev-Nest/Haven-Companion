import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Plus, Heart, MessageCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostWithProfile {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Community = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: groups } = useQuery({
    queryKey: ['community-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const { data: posts, isLoading } = useQuery<PostWithProfile[]>({
    queryKey: ['community-posts', selectedGroup],
    queryFn: async () => {
      let query = supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedGroup) {
        query = query.eq('group_id', selectedGroup);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;
      
      // Fetch profiles for non-anonymous posts
      const userIds = [...new Set(postsData?.filter(p => !p.is_anonymous).map(p => p.user_id) || [])];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        // Merge profile data with posts
        return postsData?.map(post => ({
          ...post,
          profile: profilesData?.find(p => p.id === post.user_id)
        })) || [];
      }

      return postsData || [];
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!selectedGroup) throw new Error('Please select a group');

      const { error } = await supabase
        .from('community_posts')
        .insert({
          group_id: selectedGroup,
          user_id: user.id,
          title: newPostTitle,
          content: newPostContent,
          is_anonymous: isAnonymous,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewPostTitle('');
      setNewPostContent('');
      setIsAnonymous(false);
      setDialogOpen(false);
      toast({
        title: 'Post created',
        description: 'Your post has been shared with the community.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('community_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('community_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;

        // Update count
        const post = posts?.find(p => p.id === postId);
        if (post) {
          await supabase
            .from('community_posts')
            .update({ likes_count: Math.max(0, post.likes_count - 1) })
            .eq('id', postId);
        }
      } else {
        // Like
        const { error } = await supabase
          .from('community_likes')
          .insert({
            user_id: user.id,
            post_id: postId,
          });

        if (error) throw error;

        // Update count
        const post = posts?.find(p => p.id === postId);
        if (post) {
          await supabase
            .from('community_posts')
            .update({ likes_count: post.likes_count + 1 })
            .eq('id', postId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-calm p-4">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Community Support
          </h1>
          <p className="text-muted-foreground">
            Connect with others on their wellness journey
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Groups Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Support Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedGroup === null ? 'default' : 'ghost'}
                className="w-full justify-start text-sm"
                onClick={() => setSelectedGroup(null)}
              >
                All Posts
              </Button>
              {groups?.map((group) => (
                <Button
                  key={group.id}
                  variant={selectedGroup === group.id ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <span className="mr-2">{group.icon}</span>
                  {group.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="lg:col-span-3 space-y-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={!selectedGroup}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                  <DialogDescription>
                    Share your thoughts and experiences with the community
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Give your post a title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={6}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="anonymous">Post anonymously</Label>
                    <Switch
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                  </div>
                  <Button
                    onClick={() => createPostMutation.mutate()}
                    disabled={!newPostTitle || !newPostContent || createPostMutation.isPending}
                    className="w-full"
                  >
                    Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {post.is_anonymous ? (
                            <>
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Anonymous</span>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium">
                                {post.profile?.display_name || 'User'}
                              </span>
                            </>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLikeMutation.mutate(post.id)}
                          className="gap-2"
                        >
                          <Heart className="w-4 h-4" />
                          {post.likes_count}
                        </Button>
                        <Badge variant="outline" className="gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.comments_count}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share in this group
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
