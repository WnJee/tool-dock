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

const CN_LOCATIONS = [
  { region: '北京市朝阳区', postalCode: '100020', streets: ['望京路', '建国路', '朝阳北路'] },
  { region: '上海市浦东新区', postalCode: '200120', streets: ['张江路', '世纪大道', '金科路'] },
  { region: '广东省广州市天河区', postalCode: '510630', streets: ['天河路', '体育西路', '黄埔大道'] },
  { region: '广东省深圳市南山区', postalCode: '518052', streets: ['科技南路', '深南大道', '南海大道'] },
  { region: '浙江省杭州市西湖区', postalCode: '310013', streets: ['文三路', '天目山路', '古墩路'] },
  { region: '江苏省南京市鼓楼区', postalCode: '210009', streets: ['中山北路', '汉中路', '江东北路'] },
  { region: '四川省成都市高新区', postalCode: '610041', streets: ['天府大道', '盛和一路', '锦城大道'] },
  { region: '湖北省武汉市洪山区', postalCode: '430070', streets: ['珞瑜路', '民族大道', '光谷大道'] },
] as const

const US_LOCATIONS = [
  { city: 'New York', state: 'NY', zip: '10001', areaCode: '212' },
  { city: 'Los Angeles', state: 'CA', zip: '90012', areaCode: '213' },
  { city: 'Chicago', state: 'IL', zip: '60601', areaCode: '312' },
  { city: 'Houston', state: 'TX', zip: '77002', areaCode: '713' },
  { city: 'Seattle', state: 'WA', zip: '98101', areaCode: '206' },
  { city: 'Boston', state: 'MA', zip: '02108', areaCode: '617' },
  { city: 'Denver', state: 'CO', zip: '80202', areaCode: '303' },
  { city: 'Miami', state: 'FL', zip: '33130', areaCode: '305' },
] as const

const CN_SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '胡', '朱', '高']
const CN_GIVEN_NAMES = ['子涵', '雨桐', '浩然', '佳怡', '宇轩', '若曦', '一诺', '思远', '静怡', '晨曦', '星宇', '欣妍']
const US_FIRST_NAMES = ['Avery', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Cameron', 'Parker', 'Quinn', 'Hayden']
const US_LAST_NAMES = ['Anderson', 'Carter', 'Davis', 'Foster', 'Miller', 'Parker', 'Reed', 'Turner', 'Walker', 'Young']
const STREET_NAMES = ['Maple', 'Cedar', 'Willow', 'Lakeview', 'Sunset', 'Highland', 'Riverside', 'Park']
const CN_PHONE_PREFIXES = ['130', '131', '132', '133', '135', '136', '137', '138', '139', '150', '151', '152', '155', '156', '157', '158', '159', '166', '173', '175', '176', '177', '178', '180', '181', '182', '183', '185', '186', '187', '188', '189', '191', '193', '195', '198', '199']
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SPECIAL = '!@#$%^&*_-+=?'

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'basic', label: '基础密码',
    regex: /^[A-Za-z\d]{8,16}$/,
    pattern: '^[A-Za-z\\d]{8,16}$',
    generate: () => randomString(12, LOWER + UPPER + DIGITS),
  },
  {
    id: 'standard', label: '标准密码',
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]{8,16}$',
    generate: () => generateRequiredPassword(12, [LOWER, UPPER, DIGITS], LOWER + UPPER + DIGITS),
  },
  {
    id: 'strong', label: '强密码',
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_{\-}+=?])[A-Za-z\d!@#$%^&*_{\-}+=?]{12,20}$/,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*_\\-+=?]).{12,20}$',
    generate: () => generateRequiredPassword(16, [LOWER, UPPER, DIGITS, SPECIAL], LOWER + UPPER + DIGITS + SPECIAL),
  },
  {
    id: 'letters-digits', label: '字母数字',
    regex: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{10,18}$/,
    pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{10,18}$',
    generate: () => generateRequiredPassword(14, [LOWER + UPPER, DIGITS], LOWER + UPPER + DIGITS),
  },
  {
    id: 'pin', label: '6 位 PIN',
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

export function generateUsTestPhone(areaCode = pick(US_LOCATIONS).areaCode): string {
  return `+1 (${areaCode}) 555-01${String(randomInt(100)).padStart(2, '0')}`
}

function generateChinaProfile(): RandomDataField[] {
  const location = pick(CN_LOCATIONS)
  const name = `${pick(CN_SURNAMES)}${pick(CN_GIVEN_NAMES)}`
  const username = `${randomString(6, LOWER)}${randomString(4, DIGITS)}`
  const address = `${location.region}${pick(location.streets)}${randomInt(238) + 1}号 ${randomInt(20) + 1}栋${randomInt(6) + 1}单元${randomInt(2804) + 101}室`
  return [
    { id: 'name', label: '收货人', value: name },
    { id: 'username', label: '用户名', value: username },
    { id: 'phone', label: '手机号', value: generateChinaMobile() },
    { id: 'email', label: '邮箱', value: `${username}@${pick(['qq.com', '163.com', 'outlook.com'])}` },
    { id: 'postal-code', label: '邮政编码', value: location.postalCode },
    { id: 'address', label: '收货地址', value: address },
  ]
}

function generateUsProfile(): RandomDataField[] {
  const location = pick(US_LOCATIONS)
  const firstName = pick(US_FIRST_NAMES)
  const lastName = pick(US_LAST_NAMES)
  const handle = `${firstName}.${lastName}${randomInt(900) + 100}`.toLowerCase()
  const address = `${randomInt(9899) + 100} ${pick(STREET_NAMES)} ${pick(['St', 'Ave', 'Blvd', 'Rd'])}, Apt ${randomInt(899) + 101}`
  return [
    { id: 'name', label: 'Full name', value: `${firstName} ${lastName}` },
    { id: 'username', label: 'Username', value: handle.replace('.', '_') },
    { id: 'phone', label: 'Phone', value: generateUsTestPhone(location.areaCode), detail: '555-01xx reserved test range' },
    { id: 'email', label: 'Email', value: `${handle}@example.com`, detail: 'example.com reserved domain' },
    { id: 'address-line', label: 'Billing address', value: address },
    { id: 'city-state', label: 'City / State', value: `${location.city}, ${location.state}` },
    { id: 'zip', label: 'ZIP code', value: location.zip },
    { id: 'country', label: 'Country', value: 'United States' },
  ]
}

function generateContacts(): RandomDataField[] {
  const handle = `${randomString(8, LOWER)}${randomInt(900) + 100}`
  return [
    { id: 'cn-mobile', label: '中国大陆手机', value: generateChinaMobile(), detail: '^1[3-9]\\d{9}$' },
    { id: 'cn-landline', label: '中国固话', value: `0${pick(['10', '20', '21', '22', '23', '25', '27', '28'])}-${randomInt(9_000_000) + 1_000_000}` },
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
