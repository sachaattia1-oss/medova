import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, ExternalLink, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_free: boolean | null;
  thumbnail_url: string | null;
  pdf_url: string | null;
  revision_pdf_url: string | null;
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

  const renderPdfViewer = (url: string | null, label: string) => {
    if (!url) {
      return (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Aucun contenu disponible</h3>
          <p className="text-sm text-muted-foreground">
            {label} n'a pas encore été ajouté(e).
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir le PDF
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={url} download>
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </a>
          </Button>
        </div>
        
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <iframe
            src={url}
            className="w-full h-[700px]"
            title={label}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="ml-64 p-8">
        
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

            <Tabs defaultValue="cours" className="w-full">
              <TabsList>
                <TabsTrigger value="cours" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Cours
                </TabsTrigger>
                <TabsTrigger value="revision" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Fiche de révision
                </TabsTrigger>
              </TabsList>
              <TabsContent value="cours">
                {renderPdfViewer(course.pdf_url, "Le PDF de ce cours")}
              </TabsContent>
              <TabsContent value="revision">
                {renderPdfViewer(course.revision_pdf_url, "La fiche de révision")}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
        
      </main>
    </div>
  );
};

export default CourseDetail;
