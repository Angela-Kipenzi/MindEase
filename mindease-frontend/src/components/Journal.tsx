import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { journalAPI } from "../lib/api";
import type { JournalEntry as APIJournalEntry } from "../lib/api"; // Type-only import
import { toast } from "sonner";

interface JournalEntry {
  id: string;
  _id?: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

interface JournalProps {
  onBack?: () => void;
}

export function Journal({ onBack }: JournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      // Load from database first
      const dbEntries = await journalAPI.getAll();
      
      // Convert database entries to display format
      const displayEntries = dbEntries.map(entry => ({
        id: entry._id || `entry-${Date.now()}`,
        _id: entry._id,
        date: entry.date,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags,
      }));
      
      setEntries(displayEntries);
      
      // Also update localStorage with the latest data
      localStorage.setItem('journalEntries', JSON.stringify(displayEntries));
      
    } catch (error) {
      console.error('Failed to load from database, using localStorage:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('journalEntries');
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    try {
      setLoading(true);
      
      const entryData = {
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        mood: 'Neutral', // You can add mood selection later
        tags: [], // You can add tag selection later
      };

      let updatedEntry: APIJournalEntry;

      if (editingEntry && editingEntry._id) {
        // Update existing entry
        updatedEntry = await journalAPI.update(editingEntry._id, entryData);
        
        // Update local state
        setEntries(prev => prev.map(e =>
          e._id === editingEntry._id
            ? { 
                id: updatedEntry._id || e.id,
                _id: updatedEntry._id,
                date: updatedEntry.date,
                title: updatedEntry.title,
                content: updatedEntry.content,
                mood: updatedEntry.mood,
                tags: updatedEntry.tags,
              }
            : e
        ));
        
        toast.success("Journal entry updated!");
      } else {
        // Create new entry
        updatedEntry = await journalAPI.create(entryData);
        
        // Add to local state
        const newEntry: JournalEntry = {
          id: updatedEntry._id || `entry-${Date.now()}`,
          _id: updatedEntry._id,
          date: updatedEntry.date,
          title: updatedEntry.title,
          content: updatedEntry.content,
          mood: updatedEntry.mood,
          tags: updatedEntry.tags,
        };
        
        setEntries(prev => [newEntry, ...prev]);
        toast.success("Journal entry saved!");
      }

      // Update localStorage
      localStorage.setItem('journalEntries', JSON.stringify(entries));
      
      // Reset form
      setTitle("");
      setContent("");
      setEditingEntry(null);
      setDialogOpen(false);
      
    } catch (error: any) {
      console.error('Failed to save journal entry:', error);
      toast.error("Failed to save journal entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      // Find the entry to get the database ID
      const entryToDelete = entries.find(e => e.id === id);
      
      if (entryToDelete?._id) {
        // Delete from database
        await journalAPI.delete(entryToDelete._id);
      }
      
      // Update local state
      const updatedEntries = entries.filter(e => e.id !== id);
      setEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      setDeletingId(null);
      toast.success("Journal entry deleted!");
    } catch (error: any) {
      console.error('Failed to delete journal entry:', error);
      toast.error("Failed to delete journal entry. Please try again.");
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setTitle("");
      setContent("");
      setEditingEntry(null);
    }
    setDialogOpen(open);
  };

  // Function to migrate existing localStorage entries to database
  const migrateToDatabase = async () => {
    const localEntries = localStorage.getItem('journalEntries');
    if (localEntries) {
      const entries = JSON.parse(localEntries);
      let migratedCount = 0;
      
      for (const entry of entries) {
        try {
          // Skip if entry already has _id (already in database)
          if (entry._id) continue;
          
          await journalAPI.create({
            title: entry.title,
            content: entry.content,
            date: entry.date || new Date().toISOString().split('T')[0],
            mood: 'Neutral',
            tags: [],
          });
          migratedCount++;
        } catch (error) {
          console.error('Failed to migrate entry:', error);
        }
      }
      
      if (migratedCount > 0) {
        toast.success(`Migrated ${migratedCount} entries to database!`);
        loadEntries(); // Reload entries to get database IDs
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <div className="p-8 space-y-6">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1>Journal</h1>
            <p className="text-muted-foreground">Express your thoughts and feelings</p>
          </div>
          
          <div className="flex gap-2">
            {/* Migration button for existing users */}
            {entries.length > 0 && !entries[0]._id && (
              <Button variant="outline" onClick={migrateToDatabase}>
                Migrate to Cloud
              </Button>
            )}
            
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Edit Entry" : "New Journal Entry"}</DialogTitle>
                  <DialogDescription>
                    Write down your thoughts, feelings, or experiences
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Give your entry a title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="What's on your mind?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDialogClose(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={saveEntry} 
                      disabled={!title.trim() || !content.trim() || loading}
                    >
                      {loading ? "Saving..." : editingEntry ? "Update" : "Save"} Entry
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading && entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading journal entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No entries yet</CardTitle>
              <CardDescription>Start writing your first journal entry</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Journaling can help you process emotions, track your progress, and gain insights into your mental health journey.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <Card key={entry.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{entry.title}</CardTitle>
                  <CardDescription>
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {entry._id && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Cloud
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground line-clamp-4">{entry.content}</p>
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(entry)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingId(entry.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this journal entry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deletingId && deleteEntry(deletingId)}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}