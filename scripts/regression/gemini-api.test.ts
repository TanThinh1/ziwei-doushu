/**
 * Kết nối Gemini: họ tên và nơi sinh không được rời khỏi máy, API key chỉ nằm ở
 * header, và luồng trả về phải đọc được kể cả khi dữ liệu bị cắt giữa ký tự.
 */
import assert from 'node:assert/strict';
import { chartToPromptText, SYSTEM_PROMPT } from '../../lib/ai/chart-context';
import { askGemini, MODEL_CHAIN, toClientStream, toContents } from '../../lib/ai/gemini';
import type { ZiweiChart } from '../../lib/ziwei/types';

const SECRET_NAME = 'Nguyễn Văn Bí Mật';
const SECRET_CITY = 'Thành Phố Riêng Tư';

const chart = {
  birthInfo: {
    year: 1990, month: 5, day: 15, hour: 7, gender: 'female',
    name: SECRET_NAME, province: 'Vùng Riêng Tư', city: SECRET_CITY, longitude: 105.85,
    origInput: { year: 1990, month: 5, day: 15, clockHour: 13, clockMinute: 30 },
  },
  lunarInfo: { lunarYear: 1990, lunarMonth: 4, lunarDay: 21, yearStem: 6, yearBranch: 6, isLeapMonth: false },
  mingGongBranch: 10,
  shenGongBranch: 0,
  wuxingJu: 5,
  wuxingJuName: '土五局',
  ziweiPos: 10,
  palaces: [{
    branch: 10, stem: 2, name: '命宫', isMingGong: true, daXianAge: [5, 14],
    stars: [
      { name: '紫微', type: 'major', brightnessRaw: '庙', siHua: '权' },
      { name: '左辅', type: 'lucky' },
      { name: '擎羊', type: 'sha' },
    ],
  }, {
    branch: 0, stem: 4, name: '福德宫', isShenGong: true, isCurrentDaXian: true, stars: [],
    borrowedStars: ['天相'],
  }],
  daXians: [{
    startAge: 35, endAge: 44, palaceBranch: 1, palaceName: '田宅宫',
    siHua: { stemIndex: 4, stemName: '戊', lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  }],
  currentAge: 37,
  currentDaXianIndex: 0,
} as unknown as ZiweiChart;

const text = chartToPromptText(chart, ['紫府同宫'], new Date(2026, 5, 1));

// Không lộ thông tin riêng tư
for (const leak of [SECRET_NAME, SECRET_CITY, 'Vùng Riêng Tư', '105.85']) {
  assert.equal(text.includes(leak), false, `không được gửi: ${leak}`);
}

// Đủ dữ liệu luận số, bằng tiếng Việt
assert.match(text, /Giới tính: Nữ/);
assert.match(text, /Canh Ngọ, tháng 4, ngày 21, giờ Mùi/);
assert.match(text, /Thổ Ngũ Cục/);
assert.match(text, /Tử Vi \(Miếu, Hóa Quyền\)/);
assert.match(text, /Vô Chính Diệu\. mượn cung đối: Thiên Tướng/);
assert.match(text, /Tứ Hóa Đại Hạn \(can Mậu\): Hóa Lộc Tham Lang/);
assert.match(text, /Tứ Hóa Lưu Niên 2026 \(can Bính\): Hóa Lộc Thiên Đồng/);
assert.match(text, /Tử Phủ|紫府同宫/);
assert.equal(/[一-鿿]/.test(text.replace('紫府同宫', '')), false, 'dữ liệu gửi đi phải là tiếng Việt');

// Lịch sử chat đổi đúng vai, ngữ cảnh gắn vào tin đầu
const contents = toContents([
  { role: 'assistant', content: 'mở đầu' },
  { role: 'user', content: 'Câu hỏi' },
  { role: 'assistant', content: '' },
  { role: 'assistant', content: 'Trả lời' },
], 'NGỮ CẢNH');
assert.deepEqual(contents.map(c => c.role), ['user', 'model']);
assert.match(contents[0].parts[0].text, /^NGỮ CẢNH\n\nCâu hỏi$/);

async function readAll(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).text();
}
function streamOf(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(c) { chunks.forEach(x => c.enqueue(x)); c.close(); },
  });
}
const deltas = (sse: string) => sse.split('\n')
  .filter(l => l.startsWith('data: {'))
  .map(l => JSON.parse(l.slice(6)).delta.text)
  .join('');

const part = (t: string, extra = {}) =>
  `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t, ...extra }] } }] })}\r\n\r\n`;

