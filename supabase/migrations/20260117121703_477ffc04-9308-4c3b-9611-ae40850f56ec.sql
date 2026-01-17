-- Drop the old quiz trigger first with CASCADE
DROP TRIGGER IF EXISTS trigger_add_tutor_earning_on_quiz ON public.quizzes;
DROP FUNCTION IF EXISTS public.add_tutor_earning_on_quiz_create() CASCADE;

-- Create new function to add earning when a series of 5 QCM is completed
CREATE OR REPLACE FUNCTION public.add_tutor_earning_on_series_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  question_count integer;
  quiz_title text;
  existing_earning_count integer;
  expected_series_count integer;
BEGIN
  -- Get the quiz info
  SELECT title INTO quiz_title
  FROM public.quizzes
  WHERE id = NEW.quiz_id;

  -- Count total questions for this quiz
  SELECT COUNT(*) INTO question_count
  FROM public.quiz_questions
  WHERE quiz_id = NEW.quiz_id;

  -- Calculate how many series we should have credited (1 series = 5 questions)
  expected_series_count := FLOOR(question_count / 5);

  -- Count existing earnings for this quiz
  SELECT COUNT(*) INTO existing_earning_count
  FROM public.tutor_earnings
  WHERE reference_id = NEW.quiz_id 
    AND earning_type = 'series';

  -- If we have a new complete series (5 questions), add earning
  IF expected_series_count > existing_earning_count AND is_approved_tutor(auth.uid()) THEN
    INSERT INTO public.tutor_earnings (
      tutor_user_id,
      amount,
      description,
      earning_type,
      status,
      reference_id
    ) VALUES (
      auth.uid(),
      3.00,
      'Série de 5 QCM: ' || COALESCE(quiz_title, 'Quiz'),
      'series',
      'pending',
      NEW.quiz_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on quiz_questions to track when series are completed
CREATE TRIGGER trigger_tutor_earning_series
  AFTER INSERT ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.add_tutor_earning_on_series_complete();