import { getCategory } from './categories'
import type { CategoryId, CategoryRule } from './types'

export interface CategorizeResult {
  categoryId: CategoryId
  /** 0..1. Below `REVIEW_THRESHOLD` the transaction goes to the review queue. */
  confidence: number
  /** Short human explanation, e.g. `Matched "uber" → Transport`. */
  reason: string
  merchant: string
}

export const REVIEW_THRESHOLD = 0.7

type Sign = 'in' | 'out'

interface MerchantEntry {
  /** Upper-case token(s) looked up with word boundaries in the cleaned description. */
  match: string
  name: string
  category: CategoryId
  sign?: Sign
}

// Order matters: more specific entries first (Uber Eats before Uber).
const MERCHANTS: MerchantEntry[] = [
  { match: 'UBER EATS', name: 'Uber Eats', category: 'dining' },
  { match: 'UBER', name: 'Uber', category: 'transport' },
  { match: 'LYFT', name: 'Lyft', category: 'transport' },
  { match: 'SHELL OIL', name: 'Shell', category: 'transport' },
  { match: 'CHEVRON', name: 'Chevron', category: 'transport' },
  { match: 'CLIPPER', name: 'Clipper transit', category: 'transport' },
  { match: 'PARKMOBILE', name: 'ParkMobile', category: 'transport' },
  { match: 'DOORDASH', name: 'DoorDash', category: 'dining' },
  { match: 'GRUBHUB', name: 'Grubhub', category: 'dining' },
  { match: 'STARBUCKS', name: 'Starbucks', category: 'dining' },
  { match: 'BLUE BOTTLE', name: 'Blue Bottle Coffee', category: 'dining' },
  { match: 'SWEETGREEN', name: 'Sweetgreen', category: 'dining' },
  { match: 'CHIPOTLE', name: 'Chipotle', category: 'dining' },
  { match: 'SHAKE SHACK', name: 'Shake Shack', category: 'dining' },
  { match: 'PRET A MANGER', name: 'Pret A Manger', category: 'dining' },
  { match: 'TRADER JOE', name: "Trader Joe's", category: 'groceries' },
  { match: 'WHOLEFDS', name: 'Whole Foods', category: 'groceries' },
  { match: 'WHOLE FOODS', name: 'Whole Foods', category: 'groceries' },
  { match: 'SAFEWAY', name: 'Safeway', category: 'groceries' },
  { match: 'COSTCO', name: 'Costco', category: 'groceries' },
  { match: 'ALDI', name: 'Aldi', category: 'groceries' },
  { match: 'INSTACART', name: 'Instacart', category: 'groceries' },
  { match: 'AMAZON PRIME', name: 'Amazon Prime', category: 'subscriptions' },
  { match: 'AMZN MKTP', name: 'Amazon', category: 'shopping' },
  { match: 'AMAZON', name: 'Amazon', category: 'shopping' },
  { match: 'TARGET', name: 'Target', category: 'shopping' },
  { match: 'UNIQLO', name: 'Uniqlo', category: 'shopping' },
  { match: 'IKEA', name: 'IKEA', category: 'shopping' },
  { match: 'BEST BUY', name: 'Best Buy', category: 'shopping' },
  { match: 'ETSY', name: 'Etsy', category: 'shopping' },
  { match: 'NETFLIX', name: 'Netflix', category: 'subscriptions' },
  { match: 'SPOTIFY', name: 'Spotify', category: 'subscriptions' },
  { match: 'HULU', name: 'Hulu', category: 'subscriptions' },
  { match: 'DISNEYPLUS', name: 'Disney+', category: 'subscriptions' },
  { match: 'DISNEY PLUS', name: 'Disney+', category: 'subscriptions' },
  { match: 'YOUTUBEPREMIUM', name: 'YouTube Premium', category: 'subscriptions' },
  { match: 'YOUTUBE', name: 'YouTube Premium', category: 'subscriptions' },
  { match: 'HBO MAX', name: 'HBO Max', category: 'subscriptions' },
  { match: 'AUDIBLE', name: 'Audible', category: 'subscriptions' },
  { match: 'XBOX', name: 'Xbox Game Pass', category: 'subscriptions' },
  { match: 'PLAYSTATION', name: 'PlayStation Plus', category: 'subscriptions' },
  { match: 'APPLE COM BILL', name: 'Apple iCloud', category: 'subscriptions' },
  { match: 'DUOLINGO', name: 'Duolingo', category: 'subscriptions' },
  { match: 'HEADSPACE', name: 'Headspace', category: 'subscriptions' },
  { match: 'STRAVA', name: 'Strava', category: 'subscriptions' },
  { match: 'PELOTON', name: 'Peloton App', category: 'subscriptions' },
  { match: 'NYTIMES', name: 'New York Times', category: 'subscriptions' },
  { match: 'PATREON', name: 'Patreon', category: 'subscriptions' },
  { match: 'ADOBE', name: 'Adobe', category: 'software' },
  { match: 'FIGMA', name: 'Figma', category: 'software' },
  { match: 'NOTION', name: 'Notion', category: 'software' },
  { match: 'DROPBOX', name: 'Dropbox', category: 'software' },
  { match: 'ZOOM US', name: 'Zoom', category: 'software' },
  { match: 'GSUITE', name: 'Google Workspace', category: 'software' },
  { match: 'GOOGLE WORKSPACE', name: 'Google Workspace', category: 'software' },
  { match: 'GITHUB', name: 'GitHub', category: 'software' },
  { match: 'CANVA', name: 'Canva', category: 'software' },
  { match: 'SLACK', name: 'Slack', category: 'software' },
  { match: 'INTUIT', name: 'QuickBooks', category: 'software' },
  { match: 'SQUARESPACE', name: 'Squarespace', category: 'software' },
  { match: 'WEBFLOW', name: 'Webflow', category: 'software' },
  { match: '1PASSWORD', name: '1Password', category: 'software' },
  { match: 'WEWORK', name: 'WeWork', category: 'workspace' },
  { match: 'REGUS', name: 'Regus', category: 'workspace' },
  { match: 'B&H PHOTO', name: 'B&H Photo', category: 'equipment' },
  { match: 'WEBSTAURANT', name: 'WebstaurantStore', category: 'equipment' },
  { match: 'GUSTO', name: 'Gusto payroll', category: 'payroll', sign: 'out' },
  { match: 'FACEBK', name: 'Meta ads', category: 'marketing' },
  { match: 'META ADS', name: 'Meta ads', category: 'marketing' },
  { match: 'GOOGLE ADS', name: 'Google Ads', category: 'marketing' },
  { match: 'MAILCHIMP', name: 'Mailchimp', category: 'marketing' },
  { match: 'VISTAPRINT', name: 'Vistaprint', category: 'marketing' },
  { match: 'LEGALZOOM', name: 'LegalZoom', category: 'professional-services' },
  { match: 'HISCOX', name: 'Hiscox', category: 'business-insurance' },
  { match: 'NEXT INSURANCE', name: 'Next Insurance', category: 'business-insurance' },
  { match: 'SQUARE INC', name: 'Square', category: 'sales', sign: 'in' },
  { match: 'SHOPIFY', name: 'Shopify', category: 'sales', sign: 'in' },
  { match: 'UPWORK', name: 'Upwork', category: 'client-income', sign: 'in' },
  { match: 'PG&E', name: 'PG&E', category: 'utilities' },
  { match: 'CON ED', name: 'Con Edison', category: 'utilities' },
  { match: 'VERIZON', name: 'Verizon', category: 'phone-internet' },
  { match: 'T-MOBILE', name: 'T-Mobile', category: 'phone-internet' },
  { match: 'AT&T', name: 'AT&T', category: 'phone-internet' },
  { match: 'COMCAST', name: 'Xfinity', category: 'phone-internet' },
  { match: 'XFINITY', name: 'Xfinity', category: 'phone-internet' },
  { match: 'MINT MOBILE', name: 'Mint Mobile', category: 'phone-internet' },
  { match: 'PLANET FITNESS', name: 'Planet Fitness', category: 'health-fitness' },
  { match: 'CLASSPASS', name: 'ClassPass', category: 'health-fitness' },
  { match: 'EQUINOX', name: 'Equinox', category: 'health-fitness' },
  { match: 'CVS', name: 'CVS Pharmacy', category: 'health-fitness' },
  { match: 'WALGREENS', name: 'Walgreens', category: 'health-fitness' },
  { match: 'OSCAR HEALTH', name: 'Oscar Health', category: 'insurance' },
  { match: 'LEMONADE', name: 'Lemonade', category: 'insurance' },
  { match: 'GEICO', name: 'GEICO', category: 'insurance' },
  { match: 'COURSERA', name: 'Coursera', category: 'education' },
  { match: 'UDEMY', name: 'Udemy', category: 'education' },
  { match: 'SKILLSHARE', name: 'Skillshare', category: 'education' },
  { match: 'AFFIRM', name: 'Affirm', category: 'debt' },
  { match: 'NELNET', name: 'Nelnet student loan', category: 'debt' },
  { match: 'NAVIENT', name: 'Navient', category: 'debt' },
  { match: 'AMC', name: 'AMC Theatres', category: 'entertainment' },
  { match: 'TICKETMASTER', name: 'Ticketmaster', category: 'entertainment' },
  { match: 'EVENTBRITE', name: 'Eventbrite', category: 'entertainment' },
  { match: 'SEPHORA', name: 'Sephora', category: 'personal-care' },
  { match: 'DELTA AIR', name: 'Delta', category: 'travel' },
  { match: 'UNITED AIRLINES', name: 'United', category: 'travel' },
  { match: 'JETBLUE', name: 'JetBlue', category: 'travel' },
  { match: 'AIRBNB', name: 'Airbnb', category: 'travel' },
  { match: 'EXPEDIA', name: 'Expedia', category: 'travel' },
  { match: 'AMTRAK', name: 'Amtrak', category: 'travel' },
  { match: 'MARRIOTT', name: 'Marriott', category: 'travel' },
]

