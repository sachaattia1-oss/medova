import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Loader2, User, MessageSquare, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface MyQuestion {
  id: string;
  quiz_question_id: string;
  content: string;
  created_at: string;
  question_text?: string;
  quiz_title?: string;
  replies: { id: string; content: string; created_at: string; user_name: string }[];
}

const DashboardMyQuestions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<MyQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMyQuestions();
  }, [user]);

  const fetchMyQuestions = async () => {
    if (!user) return;
    try {
      const { data: myQuestions, error } = await supabase
        .from("question_discussions")
        .select("*")
        .eq("user_id", user.id)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!myQuestions || myQuestions.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      const questionIds = myQuestions.map((q) => q.id);
      const { data: replies } = await supabase
        .from("question_discussions")
        .select("*")
        .in("parent_id", questionIds)
        .order("created_at", { ascending: true });

      // Get reply author names
      const replyUserIds = [...new Set((replies || []).map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", replyUserIds.length > 0 ? replyUserIds : ["none"]);

      const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name || "Tuteur"]));

      // Get quiz question context
      const qqIds = [...new Set(myQuestions.map((q) => q.quiz_question_id))];
      const { data: quizQuestions } = await supabase
        .from("quiz_questions")
        .select("id, question_text, quiz_id")
        .in("id", qqIds);

      const quizIds = [...new Set((quizQuestions || []).map((q) => q.quiz_id))];
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, title")
        .in("id", quizIds.length > 0 ? quizIds : ["none"]);

      const quizTitleMap = new Map((quizzes || []).map((q) => [q.id, q.title]));
      const qqMap = new Map(
        (quizQuestions || []).map((q) => [q.id, { text: q.question_text, quizTitle: quizTitleMap.get(q.quiz_id) || "QCM" }])
      );

      const result: MyQuestion[] = myQuestions.map((q) => {
        const info = qqMap.get(q.quiz_question_id);
        return {
          ...q,
          question_text: info?.text || "Question supprimée",
          quiz_title: info?.quizTitle || "QCM",
          replies: (replies || [])
            .filter((r) => r.parent_id === q.id)
            .map((r) => ({
              id: r.id,
              content: r.content,
              created_at: r.created_at,
              user_name: nameMap.get(r.user_id) || "Tuteur",
            })),
        };
      });

      setQuestions(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Mes questions</h1>
            <p className="text-muted-foreground">Retrouvez vos questions posées sur les QCM et les réponses des tuteurs</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HelpCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Vous n'avez posé aucune question pour le moment</p>
                <p className="text-sm text-muted-foreground mt-1">Posez vos questions après avoir validé un QCM !</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 pr-4">
                {questions.map((q) => {
                  const hasReplies = q.replies.length > 0;
                  return (
                    <Card key={q.id} className={hasReplies ? "border-green-500/30" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{q.quiz_title}</Badge>
                          {hasReplies ? (
                            <Badge variant="secondary" className="text-xs h-5 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Répondu
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs h-5">En attente</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground italic mt-1">
                          Question QCM : {q.question_text}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {/* My question */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">Vous</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: fr })}
                              </span>
                            </div>
                            <p className="text-sm bg-muted/50 rounded-lg p-3">{q.content}</p>
                          </div>
                        </div>

                        {/* Replies */}
                        {q.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-3 ml-11 mb-2 border-l-2 border-accent/30 pl-3">
                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-3 h-3" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{reply.user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: fr })}
                                </span>
                              </div>
                              <p className="text-sm">{reply.content}</p>
                            </div>
                          </div>
                        ))}

                        {!hasReplies && (
                          <p className="text-xs text-muted-foreground ml-11 italic">
                            Un tuteur vous répondra bientôt...
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardMyQuestions;
