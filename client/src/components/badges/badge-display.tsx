import { Badge as BadgeType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Sun,
  Users,
  Crown,
  Timer,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BadgeDisplayProps {
  userId: number;
  className?: string;
}

const badgeIcons = {
  "Task Master": Trophy,
  "Early Bird": Sun,
  "Team Player": Users,
  "Productivity King": Crown,
  "Deadline Crusher": Timer
};

const badgeColors = {
  "Task Master": "bg-yellow-500",
  "Early Bird": "bg-orange-500",
  "Team Player": "bg-blue-500",
  "Productivity King": "bg-purple-500",
  "Deadline Crusher": "bg-green-500"
};

export function BadgeDisplay({ userId, className }: BadgeDisplayProps) {
  const { data: badges = [], isLoading } = useQuery<BadgeType[]>({
    queryKey: [`/api/users/${userId}/badges`],
  });

  if (isLoading) {
    return <div className="flex gap-2">Cargando badges...</div>;
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {badges.map((badge) => {
        const Icon = badgeIcons[badge.type as keyof typeof badgeIcons] || Award;
        const bgColor = badgeColors[badge.type as keyof typeof badgeColors] || "bg-gray-500";

        return (
          <motion.div
            key={badge.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            className="relative group"
          >
            <div
              className={cn(
                "p-2 rounded-full text-white transition-all duration-200",
                bgColor
              )}
              title={badge.description}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              {badge.type}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
