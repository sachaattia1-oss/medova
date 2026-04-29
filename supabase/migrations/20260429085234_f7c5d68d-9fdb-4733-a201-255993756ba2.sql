-- Fix subscription_type check constraint to match values sent by verify-payment edge function
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_type_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_type_check
  CHECK (subscription_type IS NULL OR subscription_type = ANY (ARRAY[
    'terminale'::text,
    'premier_semestre'::text,
    'annuel'::text,
    'monthly'::text,
    'annual'::text,
    'lifetime'::text
  ]));

-- Manually activate Mila's subscription (payment was received but activation failed)
UPDATE public.profiles
SET is_subscribed = true,
    subscription_type = 'annuel',
    subscription_expires_at = (now() + interval '12 months')
WHERE user_id = '15fb49e4-8900-4395-8ef5-73045b8b82ff';