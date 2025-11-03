-- Drop the existing public profile viewing policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that restricts profile viewing to authenticated users only
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);