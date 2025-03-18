import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Reporting from "@/pages/reporting";
import People from "@/pages/people";
import Calendar from "@/pages/calendar";
import { ChatPanel } from "@/components/chat/chat-panel";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/reporting" component={Reporting} />
      <Route path="/people" component={People} />
      <Route path="/calendar" component={Calendar} />
    </Switch>
  );
}

function App() {
  // Por ahora usamos un usuario de prueba
  const currentUser = {
    id: 1,
    name: "Usuario de prueba",
    points: 0,
    level: "NOVICE" as const
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen">
        <div className="flex-1 overflow-auto">
          <Router />
        </div>
        <ChatPanel currentUser={currentUser} />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;