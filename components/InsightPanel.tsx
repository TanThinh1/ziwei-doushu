'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';
import { vi } from '@/lib/i18n/vi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',     label: '命格' },
  { key: 'love',        label: '感情' },
  { key: 'career',      label: '事业' },
  { key: 'wealth',      label: '财运' },
  { key: 'health',      label: '健康' },
  { key: 'personality', label: '性格' },
] as const;

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Hãy lập tổng quan mệnh cách theo cấu trúc sau:

**【Định tính mệnh cách】**
Một câu khái quát cách cục cốt lõi và khí chất của mệnh chủ.

**【Chính tinh cung Mệnh】**
Đặc điểm cốt lõi của chính tinh cung Mệnh.

**【Tam Phương Tứ Chính】**
Liên động giữa Tài Bạch, Quan Lộc, Thiên Di và cách cục chung.

**【Đại Hạn hiện tại】**
Xu hướng của Đại Hạn này và việc đáng chú ý nhất.

**【Ưu thế và điều cần lưu ý】**
Thế mạnh bẩm sinh và bài học cần đối mặt.`,

  love: `Hãy phân tích tình cảm hôn nhân theo cấu trúc sau:

**【Cách cục tình cảm】**
Một câu định tính về đường tình cảm.

**【Cung Phu Thê】**
Chính tinh, Tứ Hóa của cung Phu Thê và ý nghĩa.

**【Liên động các cung】**
Các cung liên quan ảnh hưởng tới tình cảm ra sao.

**【Tình cảm trong Đại Hạn hiện tại】**
Xu hướng 10 năm này và các giai đoạn đáng chú ý.

**【Gợi ý thực tế】**
Lời khuyên cụ thể, làm được.`,

  career: `Hãy phân tích sự nghiệp theo cấu trúc sau:

**【Cách cục sự nghiệp】**
Một câu định tính, hợp đi làm hay tự kinh doanh.

**【Cung Quan Lộc】**
Chính tinh, Tứ Hóa của cung Quan Lộc và ý nghĩa.

**【Liên động cung Tài Bạch】**
Quan hệ giữa tài vận và sự nghiệp, nguồn thu nhập.

**【Sự nghiệp trong Đại Hạn hiện tại】**
Xu hướng 10 năm này.

**【Gợi ý thực tế】**
Hướng đi, ngành nghề và cách làm phù hợp.`,

  wealth: `Hãy phân tích tài vận theo cấu trúc sau:

**【Cách cục tài vận】**
Một câu định tính, tiền đến từ chủ động hay thụ động.

**【Cung Tài Bạch】**
Chính tinh, Tứ Hóa của cung Tài Bạch, nguồn tiền và cách tiền lưu chuyển.

**【Cung Điền Trạch】**
Khả năng tích lũy và vận nhà đất.

**【Tài vận trong Đại Hạn hiện tại】**
Xu hướng và điều cần chú ý.

**【Gợi ý quản lý tiền】**
Thói quen tài chính nên giữ, không đưa khuyến nghị đầu tư cụ thể.`,

  health: `Hãy phân tích sức khỏe theo cấu trúc sau:

**【Cung Tật Ách】**
Các sao ở cung Tật Ách và ý nghĩa truyền thống.

**【Điều cần chú ý】**
Những mặt nên quan tâm, không khẳng định bệnh cụ thể.

**【Xu hướng trong Đại Hạn】**
Giai đoạn nên chăm sóc bản thân kỹ hơn.

**【Gợi ý chăm sóc】**
Thói quen sinh hoạt nên duy trì, và nhắc đi khám khi có triệu chứng.`,

  personality: `Hãy phân tích tính cách theo cấu trúc sau:

**【Tính cách theo chính tinh cung Mệnh】**
Đặc điểm cốt lõi.

**【Tổng hợp Tam Phương】**
Tài Bạch, Quan Lộc, Thiên Di ảnh hưởng tới tính cách ra sao.

**【Cách giao tiếp với người khác】**
Phong cách đối nhân xử thế.

