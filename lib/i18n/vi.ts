/**
 * Tầng hiển thị tiếng Việt.
 *
 * Engine lập số dùng khóa tiếng Trung ('紫微', '命宫', '禄'…) cho logic, nên ở đây
 * chỉ dịch tại lúc hiển thị: vi() nhận một giá trị bất kỳ, chuỗi có chữ Hán thì đổi
 * sang tiếng Việt, còn lại trả nguyên. Không hàm nào trong lib/ziwei gọi vi().
 *
 * Thứ tự tra: câu trọn vẹn → chữ đơn → thuật ngữ → mẫu có {0} → thay từng thuật ngữ.
 */
import { PHRASES_VI } from './vi-phrases.generated';
import { BRANCHES_VI, SINGLE_VI, STEMS_VI, TERMS_VI } from './vi-terms';

const HAN = /[㐀-鿿]/;

const terms: Record<string, string> = { ...TERMS_VI };
for (const [stem, stemVi] of Object.entries(STEMS_VI)) {
  for (const [branch, branchVi] of Object.entries(BRANCHES_VI)) {
    terms[stem + branch] = `${stemVi} ${branchVi}`;
  }
}

const TERM_RE = new RegExp(
  Object.keys(terms).sort((a, b) => b.length - a.length).join('|'),
  'g',
);

interface Pattern {
  re: RegExp;
  out: string;
  literal: number;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PATTERNS: Pattern[] = Object.entries(PHRASES_VI)
  .filter(([key]) => /\{\d+\}/.test(key))
  .map(([key, out]) => {
    const parts = key.split(/\{\d+\}/);
    return {
      re: new RegExp(`^${parts.map(escapeRe).join('([\\s\\S]+?)')}$`),
      out,
      literal: parts.join('').length,
    };
  })
  .sort((a, b) => b.literal - a.literal);

const PUNCT: [RegExp, string][] = [
  [/，/g, ', '], [/。/g, '. '], [/、/g, ', '], [/；/g, '; '], [/：/g, ': '],
  [/？/g, '? '], [/！/g, '! '], [/（/g, ' ('], [/）/g, ') '], [/「|『/g, '“'], [/」|』/g, '”'],
];

const missing = (globalThis as { __viMissing?: Set<string> }).__viMissing ??= new Set<string>();

function byTerms(text: string): string {
  let out = text.replace(TERM_RE, t => ` ${terms[t]} `);
  for (const [re, to] of PUNCT) out = out.replace(re, to);
  out = out.replace(/\s+/g, ' ').replace(/\s+([,.;:!?)”])/g, '$1').replace(/([(“])\s+/g, '$1').trim();
  if (HAN.test(out) && process.env.NODE_ENV !== 'production') missing.add(text);
  return out;
}

function byPattern(text: string): string | undefined {
  for (const { re, out } of PATTERNS) {
    const m = re.exec(text);
    if (m) return out.replace(/\{(\d+)\}/g, (_, i) => translate(m[Number(i) + 1]));
  }
  return undefined;
}

const cache = new Map<string, string>();

function translate(text: string): string {
  const cached = cache.get(text);
  if (cached !== undefined) return cached;

  const [, lead, core, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)!;
  const body = PHRASES_VI[core] ?? SINGLE_VI[core] ?? terms[core] ?? byPattern(core) ?? byTerms(core);
  const result = lead + body + trail;

  cache.set(text, result);
  return result;
}

/** Dịch một giá trị để hiển thị. Giá trị không phải chuỗi (số, phần tử React, null…) giữ nguyên. */
export function vi<T>(value: T): T {
  if (typeof value === 'string') return (HAN.test(value) ? translate(value) : value) as T;
  if (Array.isArray(value)) return value.map(item => vi(item)) as T;
  return value;
}
