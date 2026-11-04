/**
 * Bảng thuật ngữ Tử Vi Hán → Việt.
 * Chỉ dùng cho tầng hiển thị (xem lib/i18n/vi.ts); engine vẫn dùng khóa tiếng Trung.
 */

export const STEMS_VI: Record<string, string> = {
  甲: 'Giáp', 乙: 'Ất', 丙: 'Bính', 丁: 'Đinh', 戊: 'Mậu',
  己: 'Kỷ', 庚: 'Canh', 辛: 'Tân', 壬: 'Nhâm', 癸: 'Quý',
};

export const BRANCHES_VI: Record<string, string> = {
  子: 'Tý', 丑: 'Sửu', 寅: 'Dần', 卯: 'Mão', 辰: 'Thìn', 巳: 'Tỵ',
  午: 'Ngọ', 未: 'Mùi', 申: 'Thân', 酉: 'Dậu', 戌: 'Tuất', 亥: 'Hợi',
};

/** Chữ đơn: chỉ khớp khi cả chuỗi đúng bằng chữ đó, không thay trong câu. */
export const SINGLE_VI: Record<string, string> = {
  ...STEMS_VI,
  ...BRANCHES_VI,
  // Tứ hóa
  禄: 'Lộc', 权: 'Quyền', 科: 'Khoa', 忌: 'Kỵ', 化: 'Hóa',
  // Độ sáng
  庙: 'Miếu', 旺: 'Vượng', 得: 'Đắc', 利: 'Lợi', 平: 'Bình', 不: 'Bất', 闲: 'Nhàn', 陷: 'Hãm',
  // Ngũ hành, âm dương
  金: 'Kim', 木: 'Mộc', 水: 'Thủy', 火: 'Hỏa', 土: 'Thổ', 阳: 'Dương', 阴: 'Âm',
  // Nhãn trên lá số
  命: 'Mệnh', 身: 'Thân', 限: 'Hạn', 宫: 'cung', 星: 'sao',
  男: 'Nam', 女: 'Nữ',
  年: 'năm', 月: 'tháng', 日: 'ngày', 时: 'giờ', 分: 'phút', 岁: 'tuổi', 闰: 'nhuận',
  入: 'nhập', 段: 'đoạn', 天: 'Thiên', 地: 'Địa', 人: 'Nhân',
};

