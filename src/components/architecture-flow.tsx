'use client';

import { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function getNodeStyle(label: string): { icon: string; bg: string; border: string; text: string; shadow: string } {
  const l = label.toLowerCase();
  if (l.includes('agent'))      return { icon: '🤖', bg: '#eef2ff', border: '#6366f1', text: '#4338ca', shadow: '#6366f120' };
  if (l.includes('cron') || l.includes('schedule')) return { icon: '⏰', bg: '#fff7ed', border: '#f97316', text: '#c2410c', shadow: '#f9731620' };
  if (l.includes('skill') || l.includes('tool'))    return { icon: '🔧', bg: '#f0fdf4', border: '#22c55e', text: '#15803d', shadow: '#22c55e20' };
  if (l.includes('api') || l.includes('fetch'))     return { icon: '🌐', bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1', shadow: '#0ea5e920' };
  if (l.includes('db') || l.includes('database') || l.includes('store')) return { icon: '🗄️', bg: '#faf5ff', border: '#a855f7', text: '#7e22ce', shadow: '#a855f720' };
  if (l.includes('telegram') || l.includes('bot'))  return { icon: '✈️', bg: '#f0f9ff', border: '#38bdf8', text: '#0369a1', shadow: '#38bdf820' };
  if (l.includes('email') || l.includes('gmail'))   return { icon: '📧', bg: '#fffbeb', border: '#f59e0b', text: '#b45309', shadow: '#f59e0b20' };
  if (l.includes('webhook') || l.includes('http'))  return { icon: '🔗', bg: '#f9fafb', border: '#6b7280', text: '#374151', shadow: '#6b728020' };
  if (l.includes('trigger') || l.includes('event')) return { icon: '⚡', bg: '#fff7ed', border: '#fb923c', text: '#c2410c', shadow: '#fb923c20' };
  if (l.includes('output') || l.includes('notify')) return { icon: '📤', bg: '#f0fdf4', border: '#4ade80', text: '#166534', shadow: '#4ade8020' };
  return { icon: '📦', bg: '#f9fafb', border: '#d1d5db', text: '#374151', shadow: '#d1d5db40' };
}

function CustomNode({ data }: NodeProps) {
  const label = (data.label as string) ?? '';
  const { icon, bg, border, text, shadow } = getNodeStyle(label);

  return (
    <div
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: '12px',
        padding: '10px 16px',
        minWidth: '160px',
        maxWidth: '220px',
        boxShadow: `0 4px 16px ${shadow}, 0 1px 4px #00000010`,
        fontFamily: 'inherit',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: border, border: 'none', width: 8, height: 8 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span
          style={{
            color: text,
            fontSize: '12px',
            fontWeight: 600,
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {label}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: border, border: 'none', width: 8, height: 8 }} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function enrichNodes(nodes: any[]) {
  return nodes.map(n => ({ ...n, type: 'custom' }));
}

const defaultEdgeOptions = {
  style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
  labelStyle: { fill: '#64748b', fontSize: 10 },
  labelBgStyle: { fill: '#ffffff' },
  labelBgPadding: [4, 6] as [number, number],
  animated: true,
};

interface Props {
  architecture: string;
}

export default function ArchitectureFlow({ architecture }: Props) {
  const parsed = useMemo(() => {
    try { return JSON.parse(architecture); }
    catch { return { nodes: [], edges: [] }; }
  }, [architecture]);

  const [nodes, setNodes, onNodesChange] = useNodesState(enrichNodes(parsed.nodes ?? []));
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsed.edges ?? []);

  useEffect(() => {
    setNodes(enrichNodes(parsed.nodes ?? []));
    setEdges(parsed.edges ?? []);
  }, [parsed]);

  if (!parsed.nodes?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <span className="text-4xl">🏗️</span>
        <p className="text-sm">Architecture diagram will appear here</p>
        <p className="text-xs opacity-60">as the agent builds your project</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#f8fafc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />
        <Controls
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 1px 4px #00000010',
          }}
        />
        <MiniMap
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
          nodeColor={(n) => getNodeStyle((n.data?.label as string) ?? '').border}
          maskColor="#f8fafc80"
        />
      </ReactFlow>
    </div>
  );
}
