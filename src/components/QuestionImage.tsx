interface QuestionImageProps {
  url?: string | null;
  className?: string;
}

/** Schéma / photo joint(e) à une question, affiché sous l'énoncé. */
const QuestionImage = ({ url, className = "" }: QuestionImageProps) => {
  if (!url) return null;
  return (
    <div className={`mt-3 rounded-lg overflow-hidden border border-border/60 bg-muted/30 ${className}`}>
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt="Schéma de la question"
          loading="lazy"
          className="w-full max-h-[420px] object-contain bg-background"
        />
      </a>
    </div>
  );
};

export default QuestionImage;