/** Từ nhiều chữ: có thể thay trong câu, ưu tiên từ dài trước. */
export const TERMS_VI: Record<string, string> = {
  // 14 chính tinh
  紫微: 'Tử Vi', 天机: 'Thiên Cơ', 太阳: 'Thái Dương', 武曲: 'Vũ Khúc', 天同: 'Thiên Đồng',
  廉贞: 'Liêm Trinh', 天府: 'Thiên Phủ', 太阴: 'Thái Âm', 贪狼: 'Tham Lang', 巨门: 'Cự Môn',
  天相: 'Thiên Tướng', 天梁: 'Thiên Lương', 七杀: 'Thất Sát', 破军: 'Phá Quân',

  // Lục cát, lục sát và phụ tinh
  左辅: 'Tả Phù', 右弼: 'Hữu Bật', 文昌: 'Văn Xương', 文曲: 'Văn Khúc',
  天魁: 'Thiên Khôi', 天钺: 'Thiên Việt', 禄存: 'Lộc Tồn', 天马: 'Thiên Mã',
  擎羊: 'Kình Dương', 陀罗: 'Đà La', 火星: 'Hỏa Tinh', 铃星: 'Linh Tinh',
  地空: 'Địa Không', 地劫: 'Địa Kiếp', 天空: 'Thiên Không', 旬空: 'Tuần Không',
  副旬: 'Phó Tuần', 截路: 'Triệt Lộ', 截空: 'Triệt Không', 副截: 'Phó Triệt', 空亡: 'Không Vong',
  大耗: 'Đại Hao', 小耗: 'Tiểu Hao', 天使: 'Thiên Sứ', 天伤: 'Thiên Thương', 天刑: 'Thiên Hình',
  天姚: 'Thiên Diêu', 天哭: 'Thiên Khốc', 天虚: 'Thiên Hư', 天月: 'Thiên Nguyệt', 阴煞: 'Âm Sát',
  蜚廉: 'Phi Liêm', 飞廉: 'Phi Liêm', 孤辰: 'Cô Thần', 寡宿: 'Quả Tú', 天官: 'Thiên Quan',
  天福: 'Thiên Phúc', 天才: 'Thiên Tài', 天寿: 'Thiên Thọ', 三台: 'Tam Thai', 八座: 'Bát Tọa',
  恩光: 'Ân Quang', 天贵: 'Thiên Quý', 台辅: 'Thai Phụ', 龙池: 'Long Trì', 凤阁: 'Phượng Các',
  红鸾: 'Hồng Loan', 天喜: 'Thiên Hỷ', 解神: 'Giải Thần', 天德: 'Thiên Đức', 月德: 'Nguyệt Đức',
  年解: 'Niên Giải', 天巫: 'Thiên Vu', 华盖: 'Hoa Cái', 封诰: 'Phong Cáo', 劫煞: 'Kiếp Sát',
  龙德: 'Long Đức', 破碎: 'Phá Toái', 咸池: 'Hàm Trì',

  // Vòng Tràng Sinh, Bác Sĩ, Thái Tuế, Tướng Tinh
  长生: 'Tràng Sinh', 沐浴: 'Mộc Dục', 冠带: 'Quan Đới', 临官: 'Lâm Quan', 帝旺: 'Đế Vượng',
  博士: 'Bác Sĩ', 力士: 'Lực Sĩ', 青龙: 'Thanh Long', 将军: 'Tướng Quân', 奏书: 'Tấu Thư',
  喜神: 'Hỷ Thần', 病符: 'Bệnh Phù', 伏兵: 'Phục Binh', 官府: 'Quan Phủ',
  岁建: 'Tuế Kiến', 晦气: 'Hối Khí', 丧门: 'Tang Môn', 贯索: 'Quán Sách', 官符: 'Quan Phù',
  白虎: 'Bạch Hổ', 吊客: 'Điếu Khách', 将星: 'Tướng Tinh', 攀鞍: 'Phan An', 岁驿: 'Tuế Dịch',
  息神: 'Tức Thần', 灾煞: 'Tai Sát', 天煞: 'Thiên Sát', 指背: 'Chỉ Bối', 月煞: 'Nguyệt Sát',
  亡神: 'Vong Thần',

  // 12 cung
  命宫: 'Mệnh', 身宫: 'Thân', 兄弟宫: 'Huynh Đệ', 夫妻宫: 'Phu Thê', 子女宫: 'Tử Tức',
  财帛宫: 'Tài Bạch', 疾厄宫: 'Tật Ách', 迁移宫: 'Thiên Di', 交友宫: 'Nô Bộc', 仆役宫: 'Nô Bộc',
  官禄宫: 'Quan Lộc', 田宅宫: 'Điền Trạch', 福德宫: 'Phúc Đức', 父母宫: 'Phụ Mẫu',
  兄弟: 'Huynh Đệ', 夫妻: 'Phu Thê', 子女: 'Tử Tức', 财帛: 'Tài Bạch', 疾厄: 'Tật Ách',
  迁移: 'Thiên Di', 交友: 'Nô Bộc', 仆役: 'Nô Bộc', 官禄: 'Quan Lộc', 田宅: 'Điền Trạch',
  福德: 'Phúc Đức', 父母: 'Phụ Mẫu',

  // Ngũ hành cục
  水二局: 'Thủy Nhị Cục', 木三局: 'Mộc Tam Cục', 金四局: 'Kim Tứ Cục',
  土五局: 'Thổ Ngũ Cục', 火六局: 'Hỏa Lục Cục',

  // Tứ hóa và khái niệm chung
  化禄: 'Hóa Lộc', 化权: 'Hóa Quyền', 化科: 'Hóa Khoa', 化忌: 'Hóa Kỵ',
  四化: 'Tứ Hóa', 大限: 'Đại Hạn', 小限: 'Tiểu Hạn', 流年: 'Lưu Niên', 流月: 'Lưu Nguyệt',
  本命: 'Bản Mệnh', 命盘: 'lá số', 三方四正: 'Tam Phương Tứ Chính', 三方: 'Tam Phương',
  主星: 'chính tinh', 吉星: 'cát tinh', 煞星: 'sát tinh', 凶星: 'hung tinh', 辅星: 'phụ tinh',
  空宫: 'Vô Chính Diệu', 对宫: 'cung đối', 真太阳时: 'giờ mặt trời thực', 合盘: 'hợp số',
  起盘: 'lập lá số', 排盘: 'lập lá số', 紫微斗数: 'Tử Vi Đẩu Số', 倪海厦: 'Nghê Hải Hạ', 倪师: 'Nghê sư',
  天纪: 'Thiên Kỷ', 地纪: 'Địa Kỷ', 人纪: 'Nhân Kỷ', 骨髓赋: 'Cốt Tủy Phú',
  紫微斗数全集: 'Tử Vi Đẩu Số Toàn Tập', 紫微斗数全书: 'Tử Vi Đẩu Số Toàn Thư',
  斗数全书: 'Đẩu Số Toàn Thư',
};
