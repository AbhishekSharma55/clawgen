'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface Props {
  projectId: string;
  // poll whenever a tool call completes
  toolCallCount: number;
}

export function ArchitecturePanel({ projectId, toolCallCount }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loaded, setLoaded] = useState(false);

  const fetchArchitecture = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    if (data?.architecture) {
      const arch = JSON.parse(data.architecture);
      if (arch.nodes?.length) {
        setNodes(arch.nodes);
        setEdges(arch.edges ?? []);
        setLoaded(true);
      }
    }
  }, [projectId]);

  // Fetch on mount + every time a new tool call completes
  useEffect(() => {
    fetchArchitecture();
  }, [fetchArchitecture, toolCallCount]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <span className="text-4xl">🏗️</span>
        <p className="text-sm">Architecture diagram will appear here</p>
        <p className="text-xs">as the agent builds your project</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
