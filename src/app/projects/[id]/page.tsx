'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AgentChat from '@/components/agent-chat';
import ArchitectureFlow from '@/components/architecture-flow';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string | null;
  architecture: string;
  messages: any[];
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [architecture, setArchitecture] = useState('{"nodes":[],"edges":[]}');

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) { router.push('/'); return; }
    const data = await res.json();
    setProject(data);
    setArchitecture(data.architecture);
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const refreshArchitecture = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    console.log('🏗️ architecture from DB:', data.architecture); // 👈 add this
    setArchitecture(data.architecture);
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/projects/${id}/download`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? 'Download failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name ?? 'project'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };


  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b shrink-0">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="font-semibold">{project.name}</h1>
          {project.description && (
            <Badge variant="secondary" className="text-xs">{project.description}</Badge>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">{id.slice(0, 8)}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="gap-2"
          >
            {downloading ? (
              <>
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Zipping...
              </>
            ) : (
              <>
                ⬇️ Download
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main split view */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Agent Chat */}
        <div className="w-1/2 border-r flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b shrink-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Agent
            </p>
          </div>
          <AgentChat
            projectId={id}
            initialMessages={project.messages
              .filter((m: any) => m.role === 'user' || m.role === 'assistant')
              .map((m: any) => {
                const parts: any[] = [];

                // Parse saved tool calls back into parts
                if (m.toolCalls) {
                  const toolCalls = JSON.parse(m.toolCalls);
                  toolCalls.forEach((tc: any) => {
                    parts.push({
                      type: `tool-${tc.toolName}`,
                      toolCallId: tc.toolCallId,
                      state: tc.output !== null ? 'output-available' : 'input-available',
                      input: tc.input,
                      output: tc.output,
                    });
                  });
                }

                // Add text part last
                if (m.content) {
                  parts.push({ type: 'text', text: m.content });
                }

                return {
                  id: m.id,
                  role: m.role,
                  parts: parts.length > 0 ? parts : [{ type: 'text', text: m.content ?? '' }],
                  metadata: {},
                };
              })}
            onArchitectureUpdate={refreshArchitecture}
          />
        </div>

        {/* Right — Architecture */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b shrink-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Architecture
            </p>
          </div>
          <div className="flex-1">
            <ArchitectureFlow architecture={architecture} />
          </div>
        </div>

      </div>
    </div>
  );
}
