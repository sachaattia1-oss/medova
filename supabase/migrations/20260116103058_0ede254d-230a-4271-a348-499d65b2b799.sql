-- Create tutor_earnings table to track tutor payments
CREATE TABLE public.tutor_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  earning_type TEXT NOT NULL DEFAULT 'course', -- 'course', 'quiz', 'message', 'bonus'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  reference_id UUID, -- Optional reference to course, quiz, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT
);

-- Enable RLS
ALTER TABLE public.tutor_earnings ENABLE ROW LEVEL SECURITY;

-- Tutors can view their own earnings
CREATE POLICY "Tutors can view own earnings"
ON public.tutor_earnings
FOR SELECT
USING (auth.uid() = tutor_user_id);

-- Admins can manage all earnings
CREATE POLICY "Admins can manage all earnings"
ON public.tutor_earnings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_tutor_earnings_tutor_user_id ON public.tutor_earnings(tutor_user_id);
CREATE INDEX idx_tutor_earnings_status ON public.tutor_earnings(status);