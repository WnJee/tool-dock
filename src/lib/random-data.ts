export type RandomDataCategory = 'china-profile' | 'us-profile' | 'contacts' | 'passwords'

export interface RandomDataField {
  id: string
  label: string
  value: string
  detail?: string
}

export interface PasswordRule {
  id: string
  label: string
  regex: RegExp
  pattern: string
  generate: () => string
}

/**
 * 所有取值都由 crypto 随机源现场组合生成，而不是从固定候选表里轮换：
 * 姓氏 × 名字用字、省 × 市 × 区 × 街道词根 × 门牌、音节 × 音节的人名与街名，
 * 组合空间在百万级以上，连续点击「重新生成」不会看到重复套路。
 */
interface CnRegion {
  province: string
  postalPrefix: string
  cities: readonly string[]
  districts: readonly string[]
}

const CN_REGIONS: readonly CnRegion[] = [
  { province: '北京市', postalPrefix: '100', cities: [''], districts: ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '通州区', '昌平区'] },
  { province: '上海市', postalPrefix: '200', cities: [''], districts: ['浦东新区', '徐汇区', '静安区', '黄浦区', '长宁区', '闵行区', '宝山区'] },
  { province: '天津市', postalPrefix: '300', cities: [''], districts: ['和平区', '南开区', '河西区', '滨海新区', '西青区'] },
  { province: '重庆市', postalPrefix: '400', cities: [''], districts: ['渝中区', '江北区', '南岸区', '沙坪坝区', '九龙坡区'] },
  {
    province: '广东省',
    postalPrefix: '510',
    cities: ['广州市', '深圳市', '东莞市', '佛山市', '珠海市'],
    districts: ['天河区', '南山区', '越秀区', '罗湖区', '福田区', '白云区', '顺德区'],
  },
  {
    province: '浙江省',
    postalPrefix: '310',
    cities: ['杭州市', '宁波市', '温州市', '嘉兴市'],
    districts: ['西湖区', '滨江区', '拱墅区', '鄞州区', '鹿城区', '南湖区'],
  },
  {
    province: '江苏省',
    postalPrefix: '210',
    cities: ['南京市', '苏州市', '无锡市', '常州市'],
    districts: ['鼓楼区', '玄武区', '姑苏区', '梁溪区', '天宁区', '吴中区'],
  },
  { province: '四川省', postalPrefix: '610', cities: ['成都市', '绵阳市', '德阳市'], districts: ['高新区', '武侯区', '锦江区', '青羊区', '涪城区'] },
  { province: '湖北省', postalPrefix: '430', cities: ['武汉市', '宜昌市', '襄阳市'], districts: ['洪山区', '武昌区', '江汉区', '西陵区', '樊城区'] },
  { province: '山东省', postalPrefix: '250', cities: ['济南市', '青岛市', '烟台市'], districts: ['历下区', '市南区', '崂山区', '芝罘区'] },
  { province: '福建省', postalPrefix: '350', cities: ['福州市', '厦门市', '泉州市'], districts: ['鼓楼区', '思明区', '湖里区', '丰泽区'] },
  { province: '陕西省', postalPrefix: '710', cities: ['西安市', '咸阳市'], districts: ['雁塔区', '碑林区', '未央区', '秦都区'] },
  { province: '辽宁省', postalPrefix: '110', cities: ['沈阳市', '大连市'], districts: ['和平区', '沈河区', '中山区', '沙河口区'] },
  { province: '河南省', postalPrefix: '450', cities: ['郑州市', '洛阳市'], districts: ['金水区', '二七区', '洛龙区', '涧西区'] },
  { province: '湖南省', postalPrefix: '410', cities: ['长沙市', '株洲市'], districts: ['岳麓区', '芙蓉区', '天心区', '天元区'] },
]

