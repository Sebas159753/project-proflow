import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Plus, Mail, Edit2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function People() {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: "", avatar: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  async function handleAddPerson() {
    try {
      await apiRequest("POST", "/api/users", {
        name: newPerson.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newPerson.name}`
      });

      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "¡Éxito!",
        description: "Persona agregada correctamente",
        className: "bg-green-500 text-white"
      });

      setShowAddPerson(false);
      setNewPerson({ name: "", avatar: "" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la persona"
      });
    }
  }

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Personas</h1>
          <Button onClick={() => setShowAddPerson(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Persona
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user: any) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Contactar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showAddPerson} onOpenChange={setShowAddPerson}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Persona</DialogTitle>
              <DialogDescription>
                Ingresa los datos de la nueva persona
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label>Nombre</label>
                <Input
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                  placeholder="Ingresa el nombre"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddPerson(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddPerson}>
                  Agregar Persona
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
