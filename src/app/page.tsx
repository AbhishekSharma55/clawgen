'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Folder, Calendar, ArrowRight, LayoutGrid, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, []);

  const filteredProjects = projects
    .filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const createProject = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFBFD] dark:bg-background transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-2 rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-primary/80">Active Engine</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              Claw<span className="text-primary italic">Gen</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mt-4 max-w-xl leading-relaxed">
              Architect your next OpenClaw project with AI-powered precision and elegance.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full px-8 py-6 h-auto text-lg font-medium shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                <Plus className="mr-2 h-5 w-5" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <DialogHeader className="relative z-10 pt-4 px-2">
                <DialogTitle className="text-2xl font-bold">Initialize Project</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground pt-1">
                  Define your vision. ClawGen handles the infrastructure.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1 text-foreground/80">Project Identifier</label>
                  <Input
                    placeholder="e.g. quantum-neural-mesh"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createProject()}
                    className="h-12 bg-muted/40 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1 text-foreground/80">Objective / Description</label>
                  <Textarea
                    placeholder="What are we building today?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onKeyDown={e => (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) && createProject()}
                    className="min-h-[120px] bg-muted/40 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl resize-none transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground/60 ml-1">
                    Press <kbd className="font-sans">Cmd + Enter</kbd> to launch
                  </p>
                </div>
              </div>
              <DialogFooter className="relative z-10 sm:justify-between items-center gap-4 bg-muted/30 -mx-6 -mb-6 p-6">
                <p className="text-xs text-muted-foreground hidden sm:block italic">
                  Enter to initiate build sequence
                </p>
                <Button
                  onClick={createProject}
                  disabled={loading || !name.trim()}
                  className="rounded-full px-8 h-12 font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto"
                >
                  {loading ? 'Initializing...' : 'Launch Construction'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        {/* Project Explorer */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-lg uppercase tracking-widest text-muted-foreground/60">Registry</h2>
              <span className="text-xs font-medium text-muted-foreground/40 ml-2 px-2 py-0.5 bg-muted/50 rounded-full">{filteredProjects.length} of {projects.length}</span>
            </div>

            <div className="relative w-full md:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white/50 dark:bg-muted/20 border-border/40 hover:border-border/80 focus-visible:ring-primary/20 rounded-xl transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center border border-dashed border-border/60">
                  <Folder className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {projects.length === 0 ? "Your workspace is silent" : "No matches found"}
                  </h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                    {projects.length === 0
                      ? "Start your first project to begin generating powerful AI systems."
                      : `We couldn't find any projects matching "${searchQuery}"`}
                  </p>
                </div>
                {projects.length === 0 ? (
                  <Button variant="outline" className="rounded-full mt-4" onClick={() => setIsDialogOpen(true)}>
                    Create first project
                  </Button>
                ) : (
                  <Button variant="link" className="text-primary" onClick={() => setSearchQuery('')}>
                    Clear search query
                  </Button>
                )}
              </div>
            )}

            {filteredProjects.map((p, idx) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group block"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <Card className="h-full border-border/40 bg-white/70 dark:bg-card/40 backdrop-blur-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 group-hover:border-primary/20 rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 transition-colors">
                        <Folder className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground/30 opacity-0 -translate-x-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors duration-300">
                      {p.name}
                    </CardTitle>
                    {p.description && (
                      <CardDescription className="line-clamp-2 text-[15px] leading-relaxed min-h-[44px]">
                        {p.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-8 pt-4">
                    <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mt-4 pt-6 border-t border-border/30">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <Badge variant="secondary" className="ml-auto bg-muted/40 hover:bg-muted/60 text-[10px] rounded-full px-3 py-0.5 border-none">
                        Active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

