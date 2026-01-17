-- Create function to add tutor earning when a quiz is created
CREATE OR REPLACE FUNCTION public.add_tutor_earning_on_quiz_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the user creating the quiz is an approved tutor
  IF is_approved_tutor(auth.uid()) THEN
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
      'Publication du quiz: ' || NEW.title,
      'quiz',
      'pending',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on quizzes table
CREATE TRIGGER trigger_add_tutor_earning_on_quiz
  AFTER INSERT ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.add_tutor_earning_on_quiz_create();