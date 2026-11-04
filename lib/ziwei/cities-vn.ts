/**
 * Nơi sinh ở Việt Nam và múi giờ lịch sử, dùng để hiệu chỉnh giờ mặt trời thực.
 *
 * Danh sách theo 63 tỉnh thành trước sáp nhập 2025 vì giấy khai sinh ghi theo tên cũ.
 * Kinh độ lấy tại tỉnh lỵ, đủ chính xác cho việc xác định giờ can chi.
 * `south`: nằm ở phía nam vĩ tuyến 17, dùng múi giờ riêng trong giai đoạn 1955–1975.
 */

export interface VnProvince {
  name: string;
  longitude: number;
  south?: boolean;
}

export interface VnRegion {
  name: string;
  cities: VnProvince[];
}

const south = (name: string, longitude: number): VnProvince => ({ name, longitude, south: true });

export const VN_REGIONS: VnRegion[] = [
  {
    name: 'Đồng bằng sông Hồng',
    cities: [
      { name: 'Hà Nội', longitude: 105.85 },
      { name: 'Hải Phòng', longitude: 106.68 },
      { name: 'Bắc Ninh', longitude: 106.07 },
      { name: 'Hà Nam', longitude: 105.92 },
      { name: 'Hải Dương', longitude: 106.33 },
      { name: 'Hưng Yên', longitude: 106.06 },
      { name: 'Nam Định', longitude: 106.17 },
      { name: 'Ninh Bình', longitude: 105.97 },
      { name: 'Thái Bình', longitude: 106.34 },
      { name: 'Vĩnh Phúc', longitude: 105.6 },
    ],
  },
  {
    name: 'Trung du và miền núi phía Bắc',
    cities: [
      { name: 'Bắc Giang', longitude: 106.2 },
      { name: 'Bắc Kạn', longitude: 105.83 },
      { name: 'Cao Bằng', longitude: 106.25 },
      { name: 'Điện Biên', longitude: 103.02 },
      { name: 'Hà Giang', longitude: 104.98 },
      { name: 'Hòa Bình', longitude: 105.34 },
      { name: 'Lai Châu', longitude: 103.46 },
      { name: 'Lạng Sơn', longitude: 106.76 },
      { name: 'Lào Cai', longitude: 103.97 },
      { name: 'Phú Thọ', longitude: 105.4 },
      { name: 'Quảng Ninh', longitude: 107.08 },
      { name: 'Sơn La', longitude: 103.91 },
      { name: 'Thái Nguyên', longitude: 105.84 },
      { name: 'Tuyên Quang', longitude: 105.22 },
      { name: 'Yên Bái', longitude: 104.87 },
    ],
  },
  {
    name: 'Bắc Trung Bộ',
    cities: [
      { name: 'Thanh Hóa', longitude: 105.78 },
      { name: 'Nghệ An', longitude: 105.69 },
      { name: 'Hà Tĩnh', longitude: 105.9 },
      { name: 'Quảng Bình', longitude: 106.6 },
      south('Quảng Trị', 107.1),
      south('Thừa Thiên Huế', 107.59),
    ],
  },
  {
    name: 'Nam Trung Bộ',
    cities: [
      south('Đà Nẵng', 108.21),
      south('Quảng Nam', 108.47),
      south('Quảng Ngãi', 108.8),
      south('Bình Định', 109.22),
      south('Phú Yên', 109.3),
      south('Khánh Hòa', 109.19),
      south('Ninh Thuận', 108.99),
      south('Bình Thuận', 108.1),
    ],
  },
  {
    name: 'Tây Nguyên',
    cities: [
      south('Đắk Lắk', 108.04),
      south('Đắk Nông', 107.69),
      south('Gia Lai', 108.0),
      south('Kon Tum', 108.0),
      south('Lâm Đồng', 108.44),
    ],
  },
  {
    name: 'Đông Nam Bộ',
    cities: [
      south('TP. Hồ Chí Minh', 106.66),
      south('Bà Rịa - Vũng Tàu', 107.08),
      south('Bình Dương', 106.65),
      south('Bình Phước', 106.9),
      south('Đồng Nai', 106.82),
      south('Tây Ninh', 106.1),
    ],
  },
  {
    name: 'Đồng bằng sông Cửu Long',
    cities: [
      south('Cần Thơ', 105.78),
      south('An Giang', 105.44),
      south('Bạc Liêu', 105.72),
      south('Bến Tre', 106.38),
      south('Cà Mau', 105.15),
      south('Đồng Tháp', 105.63),
      south('Hậu Giang', 105.47),
      south('Kiên Giang', 105.08),
      south('Long An', 106.41),
      south('Sóc Trăng', 105.97),
      south('Tiền Giang', 106.36),
      south('Trà Vinh', 106.34),
      south('Vĩnh Long', 105.97),
    ],
  },
];

export const UTC7 = 420;

/**
 * Múi giờ đồng hồ tại nơi sinh theo ngày, tính bằng phút lệch UTC.
 *
 * Toàn quốc: +8 từ 31/12/1942, +9 từ 14/3/1945, +7 từ 2/9/1945.
 * Miền Nam: +8 từ 1/4/1947, +7 từ 1/7/1955, +8 từ 1/1/1960, +7 từ 13/6/1975.
 * Miền Bắc giai đoạn 1947–1954 có nơi +7, có nơi +8 tùy vùng chiến sự; ở đây lấy +7.
 */
export function suggestVnUtcOffset(year: number, month: number, day: number, isSouth: boolean): number {
  const d = year * 10000 + month * 100 + day;
  if (d >= 19421231 && d < 19450314) return 480;
  if (d >= 19450314 && d < 19450902) return 540;
  if (isSouth && d >= 19470401 && d < 19550701) return 480;
  if (isSouth && d >= 19600101 && d < 19750613) return 480;
  return UTC7;
}
