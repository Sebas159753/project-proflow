import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, Users, BarChart3 } from "lucide-react";
import { LogoWithText } from "@/components/brand/logo";

const menuItems = [
  { icon: LayoutDashboard, label: "Panel", href: "/" },
  { icon: Calendar, label: "Calendario", href: "/calendar" },
  { icon: Users, label: "Personas", href: "/people" },
  { icon: BarChart3, label: "Reportes", href: "/reporting" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r bg-blue-900">
      <div className="p-6">
        <LogoWithText className="text-white" />
      </div>
      <nav className="space-y-2 px-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 transition-colors text-white",
                location === item.href
                  ? "bg-white/20 hover:bg-white/30"
                  : "hover:bg-white/10",
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
