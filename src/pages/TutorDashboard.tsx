import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, LogOut } from "lucide-react";
import TutorLayout from "@/components/tutor/TutorLayout";
import TutorHome from "@/pages/tutor/TutorHome";
import TutorCourses from "@/pages/tutor/TutorCourses";
import TutorQuizzes from "@/pages/tutor/TutorQuizzes";
import TutorQuizEditor from "@/pages/tutor/TutorQuizEditor";
import TutorMessages from "@/pages/tutor/TutorMessages";
import TutorEarnings from "@/pages/tutor/TutorEarnings";
import TutorDiscussions from "@/pages/tutor/TutorDiscussions";
import TutorAnnales from "@/pages/tutor/TutorAnnales";

const TutorDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isApprovedTutor, isPendingTutor, isTutor, isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admins can access tutor dashboard too
  if (!isTutor && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isPendingTutor) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">En attente de validation</CardTitle>
            <CardDescription className="text-base mt-2">
              Votre demande de compte tuteur a bien été reçue et est en cours d'examen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Prochaines étapes :</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Compte créé avec succès
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  Validation en cours
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                  Accès complet au tableau de bord
                </li>
              </ul>
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TutorLayout>
      <Routes>
        <Route path="/" element={<TutorHome />} />
        <Route path="/cours" element={<TutorCourses />} />
        <Route path="/quiz" element={<TutorQuizzes />} />
        <Route path="/quiz/:quizId" element={<TutorQuizEditor />} />
        <Route path="/annales" element={<TutorAnnales />} />
        <Route path="/messages" element={<TutorMessages />} />
        <Route path="/discussions" element={<TutorDiscussions />} />
        <Route path="/remuneration" element={<TutorEarnings />} />
      </Routes>
    </TutorLayout>
  );
};

export default TutorDashboard;
