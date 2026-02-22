import { cn } from '@/lib/utils';
import {
  FileEdit,
  FileSearch,
  FolderSearch,
  Archive,
  Layout,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Terminal,
  Activity
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface StepCardProps {
  toolName: string;
  args?: Record<string, any>;
  result?: any;
  state: 'calling' | 'done' | 'error';
}

const TOOL_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  write_file: { icon: FileEdit, label: 'Write', color: 'text-blue-500' },
  read_file: { icon: FileSearch, label: 'Read', color: 'text-orange-500' },
  list_files: { icon: FolderSearch, label: 'List', color: 'text-purple-500' },
  zip_export: { icon: Archive, label: 'Export', color: 'text-emerald-500' },
  update_architecture: { icon: Layout, label: 'Architect', color: 'text-indigo-500' },
};

/**
 * A minimalistic, Apple-inspired step indicator card.
 * Designed to be compact and provide clear visual feedback for tool executions.
 * Opens a detailed popup on click.
 */
export function StepCard({ toolName, args, result, state }: StepCardProps) {
  const config = TOOL_CONFIG[toolName] || { icon: Wrench, label: toolName, color: 'text-muted-foreground' };
  const Icon = config.icon;

  const JsonView = ({ data }: { data: any }) => (
    <pre className="text-[12px] font-mono bg-secondary/30 p-4 rounded-xl overflow-x-auto border border-border/20 text-muted-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer",
          "bg-secondary/20 border border-border/30 hover:border-border/60 hover:bg-secondary/40 ",
          state === 'error' && "border-destructive/20 bg-destructive/5"
        )}>
          {/* Icon Container */}
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-500",
            state === 'calling' ? "bg-primary/10 text-primary ring-4 ring-primary/5 animate-pulse" :
              state === 'done' ? "bg-green-500/10 text-green-600 dark:text-green-500" :
                state === 'error' ? "bg-destructive/10 text-destructive" :
                  "bg-secondary/50 text-muted-foreground"
          )}>
            {state === 'calling' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Icon className={cn("w-4 h-4", config.color)} />
            )}
          </div>

          {/* Main Info */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-semibold text-foreground/90 tracking-tight">
                  {config.label}
                </span>
                {args?.file_path && (
                  <>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    <span className="text-[12px] text-muted-foreground truncate font-medium">
                      {args.file_path.split('/').pop()}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {state === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500/80" />}
                {state === 'error' && <AlertCircle className="w-3.5 h-3.5 text-destructive/80" />}
                <span className={cn(
                  "text-[10px] uppercase tracking-widest font-bold opacity-40 transition-opacity group-hover:opacity-60",
                  state === 'calling' && "text-primary opacity-100 animate-pulse"
                )}>
                  {state}
                </span>
              </div>
            </div>

            {/* Footer info for specific results */}
            {(result?.files || result?.zipPath) && (
              <div className="flex items-center gap-3 mt-0.5">
                {result?.files && (
                  <span className="text-[11px] text-muted-foreground/70 font-medium">
                    {result.files.length} files processed
                  </span>
                )}
                {result?.zipPath && (
                  <div className="text-[11px] text-primary/80 font-semibold flex items-center gap-1">
                    Details available <Archive className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between bg-secondary/10 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl bg-background border border-border/50 shadow-sm", config.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-bold tracking-tight">
                {config.label} Tool
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={state === 'done' ? 'secondary' : state === 'error' ? 'destructive' : 'outline'} className="h-4.5 px-1.5 text-[10px] uppercase tracking-wider font-bold">
                  {state}
                </Badge>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {toolName}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Arguments Section */}
            {args && Object.keys(args).length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-foreground/70">
                  <Terminal className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Arguments</h3>
                </div>
                <JsonView data={args} />
              </section>
            )}

            {/* Results Section */}
            {state === 'done' && result && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-foreground/70">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Results</h3>
                </div>
                {result.zipPath ? (
                  <div className="flex flex-col gap-4">
                    <JsonView data={{ ...result, zipPath: undefined }} />
                    <a
                      href={result.zipPath}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Archive className="w-4 h-4" />
                      Download Result Bundle
                    </a>
                  </div>
                ) : (
                  <JsonView data={result} />
                )}
              </section>
            )}

            {/* Error Section */}
            {state === 'error' && result && (
              <section className="space-y-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Error Details</h3>
                </div>
                <p className="text-sm text-destructive/90 font-medium">
                  {typeof result === 'string' ? result : JSON.stringify(result)}
                </p>
              </section>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
