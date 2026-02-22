import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const PROJECTS_ROOT = path.join(process.cwd(), 'generated-projects');

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const projectDir = path.join(PROJECTS_ROOT, id, '.openclaw');
  if (!fs.existsSync(projectDir)) {
    return NextResponse.json({ error: 'No files generated yet' }, { status: 404 });
  }

  // Sanitize project name for filename
  const zipName = project.name.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
  const zipPath = path.join(PROJECTS_ROOT, `${id}.zip`);

  // Always re-zip fresh
  execSync(`zip -r "${zipPath}" ".openclaw"`, {
    cwd: path.join(PROJECTS_ROOT, id),
  });

  const fileBuffer = fs.readFileSync(zipPath);

  // Clean up zip after reading
  fs.unlinkSync(zipPath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipName}.zip"`,
      'Content-Length': fileBuffer.length.toString(),
    },
  });
}
