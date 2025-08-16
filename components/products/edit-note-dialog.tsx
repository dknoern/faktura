"use client"

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { updateProductHistoryNote, addProductHistoryNote } from "@/app/actions/inventory";

interface EditNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  historyIndex?: number; // Optional for add mode
  currentNote: string;
  onNoteUpdated: (updatedNote: string, isNewNote?: boolean) => void;
  mode: 'add' | 'edit';
}

export function EditNoteDialog({
  isOpen,
  onClose,
  productId,
  historyIndex,
  currentNote,
  onNoteUpdated,
  mode,
}: EditNoteDialogProps) {
  const [note, setNote] = useState(currentNote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update note state when dialog opens with new currentNote
  useEffect(() => {
    if (isOpen) {
      setNote(currentNote);
      // Position cursor at end of text instead of selecting all
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(currentNote.length, currentNote.length);
        }
      }, 100);
    }
  }, [isOpen, currentNote]);

  const handleSave = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note before saving.");
      return;
    }

    if (mode === 'edit' && note.trim() === currentNote.trim()) {
      toast.error("No changes made to the note.");
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      
      if (mode === 'add') {
        result = await addProductHistoryNote(productId, note.trim());
        if (result.success) {
          toast.success("Note added successfully.");
          onNoteUpdated(note.trim(), true); // true indicates new note
          onClose();
        } else {
          toast.error(result.error || "Failed to add note.");
        }
      } else {
        // Edit mode
        if (historyIndex === undefined) {
          toast.error("Invalid history index for editing.");
          return;
        }
        result = await updateProductHistoryNote(productId, historyIndex, note.trim());
        if (result.success) {
          toast.success("Note updated successfully.");
          onNoteUpdated(note.trim(), false); // false indicates existing note
          onClose();
        } else {
          toast.error(result.error || "Failed to update note.");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNote(currentNote); // Reset to original note
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] top-[10%] translate-y-0">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Note' : 'Edit Note'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Add a new note to the product history. Click save when you are done.'
              : 'Make changes to the product history note. Click save when you are done.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">
              Note
            </Label>
            <Input
              ref={inputRef}
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              disabled={isSubmitting}
              placeholder="Enter note..."
            />
          </div>
        </div>
        <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !note.trim()}
          >
            {isSubmitting ? "Saving..." : "Save note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
