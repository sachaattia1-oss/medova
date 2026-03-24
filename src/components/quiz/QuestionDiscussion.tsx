import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, User, GraduationCap, Shield } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Discussion {
  id: string;
  quiz_question_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  user_name?: string;
  user_role?: string;
  replies?: Discussion[];
}

interface QuestionDiscussionProps {
  quizQuestionId: string;
}

const QuestionDiscussion = ({ quizQuestionId }: QuestionDiscussionProps) => {
  const { user } = useAuth();
  const { isTutor, isAdmin } = useUserRole();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, [quizQuestionId]);

  const fetchDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from("question_discussions")
        .select("*")
        .eq("quiz_question_id", quizQuestionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((d) => d.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
        const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));

        const enriched = data.map((d) => ({
          ...d,
          user_name: nameMap.get(d.user_id) || "Anonyme",
          user_role: roleMap.get(d.user_id) || "user",
        }));

        // Group: top-level questions with replies
        const topLevel = enriched.filter((d) => !d.parent_id);
        const replies = enriched.filter((d) => d.parent_id);

        const grouped = topLevel.map((q) => ({
          ...q,
          replies: replies.filter((r) => r.parent_id === q.id),
        }));

        setDiscussions(grouped);
      } else {
        setDiscussions([]);
      }
    } catch (error) {
      console.error("Error fetching discussions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostQuestion = async () => {
    if (!newQuestion.trim() || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("question_discussions").insert({
        quiz_question_id: quizQuestionId,
        user_id: user.id,
        content: newQuestion.trim(),
        parent_id: null,
      });
      if (error) throw error;
      setNewQuestion("");
      toast.success("Question posée !");
      await fetchDiscussions();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("question_discussions").insert({
        quiz_question_id: quizQuestionId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId,
      });
      if (error) throw error;
      setReplyContent("");
      setReplyTo(null);
      toast.success("Réponse envoyée !");
      await fetchDiscussions();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const getRoleIcon = (role?: string) => {
    if (role === "admin") return <Shield className="w-3 h-3" />;
    if (role === "tutor") return <GraduationCap className="w-3 h-3" />;
    return <User className="w-3 h-3" />;
  };

  const getRoleBadge = (role?: string) => {
    if (role === "admin") return <Badge variant="destructive" className="text-xs h-5">Admin</Badge>;
    if (role === "tutor") return <Badge className="text-xs h-5 bg-accent">Tuteur</Badge>;
    return null;
  };

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">
          Discussion ({discussions.length})
        </h4>
      </div>

      {/* Post a question */}
      <div className="mb-4">
        <Textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Poser une question sur ce QCM..."
          className="mb-2 min-h-[60px]"
        />
        <Button
          size="sm"
          onClick={handlePostQuestion}
          disabled={sending || !newQuestion.trim()}
        >
          {sending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
          Poser ma question
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : discussions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune question pour le moment. Soyez le premier !
        </p>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <div key={discussion.id} className="bg-muted/50 rounded-lg p-3">
              {/* Question */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getRoleIcon(discussion.user_role)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{discussion.user_name}</span>
                    {getRoleBadge(discussion.user_role)}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm">{discussion.content}</p>
                  {(isTutor || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 text-xs"
                      onClick={() => setReplyTo(replyTo === discussion.id ? null : discussion.id)}
                    >
                      Répondre
                    </Button>
                  )}
                </div>
              </div>

              {/* Replies */}
              {discussion.replies && discussion.replies.length > 0 && (
                <div className="ml-9 mt-3 space-y-3 border-l-2 border-accent/30 pl-3">
                  {discussion.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getRoleIcon(reply.user_role)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{reply.user_name}</span>
                          {getRoleBadge(reply.user_role)}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply form */}
              {replyTo === discussion.id && (
                <div className="ml-9 mt-3">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Votre réponse..."
                    className="min-h-[50px] mb-2"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReply(discussion.id)} disabled={sending || !replyContent.trim()}>
                      {sending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                      Répondre
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setReplyTo(null); setReplyContent(""); }}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionDiscussion;
