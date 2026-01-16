-- Create a trigger to automatically add tutor earnings when a course is created
CREATE OR REPLACE FUNCTION public.add_tutor_earning_on_course_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only add earning for new courses (not updates)
  -- Check if the user creating the course is an approved tutor
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
      20.00,
      'Publication du cours: ' || NEW.title,
      'course',
      'pending',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on course insert
DROP TRIGGER IF EXISTS trigger_add_tutor_earning_on_course ON public.courses;
CREATE TRIGGER trigger_add_tutor_earning_on_course
  AFTER INSERT ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.add_tutor_earning_on_course_create();