/**
 * Gọi Gemini ở phía server và trả về luồng SSE theo định dạng giao diện đang đọc:
 * data: {"delta":{"text":"..."}}, kết thúc bằng data: [DONE].
 * API key chỉ đọc từ biến môi trường và chỉ gửi qua header.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Các model có gói miễn phí, ưu tiên từ trên xuống; có thể đặt GEMINI_MODEL để chọn model đầu tiên. */
export const MODEL_CHAIN = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const DEFAULT_TIMEOUT_MS = 30_000;
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 8000;

const NO_KEY = 'Chưa có Gemini API key. Hãy chạy file Dan-Key-Gemini.bat rồi mở lại ứng dụng.';

function friendlyError(status: number, detail: string): string {
  if (/API_KEY_INVALID|API key not valid/i.test(detail) || status === 401 || status === 403) {
    return 'Gemini từ chối API key. Hãy kiểm tra lại key trong AI Studio rồi chạy lại Dan-Key-Gemini.bat.';
  }
  if (status === 429) return 'Đã hết lượt miễn phí của Gemini trong lúc này. Hãy đợi một lát hoặc thử lại vào ngày mai.';
  if (status === 404) return 'Gemini không tìm thấy model đang cấu hình. Hãy kiểm tra GEMINI_MODEL trong .env.local.';
  if (status >= 500) return 'Gemini đang quá tải. Hãy thử lại sau ít phút.';
  return 'Gemini không xử lý được yêu cầu này. Hãy thử lại.';
}

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });

/** Chuẩn hóa lịch sử chat: bỏ tin rỗng, giới hạn độ dài, đổi vai cho đúng định dạng Gemini. */
export function toContents(messages: ChatMessage[], contextText = '') {
  const contents = messages
    .filter(m => m && typeof m.content === 'string' && m.content.trim() !== '')
    .slice(-MAX_MESSAGES)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_MESSAGE_CHARS) }],
    }));

  while (contents.length && contents[0].role !== 'user') contents.shift();
  if (contextText && contents.length) {
    contents[0].parts[0].text = `${contextText}\n\n${contents[0].parts[0].text}`;
  }
  return contents;
}

/** Đổi luồng SSE của Gemini sang luồng của giao diện; chịu được dữ liệu bị cắt giữa chừng. */
export function toClientStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let pending = '';
  let sawText = false;
  let blocked = '';
  let sent = 0;

  const send = (controller: ReadableStreamDefaultController<Uint8Array>, payload: object) => {
    sent++;
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  };

  const handleLine = (controller: ReadableStreamDefaultController<Uint8Array>, raw: string) => {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (!line.startsWith('data:')) return;
    try {
      const chunk = JSON.parse(line.slice(5).trim());
      if (chunk.promptFeedback?.blockReason) blocked = chunk.promptFeedback.blockReason;
      for (const candidate of chunk.candidates ?? []) {
        if (candidate.finishReason === 'SAFETY') blocked = 'SAFETY';
        for (const part of candidate.content?.parts ?? []) {
          if (part.thought || typeof part.text !== 'string' || !part.text) continue;
          sawText = true;
          send(controller, { delta: { text: part.text } });
        }
      }
    } catch { /* bỏ qua dòng không phải JSON */ }
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      // Đọc tới khi có dữ liệu để đẩy ra: nếu pull kết thúc mà chưa enqueue gì,
      // stream sẽ không gọi pull lần nữa và client treo vĩnh viễn.
      const before = sent;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        for (const line of lines) handleLine(controller, line);
        if (sent > before) return;
      }
      pending += decoder.decode();
      if (pending) handleLine(controller, pending);
      if (!sawText) {
        const reason = blocked
          ? 'Gemini đã chặn nội dung này theo bộ lọc an toàn. Hãy đổi cách hỏi.'
          : 'Gemini không trả về nội dung. Hãy thử lại.';
        send(controller, { delta: { text: reason } });
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
    cancel() {
      return reader.cancel();
    },
  });
}

/** Một lần gọi model. Hết giờ chờ phản hồi đầu tiên thì hủy, nhưng không cắt luồng đang chạy. */
async function callModel(
  model: string,
  apiKey: string,
  body: string,
  timeoutMs: number,
): Promise<Response | null> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    return await fetch(`${API_ROOT}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
      signal: abort.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Gửi một lượt hội thoại tới Gemini, tự chuyển model khi model trước quá tải hoặc hết lượt. */
export async function askGemini(
  systemPrompt: string,
  contents: ReturnType<typeof toContents>,
  env: Record<string, string | undefined> = process.env,
): Promise<Response> {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return json(503, NO_KEY);
  if (!contents.length) return json(400, 'Yêu cầu không có nội dung.');

  const models = [...new Set([env.GEMINI_MODEL?.trim() || MODEL_CHAIN[0], ...MODEL_CHAIN])];
  const timeoutMs = Number(env.GEMINI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 8192 },
  });

  let lastStatus = 0;
  let lastDetail = '';
  let unreachable = 0;

  for (const model of models) {
    const upstream = await callModel(model, apiKey, body, timeoutMs);

    if (!upstream) {
      unreachable++;
      continue;
    }
    if (upstream.ok && upstream.body) {
      return new Response(toClientStream(upstream.body), {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    lastStatus = upstream.status;
    lastDetail = await upstream.text().catch(() => '');
    // Lỗi do key hoặc yêu cầu thì đổi model cũng vô ích.
    const worthRetry = upstream.status === 429 || upstream.status === 404 || upstream.status >= 500;
    if (!worthRetry) break;
  }

  if (!lastStatus) {
    return json(502, unreachable === models.length
      ? 'Gemini không phản hồi kịp. Hãy kiểm tra Internet hoặc thử lại sau ít phút.'
      : 'Không kết nối được tới Gemini. Hãy thử lại.');
  }
  return json(lastStatus === 200 ? 502 : lastStatus, friendlyError(lastStatus, lastDetail));
}
