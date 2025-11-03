-- Fix username collision by adding random suffix for uniqueness
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_username text;
  final_username text;
  username_exists boolean;
  attempt_count int := 0;
BEGIN
  -- Generate base username from display_name or email
  base_username := COALESCE(
    lower(regexp_replace(NEW.raw_user_meta_data->>'username', '[^a-zA-Z0-9]', '', 'g')),
    lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'))
  );
  
  -- Ensure base_username is not empty
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  final_username := base_username;
  
  -- Check if username exists and add random suffix if needed
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) INTO username_exists;
    
    IF NOT username_exists THEN
      EXIT;
    END IF;
    
    -- Add random 4-digit suffix
    final_username := base_username || floor(random() * 9999 + 1000)::text;
    attempt_count := attempt_count + 1;
    
    -- Prevent infinite loop (should never happen, but safety first)
    IF attempt_count > 10 THEN
      final_username := base_username || gen_random_uuid()::text;
      EXIT;
    END IF;
  END LOOP;
  
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    final_username
  );
  RETURN NEW;
END;
$$;

-- Add DELETE policy for messages table
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- Add DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);