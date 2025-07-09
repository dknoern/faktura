"use client"

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { addProductHistoryNote } from "@/app/actions/inventory";
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
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await addProductHistoryNote(productId, note.trim());
      
      if (result.success) {
        toast.success("Note added to product history.");
        
        // Clear the input
        setNote('');
        
        // Call the callback to update the parent component
        if (onHistoryUpdate && result.data) {
          onHistoryUpdate(result.data);
        }
      } else {
        toast.error(result.error || "Failed to add note.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          No history available for this product.
        </div>
        
        {/* Add note section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Add note</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter a note about this product..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
            />
            <Button 
              onClick={handleAddNote}
              disabled={isSubmitting || !note.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
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
          {history.map((historyEvent, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(historyEvent.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</TableCell>
              <TableCell className="font-medium">{historyEvent.user}</TableCell>
              <TableCell>
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
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Add note section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Add note</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Enter a note about this product..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSubmitting}
          />
          <Button 
            onClick={handleAddNote}
            disabled={isSubmitting || !note.trim()}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
}
