import { streamText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { SYSTEM_PROMPT } from '@/lib/agent/system-prompt';
import { agentTools } from '@/lib/agent/tools';
import { db } from '@/lib/db';
import { messages as messagesTable } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { messages, projectId } = await req.json();

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'projectId is required' }), { status: 400 });
  }

  const modelMessages = messages.map((m: any) => {
    if (typeof m.content === 'string') return { role: m.role, content: m.content };
    const text = (m.parts ?? [])
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('\n');
    return { role: m.role, content: text };
  });

  const lastUserMessage = [...modelMessages].reverse().find((m: any) => m.role === 'user');

  const systemPrompt = SYSTEM_PROMPT
    // 👇 THE FIX — inject projectId so the LLM always uses the correct one
    + `\n\n[IMPORTANT] The current project_id is: "${projectId}"\nYou MUST use exactly this project_id in every single tool call. Do not generate or guess a project_id.`;

  if (lastUserMessage?.content) {
    await db.insert(messagesTable).values({
      id: randomUUID(),
      projectId,
      role: 'user',
      content: lastUserMessage.content,
      toolCalls: null,
      createdAt: new Date(),
    });
  }

  const result = streamText({
    model: openai.chat(process.env.CHAT_MODEL ?? 'gpt-4o'),
    system: systemPrompt,
    messages: modelMessages,
    tools: agentTools,
    stopWhen: stepCountIs(20),
    onFinish: async ({ text, steps }) => {
      if (text) {
        await db.insert(messagesTable).values({
          id: randomUUID(),
          projectId,
          role: 'assistant',
          content: text,
          toolCalls: JSON.stringify(
            steps.flatMap(s =>
              s.toolCalls?.map(tc => ({
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                input: tc.input,
                output: s.toolResults?.find(r => r.toolCallId === tc.toolCallId)?.output ?? null, // 👈 output not result
              })) ?? []
            )
          ),
          createdAt: new Date(),
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}