const CN_STREET_ROOTS = [
  '望京',
  '建国',
  '朝阳',
  '张江',
  '世纪',
  '金科',
  '天河',
  '体育西',
  '科技南',
  '深南',
  '南海',
  '文三',
  '天目山',
  '古墩',
  '中山北',
  '汉中',
  '江东北',
  '天府',
  '盛和一',
  '锦城',
  '珞瑜',
  '民族',
  '光谷',
  '学院',
  '建设',
  '人民',
  '解放',
  '和平',
  '长江',
  '黄河',
  '珠江',
  '华夏',
  '幸福',
  '团结',
  '光明',
  '复兴',
  '春熙',
  '金融',
  '横琴',
  '前海',
  '云谷',
  '星河',
  '创业',
  '科技园',
  '软件园',
  '东风',
  '滨江',
  '香樟',
  '梧桐',
  '翠柏',
] as const
const CN_STREET_SUFFIXES = ['路', '大道', '街', '巷', '弄'] as const
const CN_SURNAMES = [
  '王',
  '李',
  '张',
  '刘',
  '陈',
  '杨',
  '黄',
  '赵',
  '周',
  '吴',
  '徐',
  '孙',
  '胡',
  '朱',
  '高',
  '林',
  '何',
  '郭',
  '马',
  '罗',
  '梁',
  '宋',
  '郑',
  '谢',
  '韩',
  '唐',
  '冯',
  '于',
  '董',
  '萧',
  '程',
  '曹',
  '袁',
  '邓',
  '许',
  '傅',
  '沈',
  '曾',
  '彭',
  '吕',
  '苏',
  '卢',
  '蒋',
  '蔡',
  '贾',
  '丁',
  '魏',
  '薛',
  '叶',
  '阎',
  '余',
  '潘',
  '杜',
  '戴',
  '夏',
  '钟',
  '汪',
  '田',
  '任',
  '姜',
  '范',
  '方',
  '石',
  '姚',
  '谭',
  '廖',
  '邹',
  '熊',
  '金',
  '陆',
  '郝',
  '孔',
  '白',
  '崔',
  '康',
  '毛',
  '邱',
  '秦',
  '江',
  '史',
  '顾',
  '侯',
  '邵',
  '孟',
  '龙',
  '万',
  '段',
  '雷',
  '钱',
  '汤',
  '尹',
  '黎',
  '易',
  '常',
  '武',
  '乔',
  '贺',
  '赖',
  '龚',
  '文',
] as const
const CN_GIVEN_CHARS = [
  '子',
  '雨',
  '浩',
  '佳',
  '宇',
  '若',
  '一',
  '思',
  '静',
  '晨',
  '星',
  '欣',
  '梓',
  '涵',
  '桐',
  '然',
  '怡',
  '轩',
  '曦',
  '诺',
  '远',
  '妍',
  '悦',
  '嘉',
  '语',
  '彤',
  '辰',
  '瑞',
  '泽',
  '婉',
  '清',
  '书',
  '念',
  '亦',
  '知',
  '锦',
  '南',
  '安',
  '宁',
  '乐',
  '天',
  '明',
  '文',
  '博',
  '慧',
  '敏',
  '雅',
  '庭',
  '树',
  '宏',
  '伟',
  '诚',
  '若',
  '初',
  '晗',
  '朗',
  '森',
  '淼',
  '焱',
  '垚',
  '玥',
  '瑜',
  '瑾',
  '航',
  '舟',
  '帆',
  '澜',
  '溪',
  '岚',
  '峰',
  '岩',
  '松',
  '柏',
  '青',
  '白',
  '墨',
  '砚',
  '笛',
  '歌',
  '弦',
  '音',
  '希',
  '望',
  '朝',
  '阳',
  '晴',
  '云',
  '霜',
  '雪',
] as const
const US_FIRST_STARTS = [
  'Al',
  'Bel',
  'Car',
  'Dan',
  'El',
  'Fran',
  'Gar',
  'Hal',
  'Ja',
  'Kel',
  'Lan',
  'Mar',
  'Nol',
  'Os',
  'Pres',
  'Quin',
  'Ros',
  'Sav',
  'Tor',
  'Val',
  'Wes',
  'Yur',
  'Ad',
  'Bran',
  'Cor',
  'Del',
  'Em',
  'Fin',
  'Gil',
  'Har',
] as const
const US_FIRST_MIDDLES = ['an', 'en', 'in', 'on', 'ar', 'er', 'il', 'or', 'um', 'al', 'el', 'ia', 'io', 'au', 'ea'] as const
const US_FIRST_ENDS = [
  'a',
  'ah',
  'an',
  'ard',
  'bert',
  'den',
  'dra',
  'ette',
  'ford',
  'ia',
  'ina',
  'ius',
  'ley',
  'man',
  'na',
  'nard',
  'on',
  'sen',
  'ton',
  'well',
  'win',
  'yah',
  'elle',
  'ric',
] as const
const US_LAST_STEMS = [
  'Ander',
  'Baker',
  'Clark',
  'Dal',
  'Ever',
  'Field',
  'Grant',
  'Har',
  'Ing',
  'John',
  'King',
  'Lin',
  'Mey',
  'North',
  'Oak',
  'Pres',
  'Reed',
  'Smith',
  'Thorn',
  'Under',
  'Vaugh',
  'Whit',
  'York',
  'Ash',
  'Brad',
  'Corn',
  'Dun',
  'Fair',
  'Gray',
  'Holl',
] as const
const US_LAST_ENDS = ['son', 'ton', 'ley', 'man', 'ford', 'er', 'ers', 'ins', 'well', 'wood', 'ham', 'land', 'worth', 'ing', 'stein', 'field'] as const
const US_STREET_ROOTS = [
  'Maple',
  'Cedar',
  'Willow',
  'Lakeview',
  'Sunset',
  'Highland',
  'Riverside',
  'Park',
  'Oak',
  'Elm',
  'Pine',
  'Birch',
  'Chestnut',
  'Magnolia',
  'Juniper',
  'Meadow',
  'Harbor',
  'Hillcrest',
  'Sunrise',
  'Brookside',
  'Foxglove',
  'Windsor',
  'Kingsley',
  'Camelot',
  'Quail',
  'Heron',
  'Aspen',
  'Bramble',
  'Crescent',
  'Fairview',
] as const
const US_STREET_TYPES = ['St', 'Ave', 'Blvd', 'Rd', 'Ln', 'Dr', 'Ct', 'Way', 'Terrace', 'Parkway'] as const
const US_PLACES: ReadonlyArray<{ city: string; state: string; zipPrefix: string; areaCode: string }> = [
  { city: 'New York', state: 'NY', zipPrefix: '100', areaCode: '212' },
  { city: 'Brooklyn', state: 'NY', zipPrefix: '112', areaCode: '718' },
  { city: 'Los Angeles', state: 'CA', zipPrefix: '900', areaCode: '213' },
  { city: 'San Diego', state: 'CA', zipPrefix: '921', areaCode: '619' },
  { city: 'San Jose', state: 'CA', zipPrefix: '951', areaCode: '408' },
  { city: 'Chicago', state: 'IL', zipPrefix: '606', areaCode: '312' },
  { city: 'Houston', state: 'TX', zipPrefix: '770', areaCode: '713' },
  { city: 'Dallas', state: 'TX', zipPrefix: '752', areaCode: '214' },
  { city: 'Austin', state: 'TX', zipPrefix: '733', areaCode: '512' },
  { city: 'Seattle', state: 'WA', zipPrefix: '981', areaCode: '206' },
  { city: 'Bellevue', state: 'WA', zipPrefix: '980', areaCode: '425' },
  { city: 'Boston', state: 'MA', zipPrefix: '021', areaCode: '617' },
  { city: 'Cambridge', state: 'MA', zipPrefix: '021', areaCode: '857' },
  { city: 'Denver', state: 'CO', zipPrefix: '802', areaCode: '303' },
  { city: 'Miami', state: 'FL', zipPrefix: '331', areaCode: '305' },
  { city: 'Orlando', state: 'FL', zipPrefix: '328', areaCode: '407' },
  { city: 'Atlanta', state: 'GA', zipPrefix: '303', areaCode: '404' },
  { city: 'Phoenix', state: 'AZ', zipPrefix: '850', areaCode: '602' },
  { city: 'Portland', state: 'OR', zipPrefix: '972', areaCode: '503' },
  { city: 'Las Vegas', state: 'NV', zipPrefix: '891', areaCode: '702' },
  { city: 'Philadelphia', state: 'PA', zipPrefix: '191', areaCode: '215' },
  { city: 'Pittsburgh', state: 'PA', zipPrefix: '152', areaCode: '412' },
  { city: 'Detroit', state: 'MI', zipPrefix: '482', areaCode: '313' },
  { city: 'Minneapolis', state: 'MN', zipPrefix: '554', areaCode: '612' },
  { city: 'Nashville', state: 'TN', zipPrefix: '372', areaCode: '615' },
  { city: 'Charlotte', state: 'NC', zipPrefix: '282', areaCode: '704' },
  { city: 'Salt Lake City', state: 'UT', zipPrefix: '841', areaCode: '801' },
  { city: 'Kansas City', state: 'MO', zipPrefix: '641', areaCode: '816' },
]
const CN_PHONE_PREFIXES = [
  '130',
  '131',
  '132',
  '133',
  '135',
  '136',
  '137',
  '138',
  '139',
  '150',
  '151',
  '152',
  '153',
  '155',
  '156',
  '157',
  '158',
  '159',
  '166',
  '170',
  '171',
  '173',
  '175',
  '176',
  '177',
  '178',
  '180',
  '181',
  '182',
  '183',
  '185',
  '186',
  '187',
  '188',
  '189',
  '191',
  '193',
  '195',
  '196',
  '198',
  '199',
] as const
const CN_LANDLINE_AREA_CODES = [
  '10',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '27',
  '28',
  '29',
  '311',
  '312',
  '315',
  '316',
  '371',
  '371',
  '411',
  '431',
  '451',
  '511',
  '512',
  '531',
  '551',
  '571',
  '574',
  '591',
  '592',
  '731',
  '771',
  '791',
  '851',
  '871',
  '891',
  '898',
  '931',
  '951',
  '971',
  '991',
] as const
const EMAIL_DOMAINS = [
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'sohu.com',
  'foxmail.com',
  'outlook.com',
  'hotmail.com',
  'gmail.com',
  'icloud.com',
  'yahoo.com',
  'yeah.net',
] as const
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SPECIAL = '!@#$%^&*_-+=?'

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'basic',
    label: '基础密码',
    regex: /^[A-Za-z\d]{8,16}$/,
    pattern: '^[A-Za-z\\d]{8,16}$',
    generate: () => randomString(12, LOWER + UPPER + DIGITS),
  },
  {
    id: 'standard',
    label: '标准密码',
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]{8,16}$',
    generate: () => generateRequiredPassword(12, [LOWER, UPPER, DIGITS], LOWER + UPPER + DIGITS),
  },
  {
    id: 'strong',
    label: '强密码',
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_{\-}+=?])[A-Za-z\d!@#$%^&*_{\-}+=?]{12,20}$/,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*_\\-+=?]).{12,20}$',
    generate: () => generateRequiredPassword(16, [LOWER, UPPER, DIGITS, SPECIAL], LOWER + UPPER + DIGITS + SPECIAL),
  },
  {
    id: 'letters-digits',
    label: '字母数字',
    regex: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{10,18}$/,
    pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{10,18}$',
    generate: () => generateRequiredPassword(14, [LOWER + UPPER, DIGITS], LOWER + UPPER + DIGITS),
  },
  {
    id: 'pin',
    label: '6 位 PIN',
    regex: /^\d{6}$/,
    pattern: '^\\d{6}$',
    generate: () => randomString(6, DIGITS),
  },
]

