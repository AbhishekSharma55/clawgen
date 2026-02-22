import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');

export async function GET() {
  const all = await db.select().from(projects).orderBy(projects.createdAt);
  return Response.json(all);
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();

  if (!name) return new Response('name is required', { status: 400 });

  const id = randomUUID();
  const folderPath = path.join(PROJECTS_ROOT, id, '.openclaw');
  fs.mkdirSync(folderPath, { recursive: true });

  const project = {
    id,
    name,
    description: description ?? null,
    folderPath,
    architecture: JSON.stringify({ nodes: [], edges: [] }),
    createdAt: new Date(),
  };

  await db.insert(projects).values(project);
  return Response.json(project, { status: 201 });
}
