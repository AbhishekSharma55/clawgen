import { db } from '@/lib/db';
import { projects, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
  if (!project) return new Response('Not found', { status: 404 });

  const msgs = await db.select().from(messages)
    .where(eq(messages.projectId, id))
    .orderBy(messages.createdAt);

  return Response.json({ ...project, messages: msgs });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (project?.folderPath) {
    try { fs.rmSync(path.dirname(project.folderPath), { recursive: true }); } catch {}
  }

  await db.delete(messages).where(eq(messages.projectId, id));
  await db.delete(projects).where(eq(projects.id, id));
  return new Response(null, { status: 204 });
}