async function main() {
  // Bỏ phần suy nghĩ, cắt ở mọi byte vẫn đúng
  const bytes = new TextEncoder().encode(part('nháp', { thought: true }) + part('Mệnh ') + part('tốt'));
  for (let cut = 1; cut < bytes.length; cut += 7) {
    const out = await readAll(toClientStream(streamOf([bytes.slice(0, cut), bytes.slice(cut)])));
    assert.equal(deltas(out), 'Mệnh tốt', `cắt tại byte ${cut}`);
    assert.match(out, /data: \[DONE\]\n\n$/);
  }

  // Bị bộ lọc chặn thì báo rõ
  const blocked = new TextEncoder().encode('data: {"promptFeedback":{"blockReason":"SAFETY"}}\r\n\r\n');
  assert.match(deltas(await readAll(toClientStream(streamOf([blocked])))), /bộ lọc an toàn/);

  // Thiếu key: không gọi mạng
  const realFetch = globalThis.fetch;
  let calls = 0;
  const seen: { url: string; init: RequestInit }[] = [];
  let reply: Response = new Response('{}');
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls++;
    seen.push({ url, init });
    return reply;
  }) as typeof fetch;

  const noKey = await askGemini(SYSTEM_PROMPT, contents, {});
  assert.equal(noKey.status, 503);
  assert.match((await noKey.json()).error, /Dan-Key-Gemini/);
  assert.equal(calls, 0);

  // Key nằm ở header, không nằm trong URL hay nội dung
  const KEY = 'test-key-123';
  reply = new Response(streamOf([new TextEncoder().encode(part('Xin chào'))]));
  const ok = await askGemini(SYSTEM_PROMPT, contents, { GEMINI_API_KEY: KEY });
  assert.equal(ok.status, 200);
  assert.equal(deltas(await ok.text()), 'Xin chào');
  const sent = seen[0];
  assert.match(sent.url, /models\/gemini-3\.8-flash:streamGenerateContent\?alt=sse$/);
  assert.equal(sent.url.includes(KEY), false);
  assert.equal(String(sent.init.body).includes(KEY), false);
  assert.equal((sent.init.headers as Record<string, string>)['x-goog-api-key'], KEY);

  // Model quá tải hoặc hết lượt thì chuyển sang model sau
  let script: (() => Response | Promise<Response>)[] = [];
  const tried: string[] = [];
  globalThis.fetch = (async (url: string) => {
    tried.push(/models\/([^:]+):/.exec(url)![1]);
    return (script.shift() ?? (() => new Response('quota', { status: 429 })))();
  }) as typeof fetch;

  script = [
    () => new Response('overloaded', { status: 503 }),
    () => new Response('quota', { status: 429 }),
    () => new Response(streamOf([new TextEncoder().encode(part('Dự phòng'))])),
  ];
  const fallback = await askGemini(SYSTEM_PROMPT, contents, { GEMINI_API_KEY: KEY });
  assert.equal(fallback.status, 200);
  assert.equal(deltas(await fallback.text()), 'Dự phòng');
  assert.deepEqual(tried, MODEL_CHAIN.slice(0, 3));

  // Model treo thì hủy theo giới hạn thời gian rồi thử tiếp
  tried.length = 0;
  let aborted = 0;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    tried.push(/models\/([^:]+):/.exec(url)![1]);
    if (tried.length === 1) {
      return new Promise<Response>((_, reject) => init.signal!.addEventListener('abort', () => {
        aborted++;
        reject(new Error('aborted'));
      }));
    }
    return new Response(streamOf([new TextEncoder().encode(part('Sau khi treo'))]));
  }) as typeof fetch;
  const afterHang = await askGemini(SYSTEM_PROMPT, contents, { GEMINI_API_KEY: KEY, GEMINI_TIMEOUT_MS: '20' });
  assert.equal(deltas(await afterHang.text()), 'Sau khi treo');
  assert.equal(aborted, 1);

  // GEMINI_MODEL được thử trước và không bị lặp
  tried.length = 0;
  globalThis.fetch = (async (url: string) => {
    tried.push(/models\/([^:]+):/.exec(url)![1]);
    return new Response('quota', { status: 429 });
  }) as typeof fetch;

  const limited = await askGemini(SYSTEM_PROMPT, contents, { GEMINI_API_KEY: KEY, GEMINI_MODEL: 'gemini-3.6-flash' });
  assert.equal(tried[0], 'gemini-3.6-flash');
  assert.equal(tried.length, MODEL_CHAIN.length);
  assert.equal(new Set(tried).size, tried.length);
  assert.equal(limited.status, 429);
  assert.match((await limited.json()).error, /hết lượt miễn phí/);

  // Key sai thì dừng ngay, không thử các model khác
  tried.length = 0;
  globalThis.fetch = (async (url: string) => {
    tried.push(url);
    return new Response('API key not valid', { status: 400 });
  }) as typeof fetch;
  const invalid = await askGemini(SYSTEM_PROMPT, contents, { GEMINI_API_KEY: KEY });
  assert.equal(tried.length, 1);
  assert.match((await invalid.json()).error, /từ chối API key/);

  globalThis.fetch = realFetch;
  console.log('gemini-api: OK');
}

main().catch(e => { console.error(e); process.exit(1); });
