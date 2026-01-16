-- Allow users to update their own role to tutor (only from 'user' to 'tutor')
CREATE POLICY "Users can request tutor role"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id AND role = 'user')
WITH CHECK (auth.uid() = user_id AND role = 'tutor');