export function generateRandomData(category: RandomDataCategory): RandomDataField[] {
  if (category === 'china-profile') return generateChinaProfile()
  if (category === 'us-profile') return generateUsProfile()
  if (category === 'contacts') return generateContacts()
  return PASSWORD_RULES.map((rule) => ({ id: rule.id, label: rule.label, value: rule.generate(), detail: rule.pattern }))
}

export function generateChinaMobile(): string {
  return `${pick(CN_PHONE_PREFIXES)}${randomString(8, DIGITS)}`
}

export function generateUsTestPhone(areaCode = pick(US_PLACES).areaCode): string {
  return `+1 (${areaCode}) 555-01${String(randomInt(100)).padStart(2, '0')}`
}

/** 姓氏 + 1~2 个随机名字用字，组合数约 100 × 90² */
export function generateChineseName(): string {
  const length = randomInt(4) === 0 ? 1 : 2
  return `${pick(CN_SURNAMES)}${Array.from({ length }, () => pick(CN_GIVEN_CHARS)).join('')}`
}

/** 省 × 市 × 区 × 街道词根 × 门牌 / 楼栋 / 单元 / 室 */
export function generateChineseAddress(): { address: string; postalCode: string } {
  const region = pick(CN_REGIONS)
  const city = pick(region.cities)
  const district = pick(region.districts)
  const street = `${pick(CN_STREET_ROOTS)}${pick(CN_STREET_SUFFIXES)}`
  const number = randomInt(288) + 1
  const building = randomInt(26) + 1
  const unit = randomInt(6) + 1
  const room = ownRoomNumber()
  const address = `${region.province}${city}${district}${street}${number}号 ${building}栋${unit}单元${room}室`
  return { address, postalCode: `${region.postalPrefix}${String(randomInt(1000)).padStart(3, '0')}` }
}

