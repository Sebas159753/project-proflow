import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  Users,
  BarChart3
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Users, label: "Personas", href: "/people" },
  { icon: BarChart3, label: "Reporting", href: "/reporting" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r bg-card">
      <div className="p-6">
        <h1 className="text-xl font-bold">Project Hub</h1>
      </div>
      <nav className="space-y-2 px-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                location === item.href && "bg-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
}