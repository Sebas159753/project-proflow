import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const selectUser = (userId: number) => {
    localStorage.setItem("currentUserId", userId.toString());
    setLocation("/dashboard");
  };

  if (isLoading) {
    return <div>Cargando usuarios...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Bienvenido</CardTitle>
          <CardDescription className="text-center">
            Selecciona tu usuario para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((user: any) => (
              <Button
                key={user.id}
                variant="outline"
                className="w-full flex items-center justify-start gap-3 h-12"
                onClick={() => selectUser(user.id)}
              >
                <UserCircle className="h-6 w-6" />
                <span>{user.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
