import { User, UserLevels } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface UserLevelDisplayProps {
  user: User;
}

function calculateProgress(points: number): { currentLevel: string; progress: number; nextLevel?: string } {
  const levels = Object.entries(UserLevels);
  
  for (let i = 0; i < levels.length - 1; i++) {
    const [currentLevelKey, currentLevel] = levels[i];
    const [nextLevelKey, nextLevel] = levels[i + 1];
    
    if (points >= currentLevel.minPoints && points < nextLevel.minPoints) {
      const range = nextLevel.minPoints - currentLevel.minPoints;
      const progress = ((points - currentLevel.minPoints) / range) * 100;
      return {
        currentLevel: currentLevelKey,
        progress: Math.min(progress, 100),
        nextLevel: nextLevelKey
      };
    }
  }
  
  // Si el usuario ha alcanzado el nivel máximo
  const [maxLevelKey] = levels[levels.length - 1];
  return {
    currentLevel: maxLevelKey,
    progress: 100
  };
}

export function UserLevelDisplay({ user }: UserLevelDisplayProps) {
  // Si no hay usuario, mostramos un estado por defecto
  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Sin usuario</span>
          <span className="text-xs text-muted-foreground">0 puntos</span>
        </div>
        <div className="w-32">
          <Progress value={0} className="h-2" />
        </div>
      </div>
    );
  }

  const { currentLevel, progress, nextLevel } = calculateProgress(user.points);
  const currentLevelInfo = UserLevels[currentLevel as keyof typeof UserLevels];
  const nextLevelInfo = nextLevel ? UserLevels[nextLevel as keyof typeof UserLevels] : null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{currentLevelInfo.name}</span>
        <span className="text-xs text-muted-foreground">{user.points} puntos</span>
      </div>
      <div className="w-32">
        <Progress value={progress} className="h-2" />
        {nextLevelInfo && (
          <span className="text-xs text-muted-foreground mt-1">
            Siguiente: {nextLevelInfo.name}
          </span>
        )}
      </div>
    </div>
  );
}
