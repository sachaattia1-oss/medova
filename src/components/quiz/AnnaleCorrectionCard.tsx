import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, User, BookOpenCheck } from "lucide-react";
import QuestionImage from "@/components/QuestionImage";
import QuestionDiscussion from "@/components/quiz/QuestionDiscussion";
import { cn } from "@/lib/utils";

interface Props {
  index: number;
  question: { id: string; question_text: string; explanation: string | null; image_url?: string | null; year?: number | null };
  answers: { id: string; answer_text: string }[];
  selectedIds: string[];
  correctIds: string[];
  score: number;
  errors: number;
  answerExplanations?: Record<string, string>;
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

const AnnaleCorrectionCard = ({ index, question, answers, selectedIds, correctIds, score, errors, answerExplanations = {} }: Props) => {
  const letter = (id: string) => LETTERS[answers.findIndex((a) => a.id === id)] ?? "?";
  const sortL = (ids: string[]) => ids.map(letter).sort().join(", ");
  const status = errors === 0 ? "Parfait" : errors <= 2 ? `${errors} erreur${errors > 1 ? "s" : ""}` : "Incorrect";
  const tone = errors === 0 ? "text-green-600 bg-green-500/10 border-green-500/30" : errors <= 2 ? "text-yellow-600 bg-yellow-500/10 border-yellow-500/30" : "text-red-600 bg-red-500/10 border-red-500/30";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Question {index + 1}</Badge>
            {question.year ? <span className="text-xs text-muted-foreground">{question.year}-{question.year + 1}</span> : null}
          </div>
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", tone)}>
            {status} · {score.toFixed(1).replace(".", ",")} / 1 pt
          </span>
        </div>
        <CardTitle className="text-base mt-2 leading-relaxed">{question.question_text}</CardTitle>
        <QuestionImage url={question.image_url ?? null} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary: your answers vs correction */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Tes réponses</p>
            <p className="font-semibold">{selectedIds.length ? sortL(selectedIds) : "Aucune réponse"}</p>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1"><BookOpenCheck className="w-3 h-3" /> Correction</p>
            <p className="font-semibold text-green-700 dark:text-green-400">{correctIds.length ? sortL(correctIds) : "Aucune proposition vraie"}</p>
          </div>
        </div>

        {/* Detailed propositions */}
        <div className="space-y-2">
          {answers.map((a, i) => {
            const isTrue = correctIds.includes(a.id);
            const picked = selectedIds.includes(a.id);
            const ok = isTrue === picked;
            return (
              <div key={a.id} className="rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0">{LETTERS[i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{a.answer_text}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <span className={cn("px-2 py-0.5 rounded-full border font-medium", isTrue ? "text-green-600 border-green-500/40 bg-green-500/10" : "text-red-600 border-red-500/40 bg-red-500/10")}>
                        {isTrue ? "VRAI" : "FAUX"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border text-muted-foreground">
                        Toi : {picked ? "cochée" : "non cochée"}
                      </span>
                      {ok ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    {answerExplanations[a.id] && (
                      <p className="text-xs text-muted-foreground mt-2 border-l-2 border-accent/40 pl-2">{answerExplanations[a.id]}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {question.explanation && (
          <div className="p-3 bg-accent/10 rounded-lg">
            <p className="text-xs font-semibold mb-1">Explication générale</p>
            <p className="text-sm">{question.explanation}</p>
          </div>
        )}

        <QuestionDiscussion quizQuestionId={question.id} />
      </CardContent>
    </Card>
  );
};

export default AnnaleCorrectionCard;