interface KeywordEntry {
  pattern: RegExp
  keyword: string
  category: CategoryId
  confidence: number
  sign?: Sign
}

const kw = (keyword: string, category: CategoryId, confidence: number, sign?: Sign): KeywordEntry => ({
  pattern: new RegExp(`\\b${escapeRegExp(keyword)}\\b`),
  keyword: keyword.toLowerCase(),
  category,
  confidence,
  sign,
})

const KEYWORDS: KeywordEntry[] = [
  kw('EST TAX', 'tax-payment', 0.88, 'out'),
  kw('ESTIMATED TAX', 'tax-payment', 0.88, 'out'),
  kw('TAX PMT', 'tax-payment', 0.85, 'out'),
  kw('TRANSFER TO', 'transfer', 0.88),
  kw('TRANSFER FROM', 'transfer', 0.88),
  kw('ONLINE TRANSFER', 'transfer', 0.85),
  kw('PAYROLL', 'salary', 0.85, 'in'),
  kw('DIR DEP', 'salary', 0.82, 'in'),
  kw('DIRECT DEP', 'salary', 0.82, 'in'),
  kw('PAYROLL', 'payroll', 0.8, 'out'),
  kw('INTEREST', 'other-income', 0.85, 'in'),
  kw('CASHBACK', 'other-income', 0.8, 'in'),
  kw('CASH DEPOSIT', 'sales', 0.62, 'in'),
  kw('STRIPE', 'client-income', 0.72, 'in'),
  kw('INVOICE', 'client-income', 0.72, 'in'),
  kw('ACH CREDIT', 'client-income', 0.55, 'in'),
  kw('EQUIP FINANCE', 'business-loan', 0.85, 'out'),
  kw('STUDENT LN', 'debt', 0.82, 'out'),
  kw('LOAN PMT', 'debt', 0.7, 'out'),
  kw('RENT', 'housing', 0.75, 'out'),
  kw('PROP MGMT', 'housing', 0.72, 'out'),
  kw('APARTMENTS', 'housing', 0.72, 'out'),
  kw('INSURANCE', 'insurance', 0.66, 'out'),
  kw('ELECTRIC', 'utilities', 0.75, 'out'),
  kw('POWER', 'utilities', 0.66, 'out'),
  kw('WATER', 'utilities', 0.66, 'out'),
  kw('INTERNET', 'phone-internet', 0.72, 'out'),
  kw('PHARMACY', 'health-fitness', 0.75, 'out'),
  kw('DENTAL', 'health-fitness', 0.72, 'out'),
  kw('FITNESS', 'health-fitness', 0.7, 'out'),
  kw('SERVICE FEE', 'fees', 0.85, 'out'),
  kw('MONTHLY FEE', 'fees', 0.85, 'out'),
  kw('WIRE FEE', 'fees', 0.85, 'out'),
  kw('BOOKKEEPING', 'professional-services', 0.78, 'out'),
  kw('CPA', 'professional-services', 0.7, 'out'),
  kw('WHOLESALE', 'supplies', 0.66, 'out'),
  kw('SUPPLY', 'supplies', 0.62, 'out'),
  kw('PARKING', 'transport', 0.75, 'out'),
  kw('TAXI', 'transport', 0.7, 'out'),
  kw('AIRLINES', 'travel', 0.75, 'out'),
  kw('HOTEL', 'travel', 0.72, 'out'),
  kw('SALON', 'personal-care', 0.72, 'out'),
  kw('BARBER', 'personal-care', 0.72, 'out'),
  kw('DONATION', 'gifts', 0.72, 'out'),
  kw('FLORIST', 'gifts', 0.66, 'out'),
  kw('BOOKSTORE', 'shopping', 0.62, 'out'),
  kw('MARKET', 'groceries', 0.58, 'out'),
  kw('GROCERY', 'groceries', 0.7, 'out'),
  kw('CAFE', 'dining', 0.66, 'out'),
  kw('COFFEE', 'dining', 0.62, 'out'),
  kw('PIZZA', 'dining', 0.7, 'out'),
  kw('TAQUERIA', 'dining', 0.7, 'out'),
  kw('RESTAURANT', 'dining', 0.7, 'out'),
  kw('KITCHEN', 'dining', 0.6, 'out'),
  kw('VENMO', 'transfer', 0.5),
  kw('ZELLE', 'transfer', 0.5),
  kw('PAYPAL', 'shopping', 0.45, 'out'),
]

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const merchantPatterns = MERCHANTS.map((m) => ({
  ...m,
  // Word boundaries, but allow symbols such as & and - inside the token.
  pattern: new RegExp(`(^|[^A-Z0-9])${escapeRegExp(m.match)}($|[^A-Z0-9])`),
}))

