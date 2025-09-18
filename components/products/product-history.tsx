"use client"

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditNoteDialog } from "./edit-note-dialog";
import { Edit, PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HistoryEvent {
  date: string;
  user: string;
  action: string;
  refDoc?: string;
}

interface ProductHistoryProps {
  history: HistoryEvent[];
  productId: string;
  onHistoryUpdate?: (newHistoryEntry: HistoryEvent) => void;
}

export function ProductHistory({ history, productId, onHistoryUpdate }: ProductHistoryProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editingNote, setEditingNote] = useState('');
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('edit');
  const [localHistory, setLocalHistory] = useState<HistoryEvent[]>(history);

  const handleAddNewNote = () => {
    setDialogMode('add');
    setEditingNote('');
    setEditingIndex(-1);
    setEditDialogOpen(true);
  };

  const handleEditNote = (index: number, currentNote: string) => {
    setDialogMode('edit');
    setEditingIndex(index);
    setEditingNote(currentNote);
    setEditDialogOpen(true);
  };

  const handleNoteUpdated = (updatedNote: string, isNewNote?: boolean) => {
    if (isNewNote) {
      // Add new note to the end of history
      const newHistoryEntry = {
        date: new Date().toISOString(),
        user: 'Current User', // This will be set by the server action
        action: updatedNote
      };
      setLocalHistory(prev => [...prev, newHistoryEntry]);
      
      // Call the callback to update the parent component
      if (onHistoryUpdate) {
        onHistoryUpdate(newHistoryEntry);
      }
    } else {
      // Update existing note
      const updatedHistory = [...localHistory];
      updatedHistory[editingIndex] = {
        ...updatedHistory[editingIndex],
        action: updatedNote,
        date: new Date().toISOString()
      };
      setLocalHistory(updatedHistory);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingIndex(-1);
    setEditingNote('');
  };

  // Function to check if an action is a user-added note
  const isUserNote = (action: string) => {
    // Consider it a note if it doesn't match common system actions
    const systemActions = [
      'entered', 'sold item', 'in repair', 'received', 'item returned', 'returned from repair',
      'Sent to show', 'Returned to stock', 'Out to Show', 'Return to Stock'
    ];
    return !systemActions.some(sysAction => action.toLowerCase().includes(sysAction.toLowerCase()));
  };

  if (!history || history.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          No history available for this product.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localHistory.map((historyEvent, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(historyEvent.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</TableCell>
              <TableCell className="font-medium">{historyEvent.user}</TableCell>
              <TableCell>
                <div className="flex items-center justify-between group">
                  <div className="flex-1">
                    {historyEvent.action}
                    {historyEvent.action === "sold item" && historyEvent.refDoc ? (
                      <span> - <Link style={{ color: 'blue', cursor: 'pointer' }} href={`/invoices/${historyEvent.refDoc}/view`}>
                        {historyEvent.refDoc}
                      </Link></span>
                    ) : historyEvent.action === "received" && historyEvent.refDoc ? (
                      <span> - <Link style={{ color: 'blue', cursor: 'pointer' }} href={`/loginitems/${historyEvent.refDoc}/view`}>
                        log
                      </Link></span>
                    ) : historyEvent.action.startsWith("in repair") && historyEvent.refDoc ? (
                      <span> - <Link style={{ color: 'blue', cursor: 'pointer' }} href={`/repairs/${historyEvent.refDoc}/view`}>
                        repair
                      </Link></span>
                      ) : historyEvent.action.startsWith("item memo") && historyEvent.refDoc ? (
                        <span> - <Link style={{ color: 'blue', cursor: 'pointer' }} href={`/invoices/${historyEvent.refDoc}/view`}>
                          {historyEvent.refDoc}
                        </Link></span>
                    ) : null}
                  </div>
                  {isUserNote(historyEvent.action) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-50 group-hover:opacity-100 transition-opacity ml-2"
                      onClick={() => handleEditNote(index, historyEvent.action)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Add New Note button */}
      <div className="mt-4">
        <Button 
          onClick={handleAddNewNote}
          variant="outline"
          size="sm"
        >
          <PlusCircle size={18} /> New Note
        </Button>
      </div>
      
      {/* Edit Note Dialog */}
      <EditNoteDialog
        isOpen={editDialogOpen}
        onClose={handleCloseEditDialog}
        productId={productId}
        historyIndex={editingIndex}
        currentNote={editingNote}
        onNoteUpdated={handleNoteUpdated}
        mode={dialogMode}
      />
    </div>
  );
}
