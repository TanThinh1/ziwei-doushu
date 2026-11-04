import { chartToPromptText, SYSTEM_PROMPT } from '@/lib/ai/chart-context';
import { askGemini, toContents, type ChatMessage } from '@/lib/ai/gemini';
import { detectPatterns } from '@/lib/ziwei/patterns';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { chart?: ZiweiChart; messages?: ChatMessage[] } | null;
  if (!body?.chart?.palaces || !Array.isArray(body.messages)) {
    return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const patterns = detectPatterns(body.chart).map(p => p.name);
  const context = `Dữ liệu lá số:\n${chartToPromptText(body.chart, patterns)}`;
  return askGemini(SYSTEM_PROMPT, toContents(body.messages, context));
}
