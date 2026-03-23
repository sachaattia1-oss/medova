import { useEffect, useState } from "react";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_free: boolean | null;
  thumbnail_url: string | null;
  pdf_url: string | null;
}

const CourseDetail = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) setCourse(data);
      } catch (error) {
        console.error("Error fetching course:", error);
        navigate("/dashboard/cours");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="ml-64 p-8">
        <SubscriptionGate>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/cours")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux cours
        </Button>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        ) : course ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{course.title}</h1>
                  {course.is_free && (
                    <Badge variant="secondary">Gratuit</Badge>
                  )}
                </div>
                {course.category && (
                  <Badge variant="outline" className="mb-4">
                    {course.category}
                  </Badge>
                )}
                {course.description && (
                  <p className="text-muted-foreground max-w-2xl">
                    {course.description}
                  </p>
                )}
              </div>
            </div>

            {course.pdf_url ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button asChild>
                    <a href={course.pdf_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ouvrir le PDF
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={course.pdf_url} download>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </a>
                  </Button>
                </div>
                
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <iframe
                    src={course.pdf_url}
                    className="w-full h-[700px]"
                    title={`PDF - ${course.title}`}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">Aucun contenu disponible</h3>
                <p className="text-sm text-muted-foreground">
                  Le PDF de ce cours n'a pas encore été ajouté.
                </p>
              </div>
            )}
          </div>
        ) : null}
        </SubscriptionGate>
      </main>
    </div>
  );
};

export default CourseDetail;