// Prefixes banks and card processors put in front of the merchant name.
const NOISE_PREFIXES = [
  /^POS (DEBIT |PURCHASE )?/,
  /^DEBIT CARD PURCHASE /,
  /^DEBIT PURCHASE /,
  /^CHECKCARD \d{4} /,
  /^CHECKCARD /,
  /^PURCHASE AUTHORIZED ON \d{2}\/\d{2} /,
  /^RECURRING (PAYMENT |DEBIT )?/,
  /^ACH (DEBIT|CREDIT|DEPOSIT|PMT) /,
  /^CARD \d{4} /,
  /^VISA /,
  /^SQ \*/,
  /^SQ\*/,
  /^TST\* ?/,
  /^SP \* ?/,
  /^PAYPAL \*/,
  /^PP\*/,
]

/** Upper-cases, unifies separators and collapses whitespace. */
function clean(description: string): string {
  return description
    .toUpperCase()
    .replace(/[/.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s&'-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/'S\b/g, "'s")
}

function findMerchant(description: string) {
  const text = clean(description).replace(/\*/g, ' ').replace(/\s+/g, ' ')
  return merchantPatterns.find((m) => m.pattern.test(text))
}

/**
 * Strips bank noise from a raw description and returns a readable merchant name:
 * `SQ *BLUE BOTTLE 0423` → `Blue Bottle Coffee`, `ROASTWORKS COFFEE CO #2231` → `Roastworks Coffee Co`.
 */
export function normaliseMerchant(description: string): string {
  const known = findMerchant(description)
  if (known) return known.name

  let s = description.toUpperCase().trim().replace(/\s+/g, ' ')
  for (let i = 0; i < 3; i++) {
    for (const prefix of NOISE_PREFIXES) s = s.replace(prefix, '')
  }
  s = s
    .replace(/\b[A-Z0-9-]+\.(COM|NET|IO|CO|ORG)\b.*$/, '') // trailing web addresses
    .replace(/\bX{2,}\d{2,4}\b/g, '') // masked card numbers
    .replace(/\*+\d+/g, '')
    .replace(/#\s?\d+/g, '')
    .replace(/\b\d{2}\/\d{2}(\/\d{2,4})?\b/g, '')
    .replace(/\bREF\b.*$/, '')
    .replace(/\b(ID|CONF|TRACE)\b:?\s*\S+/g, '')
    .replace(/\b[A-Z]*\d[A-Z0-9]*\b/g, (token) => (/^\d{1,2}$/.test(token) ? token : '')) // ids and long numbers
    .replace(/\*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(\s(PAYMENTS?|PMT|PENDING|AUTOPAY|ONLINE|PURCHASE))+$/, '')
  if (!s) return titleCase(description.trim()).slice(0, 40)
  return titleCase(s).slice(0, 40)
}

/** True when a user rule applies to a transaction. */
export function ruleMatches(rule: CategoryRule, description: string, amount: number, merchant = normaliseMerchant(description)): boolean {
  const pattern = rule.pattern.trim().toLowerCase()
  if (!pattern) return false
  if (getCategory(rule.categoryId).kind === 'income' && amount < 0) return false
  return rule.match === 'exact'
    ? merchant.toLowerCase() === pattern
    : description.toLowerCase().includes(pattern) || merchant.toLowerCase().includes(pattern)
}

function signOf(amount: number): Sign {
  return amount >= 0 ? 'in' : 'out'
}

function signMatches(entrySign: Sign | undefined, amount: number) {
  return !entrySign || entrySign === signOf(amount)
}

/**
 * Rule-based categoriser. Layers, first match wins:
 * your rules → merchant dictionary → keyword patterns → `uncategorised`.
 */
export function categorize(description: string, amount: number, userRules: readonly CategoryRule[] = []): CategorizeResult {
  const merchant = normaliseMerchant(description)

  for (const rule of userRules) {
    if (ruleMatches(rule, description, amount, merchant)) {
      const category = getCategory(rule.categoryId)
      return {
        categoryId: rule.categoryId,
        confidence: rule.match === 'exact' ? 0.98 : 0.95,
        reason: `Your rule "${rule.pattern}" → ${category.label}`,
        merchant,
      }
    }
  }

  const known = findMerchant(description)
  if (known && signMatches(known.sign, amount)) {
    return {
      categoryId: known.category,
      confidence: 0.92,
      reason: `Matched "${known.match.toLowerCase()}" → ${getCategory(known.category).label}`,
      merchant,
    }
  }

  const text = clean(description)
  for (const entry of KEYWORDS) {
    if (!signMatches(entry.sign, amount)) continue
    if (entry.pattern.test(text)) {
      return {
        categoryId: entry.category,
        confidence: entry.confidence,
        reason: `Keyword "${entry.keyword}" → ${getCategory(entry.category).label}`,
        merchant,
      }
    }
  }

  return {
    categoryId: 'uncategorised',
    confidence: amount > 0 ? 0.2 : 0.15,
    reason: amount > 0 ? 'Unknown incoming payment' : 'No rule matched this merchant',
    merchant,
  }
}

export function needsReview(tx: { confidence: number; reviewed: boolean; categoryId: CategoryId }): boolean {
  return !tx.reviewed && (tx.categoryId === 'uncategorised' || tx.confidence < REVIEW_THRESHOLD)
}

/** Number of merchants in the built-in dictionary, for the "how it works" copy. */
export const MERCHANT_DICTIONARY_SIZE = new Set(MERCHANTS.map((m) => m.name)).size
export const KEYWORD_PATTERN_COUNT = KEYWORDS.length

export interface BuiltInMerchantRule {
  /** Token looked up in the cleaned bank text, lower-case. */
  match: string
  merchant: string
  categoryId: CategoryId
  /** Only applies to money in or money out, when set. */
  sign?: Sign
  confidence: number
  /** The `reason` a transaction gets when this rule sorts it. */
  reason: string
}

export interface BuiltInKeywordRule {
  keyword: string
  categoryId: CategoryId
  sign?: Sign
  confidence: number
  reason: string
}

/** Read-only view of the built-in rule layers, in the order they are tried. */
export function builtInRules(): { merchants: BuiltInMerchantRule[]; keywords: BuiltInKeywordRule[] } {
  return {
    merchants: MERCHANTS.map((m) => ({
      match: m.match.toLowerCase(),
      merchant: m.name,
      categoryId: m.category,
      sign: m.sign,
      confidence: 0.92,
      reason: `Matched "${m.match.toLowerCase()}" → ${getCategory(m.category).label}`,
    })),
    keywords: KEYWORDS.map((k) => ({
      keyword: k.keyword,
      categoryId: k.category,
      sign: k.sign,
      confidence: k.confidence,
      reason: `Keyword "${k.keyword}" → ${getCategory(k.category).label}`,
    })),
  }
}
