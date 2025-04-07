import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import { useQuery } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Reporting = lazy(() => import("@/pages/reporting"));
const People = lazy(() => import("@/pages/people"));
const Calendar = lazy(() => import("@/pages/calendar"));
import { PostItPanel } from "@/components/chat/chat-panel";


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
            <Suspense fallback={<div>Loading...</div>}>
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/reporting" component={Reporting} />
                <Route path="/people" component={People} />
                <Route path="/calendar" component={Calendar} />
              </Switch>
            </Suspense>
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