**【Ưu thế và bài học cuộc đời】**
Thế mạnh và điều cần rèn luyện.`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫':   '自我、性格、先天格局',
  '兄弟宫': '兄弟关系、合伙人',
  '夫妻宫': '感情关系、婚姻状态',
  '子女宫': '子女缘分、下属关系',
  '财帛宫': '财运来源、收入方式',
  '疾厄宫': '身体健康、意外',
  '迁移宫': '外出机遇、人际格局',
  '交友宫': '朋友圈、贵人、小人',
  '官禄宫': '事业成就、社会地位',
  '田宅宫': '不动产、家庭环境',
  '福德宫': '精神享受、内心福分',
  '父母宫': '父母关系、文书契约',
};

/** Render AI markdown: **【Title】** → gold header, **bold** → strong */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const sectionMatch = line.match(/^\*\*【(.+?)】\*\*$/);
        if (sectionMatch) {
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
                【{vi(sectionMatch[1])}】
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{vi(part)}</strong>
            )}
          </div>
        );
      })}
      {vi(streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      ))}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-generate 命格总览 on mount
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    sendMessage(TOPIC_PROMPTS.overview, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${vi(s.name)}${s.siHua ? ` Hóa ${vi(s.siHua)}` : ''}`).join(', ')
      : 'Vô Chính Diệu (mượn cung đối)';
    const palaceName = vi(selectedPalace.name);
    const role = vi(PALACE_ROLES[selectedPalace.name] ?? '');

    const prompt = `Hãy phân tích riêng cung ${palaceName} (chủ về: ${role}), chính tinh của cung là ${starDesc}, theo cấu trúc sau:

**【Định tính cung】**
Ý nghĩa của cung này trên lá số và nhận định chung về bộ sao.

**【Chính tinh】**
Chính tinh tại cung này mang ý nghĩa gì.

**【Liên động Tam Phương Tứ Chính】**
Các cung Tam Phương Tứ Chính tác động tới cung này ra sao.

**【Gợi ý thực tế】**
Lời khuyên cụ thể dựa trên cung này.`;

    sendMessage(prompt, true);
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = vi(palaceOfStar?.name ?? '未知宫位');
    const viewLabel = selectedSiHua.view === 'daxian' ? 'Đại Hạn' : 'Lưu Niên';
    const hua = `Hóa ${vi(selectedSiHua.siHua)}`;
    const starName = vi(selectedSiHua.starName);

    const prompt = `Hãy phân tích ảnh hưởng của ${starName} ${hua} trong ${viewLabel}, theo cấu trúc sau:

**【Ý nghĩa của ${hua}】**
Ý nghĩa cốt lõi của ${hua} và ý nghĩa riêng khi rơi vào ${starName}.

**【Ảnh hưởng tại cung】**
${starName} ${hua} ở cung ${palaceName}, lĩnh vực của cung này chịu tác động gì.

**【Liên động Tam Phương Tứ Chính】**
Tác động tới cung đối và hai cung tam hợp của cung ${palaceName}.

**【Ảnh hưởng tới vận hiện tại】**
Trong ${viewLabel}, ${hua} này ảnh hưởng thế nào tới mệnh chủ trong thời gian tới.

**【Gợi ý thực tế】**
Việc cụ thể nên làm dựa trên Tứ Hóa này.`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    let serverError = '';
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) {
        const info = await res.json().catch(() => null);
        serverError = info?.error ?? '';
        throw new Error('请求失败');
      }
      if (!res.body) throw new Error('无响应流');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let pendingLine = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pendingLine += decoder.decode(value, { stream: true });
        const lines = pendingLine.split('\n');
        pendingLine = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      const missing = e instanceof Error && e.message === 'api-missing';
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? '开源版不含 AI 解读接口（/api/interpret），需要你自己实现后才能用，详见 README「快速开始」。排盘本身不需要任何 API Key。' : (serverError || '解读失败，请稍后重试。') }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const sendMessage = (text: string, hidden = false) => {
    if (!text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, hidden };
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
  };

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden card-glass">

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="grid grid-cols-6 gap-1">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="py-1.5 text-[10px] font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {vi(t.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {vi(messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>{vi("命格解读生成中…")}</p>
          </div>
        ))}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(212,168,67,0.08)',
                      border: '1px solid rgba(212,168,67,0.18)',
                      color: 'var(--t-gold)',
                    }}
                  >
                    {vi(msg.content)}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="text-[9px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--t-faint)' }}
                >
                  <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>{vi("命理解读")}</div>
                <AiContent text={vi(msg.content)} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Đang chờ AI: tin hỏi tự động bị ẩn nên cần báo riêng */}
        {loading && messages[messages.length - 1]?.role === 'user' && (
          <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>
            Đang tạo luận giải, có thể mất tới một phút…
          </p>
        )}
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={vi("继续追问，如：今年适合换工作吗？")}
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {vi(loading ? '…' : '追问')}
          </button>
        </div>
      </div>

    </div>
  );
}
