import { chartToPromptText, SYSTEM_PROMPT } from '@/lib/ai/chart-context';
import { askGemini, toContents } from '@/lib/ai/gemini';
import { HEMING_METHODOLOGY } from '@/lib/ziwei/heming-knowledge';
import { detectPatterns } from '@/lib/ziwei/patterns';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';

const DEFAULT_REQUEST = `Hãy phân tích độ hợp của hai lá số theo cấu trúc sau:

**【Tổng quan độ hợp】**
Nhận định chung về mối quan hệ của hai người và lý do từ lá số.

**【Cung Phu Thê hai bên】**
So sánh cung Phu Thê và cách mỗi người thể hiện tình cảm.

**【Tương tác cung Mệnh và Tam Phương】**
Điểm bổ trợ và điểm dễ va chạm giữa hai lá số.

**【Thời điểm đáng chú ý】**
Đại Hạn hiện tại của mỗi người ảnh hưởng thế nào tới mối quan hệ.

**【Gợi ý chung sống】**
Những việc cụ thể hai người có thể làm để hiểu nhau hơn.`;

const HEMING_SYSTEM = `${SYSTEM_PROMPT}

Khi so hai lá số, hãy nhớ đây chỉ là tham khảo và không kết luận hai người nên hay không nên ở bên nhau.

Tài liệu phương pháp hợp số dưới đây viết bằng tiếng Trung, chỉ dùng làm kiến thức nền. Không trích nguyên văn tài liệu này.
${HEMING_METHODOLOGY}`;

const describe = (chart: ZiweiChart) =>
  chartToPromptText(chart, detectPatterns(chart).map(p => p.name));

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as
    { chartA?: ZiweiChart; chartB?: ZiweiChart; question?: unknown } | null;
  if (!body?.chartA?.palaces || !body.chartB?.palaces) {
    return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const question = typeof body.question === 'string' && body.question.trim() ? body.question : DEFAULT_REQUEST;
  const context = `Lá số người A:\n${describe(body.chartA)}\n\nLá số người B:\n${describe(body.chartB)}`;
  return askGemini(HEMING_SYSTEM, toContents([{ role: 'user', content: question }], context));
}
