import { EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

export function AccessibilityToggle() {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Load saved preference
    const savedPreference = localStorage.getItem("accessibility-high-contrast");
    if (savedPreference) {
      setHighContrast(savedPreference === "true");
    }
  }, []);

  const toggleHighContrast = (enabled: boolean) => {
    setHighContrast(enabled);
    localStorage.setItem("accessibility-high-contrast", String(enabled));
    document.documentElement.classList.toggle("high-contrast", enabled);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="w-8 h-8">
          <EyeIcon className="h-4 w-4" />
          <span className="sr-only">Toggle accessibility mode</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => toggleHighContrast(!highContrast)}
        >
          <span>{highContrast ? "Disable" : "Enable"} High Contrast</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
