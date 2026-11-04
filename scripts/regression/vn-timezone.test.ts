/**
 * Múi giờ Việt Nam: đồng hồ Việt Nam không phải giờ Bắc Kinh, nên phải trừ theo
 * kinh tuyến gốc của múi giờ tại nơi sinh. Không truyền utcOffsetMinutes thì hành
 * vi cũ (UTC+8, kinh tuyến 120°) phải giữ nguyên.
 */
import assert from 'node:assert/strict';
import { calcTrueSolarBranch, formToBirthInfo } from '../../lib/ziwei/share';
import { suggestVnUtcOffset, VN_REGIONS } from '../../lib/ziwei/cities-vn';
import type { BirthFormState } from '../../components/BirthForm';

const HANOI = 105.85;
const SAIGON = 106.66;

// 13:30 Hà Nội, UTC+7: giờ thực 13:33 là giờ Mùi. Tính nhầm theo UTC+8 sẽ ra giờ Ngọ.
assert.equal(calcTrueSolarBranch(13, 30, HANOI, 420), 7);
assert.equal(calcTrueSolarBranch(13, 30, HANOI), 6);

// Hành vi cũ khi không truyền múi giờ
assert.equal(calcTrueSolarBranch(12, 0, 120), 6);

const form = (over: Partial<BirthFormState>): BirthFormState => ({
  name: '', year: '2000', month: '6', day: '15', clockHour: '13', clockMinute: '30',
  unknownTime: false, province: 'Đồng bằng sông Hồng', city: 'Hà Nội', longitude: HANOI,
  gender: 'female', ...over,
});

assert.equal(formToBirthInfo(form({ utcOffsetMinutes: 420 })).hour, 7);

// 23:30 ở Hà Nội là giờ Tý muộn, phải sang ngày hôm sau
const lateZi = formToBirthInfo(form({ clockHour: '23', clockMinute: '30', utcOffsetMinutes: 420 }));
assert.equal(lateZi.hour, 0);
assert.equal(lateZi.day, 16);

// Lịch sử múi giờ
assert.equal(suggestVnUtcOffset(2000, 1, 1, false), 420);
assert.equal(suggestVnUtcOffset(2000, 1, 1, true), 420);
assert.equal(suggestVnUtcOffset(1970, 6, 1, false), 420);
assert.equal(suggestVnUtcOffset(1970, 6, 1, true), 480);
assert.equal(suggestVnUtcOffset(1975, 6, 12, true), 480);
assert.equal(suggestVnUtcOffset(1975, 6, 13, true), 420);
assert.equal(suggestVnUtcOffset(1957, 3, 1, true), 420);
assert.equal(suggestVnUtcOffset(1950, 3, 1, true), 480);
assert.equal(suggestVnUtcOffset(1944, 3, 1, false), 480);
assert.equal(suggestVnUtcOffset(1945, 6, 1, false), 540);

// Miền Nam 1970: cùng đồng hồ nhưng múi giờ khác thì giờ can chi khác
assert.equal(calcTrueSolarBranch(12, 30, SAIGON, 480), 6);
assert.equal(calcTrueSolarBranch(13, 30, SAIGON, 480), 6);
assert.equal(calcTrueSolarBranch(13, 30, SAIGON, 420), 7);

// Đủ 63 tỉnh thành, không trùng tên
const names = VN_REGIONS.flatMap(r => r.cities.map(c => c.name));
assert.equal(names.length, 63);
assert.equal(new Set(names).size, 63);

console.log('vn-timezone: OK');
