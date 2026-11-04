/**
 * Chuyển lá số thành văn bản gửi cho AI.
 *
 * Hàm này là ranh giới riêng tư: chỉ đọc dữ liệu lá số, không đọc birthInfo.name,
 * province, city, longitude hay origInput, nên họ tên và nơi sinh không rời khỏi máy.
 */
import { vi } from '../i18n/vi';
import { BRANCHES, SI_HUA_TABLE, STEMS } from '../ziwei/constants';
import type { Palace, Star, ZiweiChart } from '../ziwei/types';

export const SYSTEM_PROMPT = `Bạn là nhà nghiên cứu Tử Vi Đẩu Số theo phái Tam Hợp, tham khảo hệ thống giảng dạy của Nghê Hải Hạ. Bạn luận giải lá số cho người Việt.

Quy tắc bắt buộc:
1. Viết bằng tiếng Việt tự nhiên, dùng thuật ngữ Tử Vi Hán-Việt. Không dùng chữ Hán.
2. Chỉ dựa vào dữ liệu lá số được cung cấp. Không thêm sao, Tứ Hóa hay vị trí không có trong dữ liệu.
3. Không tạo lời trích dẫn. Khi nói tới quan điểm của Nghê Hải Hạ hoặc cổ thư, chỉ nói khái quát, không dùng ngoặc kép, không ghi số tập, số trang hay mốc thời gian.
4. Không phán chắc chắn. Nêu xu hướng và lý do từ lá số, nhắc rằng đây là tham khảo và lựa chọn của con người mới quyết định.
5. Không dự đoán ngày mất, tai nạn hay bệnh cụ thể. Về sức khỏe chỉ nói điều cần chú ý chung và khuyên đi khám khi có triệu chứng. Về tiền bạc và pháp lý không đưa khuyến nghị đầu tư hay pháp lý cụ thể.
6. Nếu người hỏi có vẻ đang tuyệt vọng hoặc gặp nguy hiểm, hãy dừng luận số, trả lời ân cần và khuyên họ liên hệ người thân hoặc đường dây hỗ trợ tại nơi họ sống.
7. Trình bày: mỗi tiêu đề mục là một dòng riêng đúng dạng **【Tên mục】**, nội dung là đoạn ngắn 2–4 câu. Không dùng bảng và không dùng dấu #.`;

const BRIGHT_LABEL: Record<string, string> = {
  庙: 'Miếu', 旺: 'Vượng', 得: 'Đắc', 利: 'Lợi', 平: 'Bình', 不: 'Bất', 闲: 'Nhàn', 陷: 'Hãm', 地: 'Địa',
};

function starText(star: Star): string {
  const parts: string[] = [];
  if (star.brightnessRaw) parts.push(BRIGHT_LABEL[star.brightnessRaw] ?? star.brightnessRaw);
  if (star.siHua) parts.push(`Hóa ${vi(star.siHua)}`);
  return parts.length ? `${vi(star.name)} (${parts.join(', ')})` : vi(star.name);
}

function palaceLine(palace: Palace): string {
  const name = vi(palace.name);
  const ganzhi = vi(`${STEMS[palace.stem]}${BRANCHES[palace.branch]}`);
  const tags = [
    palace.isMingGong ? 'cung Mệnh' : '',
    palace.isShenGong ? 'cư Thân' : '',
    palace.isCurrentDaXian ? 'Đại Hạn hiện tại' : '',
    palace.daXianAge ? `Đại Hạn ${palace.daXianAge[0]}–${palace.daXianAge[1]} tuổi` : '',
  ].filter(Boolean).join('; ');

  const group = (type: Star['type'], label: string) => {
    const stars = palace.stars.filter(s => s.type === type).map(starText);
    return stars.length ? `${label}: ${stars.join(', ')}` : '';
  };

  const borrowed = palace.borrowedStars?.length
    ? `mượn cung đối: ${palace.borrowedStars.map(s => vi(s)).join(', ')}`
    : '';

  const body = [
    group('major', 'Chính tinh') || 'Vô Chính Diệu',
    borrowed,
    group('lucky', 'Cát tinh'),
    group('sha', 'Sát tinh'),
    group('minor', 'Tạp tinh'),
  ].filter(Boolean).join('. ');

  return `- ${name} (${ganzhi}${tags ? `; ${tags}` : ''}): ${body}.`;
}

function siHuaLine(stars: readonly string[]): string {
  const [lu, quan, ke, ji] = stars.map(s => vi(s));
  return `Hóa Lộc ${lu}, Hóa Quyền ${quan}, Hóa Khoa ${ke}, Hóa Kỵ ${ji}`;
}

/** Tên các cách cục do engine nhận diện, truyền vào từ phía server. */
export function chartToPromptText(chart: ZiweiChart, patternNames: string[] = [], now = new Date()): string {
  const { lunarInfo: lunar } = chart;
  const year = now.getFullYear();
  const yearStem = ((year - 4) % 10 + 10) % 10;
  const dx = chart.daXians[chart.currentDaXianIndex];
  const month = Math.abs(lunar.lunarMonth);

  const lines = [
    `Giới tính: ${chart.birthInfo.gender === 'female' ? 'Nữ' : 'Nam'}`,
    `Sinh năm âm lịch ${vi(`${STEMS[lunar.yearStem]}${BRANCHES[lunar.yearBranch]}`)}, tháng ${lunar.isLeapMonth ? 'nhuận ' : ''}${month}, ngày ${lunar.lunarDay}, giờ ${vi(BRANCHES[chart.birthInfo.hour])}`,
    `Năm hiện tại: ${year}. Tuổi hiện tại: ${chart.currentAge}`,
    `Cục: ${vi(chart.wuxingJuName)}`,
    `Cung Mệnh tại ${vi(BRANCHES[chart.mingGongBranch])}, cung Thân tại ${vi(BRANCHES[chart.shenGongBranch])}`,
    chart.mingZhu ? `Mệnh chủ: ${vi(chart.mingZhu)}` : '',
    chart.shenZhu ? `Thân chủ: ${vi(chart.shenZhu)}` : '',
    '',
    'Mười hai cung:',
    ...chart.palaces.map(palaceLine),
    '',
    dx ? `Đại Hạn hiện tại: ${dx.startAge}–${dx.endAge} tuổi, tại cung ${vi(dx.palaceName)}` : '',
    dx?.siHua ? `Tứ Hóa Đại Hạn (can ${vi(dx.siHua.stemName)}): ${siHuaLine([dx.siHua.lu, dx.siHua.quan, dx.siHua.ke, dx.siHua.ji])}` : '',
    `Tứ Hóa Lưu Niên ${year} (can ${vi(STEMS[yearStem])}): ${siHuaLine(SI_HUA_TABLE[yearStem])}`,
    patternNames.length ? `Cách cục engine nhận diện: ${patternNames.map(p => vi(p)).join(', ')}` : '',
  ];

  return lines.filter((line, i) => line !== '' || lines[i - 1] !== '').join('\n').trim();
}
