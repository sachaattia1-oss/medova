import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HelpCircle,
  Send,
  Loader2,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface QuizAnswer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

interface DiscussionQuestion {
  id: string;
  quiz_question_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  question_text?: string;
  quiz_title?: string;
  explanation?: string;
  answers?: QuizAnswer[];
  replies: DiscussionReply[];
}

interface DiscussionReply {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

const TutorDiscussions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<DiscussionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      // Fetch all top-level discussion questions (no parent)
      const { data: discussions, error } = await supabase
        .from("question_discussions")
        .select("*")
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!discussions || discussions.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      // Fetch replies
      const questionIds = discussions.map((d) => d.id);
      const { data: replies } = await supabase
        .from("question_discussions")
        .select("*")
        .in("parent_id", questionIds)
        .order("created_at", { ascending: true });

      // Fetch user names
      const allUserIds = [
        ...new Set([
          ...discussions.map((d) => d.user_id),
          ...(replies || []).map((r) => r.user_id),
        ]),
      ];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", allUserIds);

      const nameMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.full_name || "Anonyme"])
      );

      // Fetch quiz question texts
      const quizQuestionIds = [
        ...new Set(discussions.map((d) => d.quiz_question_id)),
      ];
      const { data: quizQuestions } = await supabase
        .from("quiz_questions")
        .select("id, question_text, quiz_id")
        .in("id", quizQuestionIds);

      // Fetch quiz titles
      const quizIds = [
        ...new Set((quizQuestions || []).map((q) => q.quiz_id)),
      ];
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, title")
        .in("id", quizIds);

      const quizTitleMap = new Map(
        (quizzes || []).map((q) => [q.id, q.title])
      );
      const qqMap = new Map(
        (quizQuestions || []).map((q) => [
          q.id,
          { text: q.question_text, quizTitle: quizTitleMap.get(q.quiz_id) || "QCM" },
        ])
      );

      const grouped: DiscussionQuestion[] = discussions.map((d) => {
        const qqInfo = qqMap.get(d.quiz_question_id);
        return {
          ...d,
          user_name: nameMap.get(d.user_id) || "Anonyme",
          question_text: qqInfo?.text || "Question supprimée",
          quiz_title: qqInfo?.quizTitle || "QCM",
          replies: (replies || [])
            .filter((r) => r.parent_id === d.id)
            .map((r) => ({
              ...r,
              user_name: nameMap.get(r.user_id) || "Anonyme",
            })),
        };
      });

      setQuestions(grouped);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (questionId: string) => {
    if (!replyContent.trim() || !user) return;
    setSending(true);

    const discussion = questions.find((q) => q.id === questionId);
    if (!discussion) return;

    try {
      const { error } = await supabase.from("question_discussions").insert({
        quiz_question_id: discussion.quiz_question_id,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: questionId,
      });
      if (error) throw error;
      setReplyContent("");
      setReplyTo(null);
      toast.success("Réponse envoyée !");
      await fetchQuestions();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unrepliedCount = questions.filter((q) => q.replies.length === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Questions des étudiants</h1>
        <p className="text-muted-foreground">
          Répondez aux questions posées sur les QCM
        </p>
        {unrepliedCount > 0 && (
          <Badge variant="destructive" className="mt-2">
            {unrepliedCount} sans réponse
          </Badge>
        )}
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucune question pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-4 pr-4">
            {questions.map((q) => {
              const isExpanded = expandedIds.has(q.id);
              const hasReplies = q.replies.length > 0;

              return (
                <Card
                  key={q.id}
                  className={!hasReplies ? "border-destructive/30" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {q.quiz_title}
                          </Badge>
                          {!hasReplies && (
                            <Badge variant="destructive" className="text-xs h-5">
                              Sans réponse
                            </Badge>
                          )}
                          {hasReplies && (
                            <Badge variant="secondary" className="text-xs h-5">
                              {q.replies.length} réponse{q.replies.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 italic">
                          Question QCM : {q.question_text}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Student's question */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{q.user_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(q.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                        <p className="text-sm bg-muted/50 rounded-lg p-3">
                          {q.content}
                        </p>
                      </div>
                    </div>

                    {/* Replies toggle */}
                    {hasReplies && (
                      <button
                        onClick={() => toggleExpand(q.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 ml-11"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        {q.replies.length} réponse{q.replies.length > 1 ? "s" : ""}
                      </button>
                    )}

                    {/* Replies */}
                    {isExpanded &&
                      q.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="flex items-start gap-3 ml-11 mb-2 border-l-2 border-accent/30 pl-3"
                        >
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-3 h-3" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {reply.user_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.created_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                            </div>
                            <p className="text-sm">{reply.content}</p>
                          </div>
                        </div>
                      ))}

                    {/* Reply form */}
                    {replyTo === q.id ? (
                      <div className="ml-11 mt-2">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Votre réponse..."
                          className="min-h-[60px] mb-2"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReply(q.id)}
                            disabled={sending || !replyContent.trim()}
                          >
                            {sending ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Send className="w-3 h-3 mr-1" />
                            )}
                            Envoyer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReplyTo(null);
                              setReplyContent("");
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-11 mt-1"
                        onClick={() => {
                          setReplyTo(q.id);
                          setExpandedIds((prev) => new Set(prev).add(q.id));
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Répondre
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default TutorDiscussions;
