import { Sidebar } from "@/components/layout/sidebar";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Plus, Edit2 } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@shared/schema";
import { BadgeDisplay } from "@/components/badges/badge-display";
import { PersonCardsGridSkeleton } from "@/components/skeletons/person-card-skeleton";

export default function People() {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showEditPerson, setShowEditPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: "" });
  const [editingPerson, setEditingPerson] = useState<{ id: number, name: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  async function handleAddPerson() {
    try {
      const response = await apiRequest("POST", "/api/users", {
        name: newPerson.name,
      });

      // Invalidar la caché y actualizar inmediatamente
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await queryClient.setQueryData(["/api/users"], (oldData: any) => [...(oldData || []), response]);

      toast({
        title: "¡Éxito!",
        description: "Persona agregada correctamente",
        className: "bg-green-500 text-white"
      });

      setShowAddPerson(false);
      setNewPerson({ name: "" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la persona"
      });
    }
  }

  async function handleEditPerson() {
    if (!editingPerson) return;

    try {
      await apiRequest("PATCH", `/api/users/${editingPerson.id}`, {
        name: editingPerson.name,
      });

      // Invalidar la caché y forzar una actualización inmediata
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await queryClient.refetchQueries({ queryKey: ["/api/users"] });

      toast({
        title: "¡Éxito!",
        description: "Nombre actualizado correctamente",
        className: "bg-green-500 text-white"
      });

      setShowEditPerson(false);
      setEditingPerson(null);
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el nombre"
      });
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Personas</h1>
          <Button onClick={() => setShowAddPerson(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Persona
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PersonCardsGridSkeleton />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{user.name}</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingPerson({ id: user.id, name: user.name });
                            setShowEditPerson(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                      <BadgeDisplay userId={user.id} />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diálogo para agregar persona */}
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
                  onChange={(e) => setNewPerson({ name: e.target.value })}
                  placeholder="Ingresa el nombre"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddPerson(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddPerson} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Agregar Persona
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo para editar persona */}
        <Dialog open={showEditPerson} onOpenChange={setShowEditPerson}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Persona</DialogTitle>
              <DialogDescription>
                Modifica el nombre de la persona
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label>Nombre</label>
                <Input
                  value={editingPerson?.name || ""}
                  onChange={(e) => setEditingPerson(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Ingresa el nuevo nombre"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setShowEditPerson(false);
                  setEditingPerson(null);
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleEditPerson} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}