import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Reporting from "@/pages/reporting";
import People from "@/pages/people";
import Calendar from "@/pages/calendar";
import { PostItPanel } from "@/components/chat/chat-panel";
import Home from "@/pages/home";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

function AppContent() {
  const [location, setLocation] = useLocation();
  const currentUserId = localStorage.getItem("currentUserId");

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    // Redirigir a home si no hay usuario seleccionado y no estamos ya en home
    if (!currentUserId && location !== "/") {
      setLocation("/");
    }
  }, [currentUserId, location, setLocation]);

  if (isLoading) return null;

  const currentUser = users?.find((u: any) => u.id === Number(currentUserId));

  return (
    <>
      {location !== "/" && currentUser && (
        <div className="flex h-screen">
          <div className="flex-1 overflow-auto">
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/reporting" component={Reporting} />
              <Route path="/people" component={People} />
              <Route path="/calendar" component={Calendar} />
            </Switch>
          </div>
          <PostItPanel currentUser={currentUser} />
        </div>
      )}
      {(location === "/" || !currentUser) && (
        <Route path="/" component={Home} />
      )}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;