function ownRoomNumber(): number {
  const floor = randomInt(33) + 1
  return floor * 100 + randomInt(4) + 1
}

/** 音节组合的英文名，组合数约 30 × 15 × 24 */
export function generateUsName(): string {
  const first = `${pick(US_FIRST_STARTS)}${pick(US_FIRST_MIDDLES)}${pick(US_FIRST_ENDS)}`
  const last = `${pick(US_LAST_STEMS)}${pick(US_LAST_ENDS)}`
  return `${first} ${last}`
}

function randomHandle(): string {
  const word = randomString(randomInt(4) + 6, LOWER)
  return `${word}${randomInt(9000) + 1000}`
}

function generateChinaProfile(): RandomDataField[] {
  const name = generateChineseName()
  const username = randomHandle()
  const { address, postalCode } = generateChineseAddress()
  return [
    { id: 'name', label: '收货人', value: name },
    { id: 'username', label: '用户名', value: username },
    { id: 'phone', label: '手机号', value: generateChinaMobile(), detail: '^1[3-9]\\d{9}$' },
    { id: 'email', label: '邮箱', value: `${username}@${pick(EMAIL_DOMAINS)}` },
    { id: 'postal-code', label: '邮政编码', value: postalCode },
    { id: 'address', label: '收货地址', value: address },
  ]
}

