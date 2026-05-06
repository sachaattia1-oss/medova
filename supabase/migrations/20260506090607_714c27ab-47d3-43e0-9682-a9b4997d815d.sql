
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE p.user_id = u.id AND p.email IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  INSERT INTO public.user_activity (user_id, is_online, last_active_at)
  VALUES (NEW.id, true, now());

  RETURN NEW;
END;
$$;
