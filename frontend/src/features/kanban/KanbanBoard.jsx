import React, { useEffect } from 'react';
import { useKanbanStore } from '../../store/useKanbanStore';
import { DragDropContext } from '@hello-pangea/dnd';
import { io } from 'socket.io-client';

export default function KanbanBoard() {
  const { stages, opportunities, moveOpportunityOptimistic } = useKanbanStore();

  useEffect(() => {
    // ECC Constraint: Conexão Socket.io com Auth JWT
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3001', {
      auth: { token }
    });

    socket.on('connect', () => console.log('Kanban Socket Connected!'));
    
    // Conciliação via WebSocket: Quando outra pessoa (ou o worker) mover um card
    socket.on('kanban_mutated', (payload) => {
      console.log('Socket Event Received:', payload);
      // Fazer fetch do backend novamente ou usar TanStack Query invalidateQueries
    });

    return () => socket.disconnect();
  }, []);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    
    if (source.droppableId === destination.droppableId) return; // Reordenação na mesma coluna (pular na V1)

    // Atualização Otimista
    moveOpportunityOptimistic(source.droppableId, destination.droppableId, draggableId);

    try {
      // Disparar PATCH REST para o Backend (Onde a trava BLOD do Diagnosis vai validar)
      const res = await fetch(`/api/v1/opportunities/${draggableId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ targetStageId: destination.droppableId })
      });
      
      const data = await res.json();
      if (!data.success) {
        alert('Erro BLOD: ' + data.error);
        // Em caso de erro (ex: falta de diagnóstico), reverte o estado (Re-fetch ou mutação reversa)
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
      alert('Falha na conexão com o servidor.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-x-auto p-6">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Renderizar colunas aqui. Exemplo simplificado */}
        {stages.map(stage => (
          <div key={stage.id} className="min-w-[300px] bg-gray-200 rounded-lg p-4 mr-4">
            <h3 className="font-bold mb-4">{stage.name}</h3>
            {/* Aqui entraria a KanbanColumn com o Droppable do @hello-pangea/dnd */}
          </div>
        ))}
      </DragDropContext>
    </div>
  );
}
