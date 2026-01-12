import { BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  title: string;
  description?: string;
  category?: string;
  isFree?: boolean;
  progress?: number;
  thumbnailUrl?: string;
  onClick?: () => void;
}

const CourseCard = ({ 
  title, 
  description, 
  category, 
  isFree = false, 
  progress = 0,
  thumbnailUrl,
  onClick 
}: CourseCardProps) => {
  return (
    <div className="group p-4 rounded-2xl bg-card border border-border/50 hover:border-accent/30 hover:shadow-card-hover transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl bg-muted overflow-hidden mb-4">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        {!isFree && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Premium
          </div>
        )}
        {category && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-medium">
            {category}
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="font-semibold mb-1 line-clamp-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
      )}

      {/* Progress */}
      {progress > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button 
        variant={isFree ? "hero" : "outline"} 
        size="sm" 
        className="w-full"
        onClick={onClick}
      >
        {progress > 0 ? "Continuer" : "Commencer"}
      </Button>
    </div>
  );
};

export default CourseCard;