function generateUsProfile(): RandomDataField[] {
  const place = pick(US_PLACES)
  const fullName = generateUsName()
  const [firstName, lastName] = fullName.split(' ')
  const handle = `${firstName}.${lastName}${randomInt(900) + 100}`.toLowerCase()
  const address = `${randomInt(9899) + 100} ${pick(US_STREET_ROOTS)} ${pick(US_STREET_TYPES)}, Apt ${randomInt(899) + 101}`
  return [
    { id: 'name', label: 'Full name', value: fullName },
    { id: 'username', label: 'Username', value: handle.replace('.', '_') },
    { id: 'phone', label: 'Phone', value: generateUsTestPhone(place.areaCode), detail: '555-01xx reserved test range' },
    { id: 'email', label: 'Email', value: `${handle}@example.com`, detail: 'example.com reserved domain' },
    { id: 'address-line', label: 'Billing address', value: address },
    { id: 'city-state', label: 'City / State', value: `${place.city}, ${place.state}` },
    { id: 'zip', label: 'ZIP code', value: `${place.zipPrefix}${String(randomInt(100)).padStart(2, '0')}` },
    { id: 'country', label: 'Country', value: 'United States' },
  ]
}

function generateContacts(): RandomDataField[] {
  const handle = randomHandle()
  const areaCode = pick(CN_LANDLINE_AREA_CODES)
  return [
    { id: 'cn-mobile', label: '中国大陆手机', value: generateChinaMobile(), detail: '^1[3-9]\\d{9}$' },
    { id: 'cn-landline', label: '中国固话', value: `0${areaCode}-${randomInt(9_000_000) + 1_000_000}`, detail: '0 + 区号 + 7~8 位' },
    { id: 'us-phone', label: '美国测试号码', value: generateUsTestPhone(), detail: 'NANP 555-01xx' },
    { id: 'qq-email', label: 'QQ 邮箱', value: `${randomInt(900_000_000) + 100_000_000}@qq.com` },
    { id: '163-email', label: '163 邮箱', value: `${handle}@163.com` },
    { id: 'gmail', label: 'Gmail', value: `${handle}@gmail.com` },
    { id: 'outlook', label: 'Outlook', value: `${handle}@outlook.com` },
  ]
}

function generateRequiredPassword(length: number, requiredGroups: string[], alphabet: string): string {
  const required = requiredGroups.map((group) => pickChar(group))
  const remaining = Array.from({ length: length - required.length }, () => pickChar(alphabet))
  return shuffle([...required, ...remaining]).join('')
}

function randomString(length: number, alphabet: string): string {
  return Array.from({ length }, () => pickChar(alphabet)).join('')
}

function pickChar(alphabet: string): string {
  return alphabet[randomInt(alphabet.length)]
}

function pick<T>(values: readonly T[]): T {
  return values[randomInt(values.length)]
}

function shuffle<T>(values: T[]): T[] {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1)
    ;[values[index], values[target]] = [values[target], values[index]]
  }
  return values
}

function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new Error('随机数上限必须是正整数')
  const limit = 0x1_0000_0000 - (0x1_0000_0000 % max)
  const buffer = new Uint32Array(1)
  do crypto.getRandomValues(buffer)
  while (buffer[0] >= limit)
  return buffer[0] % max
}
