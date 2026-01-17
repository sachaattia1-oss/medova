
-- Create the trigger on course insert (function already exists)
DROP TRIGGER IF EXISTS trigger_add_tutor_earning_on_course ON public.courses;
CREATE TRIGGER trigger_add_tutor_earning_on_course
  AFTER INSERT ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.add_tutor_earning_on_course_create();
