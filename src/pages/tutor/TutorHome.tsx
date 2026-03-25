import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TutorHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    coursesCount: 0,
    quizzesCount: 0,
    unreadMessages: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Count courses by this tutor
        const { count: coursesCount } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id);

        // Count quizzes by this tutor
        const { count: quizzesCount } = await supabase
          .from("quizzes")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id);

        // Count unread conversations
        const { count: unreadMessages } = await supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("is_read_by_admin", false);

        // Fetch recent courses by this tutor
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title, category, created_at, target_audience")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentCourses(courses || []);
        setStats({
          coursesCount: coursesCount || 0,
          quizzesCount: quizzesCount || 0,
          unreadMessages: unreadMessages || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const statsData = [
    { label: "Cours créés", value: stats.coursesCount.toString(), icon: BookOpen, color: "text-green-500" },
    { label: "Messages non lus", value: stats.unreadMessages.toString(), icon: MessageSquare, color: "text-amber-500" },
    { label: "Quiz créés", value: stats.quizzesCount.toString(), icon: BarChart3, color: "text-purple-500" },
  ];

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Bienvenue, Tuteur ! 👋</h2>
        <p className="text-muted-foreground">
          Gérez vos cours, créez des quiz et répondez aux questions de vos étudiants.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statsData.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Derniers cours
            </CardTitle>
            <CardDescription>
              Vos cours les plus récents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Accédez à "Mes cours" pour voir et créer des cours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages récents
            </CardTitle>
            <CardDescription>
              Questions des étudiants en attente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Accédez à "Messages" pour voir les questions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TutorHome;
