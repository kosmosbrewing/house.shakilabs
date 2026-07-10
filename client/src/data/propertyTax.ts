// 재산세·종부세 상수 (2026년 기준, 1세대 1주택자 전용)

export const PROPERTY_TAX_UPDATED = "2026-07-10";

// ── 현실화율 (공시가격 / 시가) ──
export const REALIZATION_RATES = {
  apartment: 0.69,
  detached: 0.536,
} as const;

// ── 재산세 공정시장가액비율 (1세대 1주택, 2024년 고시 유지) ──
export const PROPERTY_FAIR_MARKET_RATIOS = [
  { max: 300_000_000, rate: 0.43, label: "공시가 3억 이하" },
  { max: 600_000_000, rate: 0.44, label: "공시가 3억 초과~6억 이하" },
  { max: null, rate: 0.45, label: "공시가 6억 초과" },
] as const;

// ── 재산세 일반세율 ──
export interface PropertyTaxTier {
  min: number;
  max: number | null;
  rate: number;
  deduction: number; // 누진공제
  label: string;
}

export const PROPERTY_TAX_STANDARD_TIERS: PropertyTaxTier[] = [
  { min: 0, max: 60_000_000, rate: 0.001, deduction: 0, label: "6천만원 이하" },
  { min: 60_000_000, max: 150_000_000, rate: 0.0015, deduction: 30_000, label: "6천만~1.5억" },
  { min: 150_000_000, max: 300_000_000, rate: 0.0025, deduction: 180_000, label: "1.5억~3억" },
  { min: 300_000_000, max: null, rate: 0.004, deduction: 630_000, label: "3억 초과" },
];

// ── 재산세 1주택 특례세율 (공시가 9억 이하) ──
export const PROPERTY_TAX_SPECIAL_TIERS: PropertyTaxTier[] = [
  { min: 0, max: 60_000_000, rate: 0.0005, deduction: 0, label: "6천만원 이하" },
  { min: 60_000_000, max: 150_000_000, rate: 0.001, deduction: 30_000, label: "6천만~1.5억" },
  { min: 150_000_000, max: 300_000_000, rate: 0.002, deduction: 180_000, label: "1.5억~3억" },
  { min: 300_000_000, max: null, rate: 0.0035, deduction: 630_000, label: "3억 초과" },
];

// 1주택 특례세율 적용 기준: 공시가격 9억원 이하
export const SPECIAL_RATE_THRESHOLD = 900_000_000;

// 주택 재산세는 세부담상한 대신 직전 연도 과세표준을 이용한 5% 과표상한을 적용한다.
export const PROPERTY_TAX_BASE_CAP_RATE = 0.05;

// ── 종합부동산세 (1세대 1주택, 2주택 이하 일반) ──
export const COMP_TAX_DEDUCTION = 1_200_000_000; // 기본공제 12억

export const COMP_TAX_FAIR_MARKET_RATIO = 0.6; // 공정시장가액비율 60%
export const COMP_TAX_BURDEN_CAP_RATE = 1.5; // 전년도 재산세+종부세의 150%

export interface CompTaxTier {
  min: number;
  max: number | null;
  rate: number;
  deduction: number; // 누진공제
  label: string;
}

export const COMP_TAX_TIERS: CompTaxTier[] = [
  { min: 0, max: 300_000_000, rate: 0.005, deduction: 0, label: "3억 이하" },
  { min: 300_000_000, max: 600_000_000, rate: 0.007, deduction: 600_000, label: "3억~6억" },
  { min: 600_000_000, max: 1_200_000_000, rate: 0.01, deduction: 2_400_000, label: "6억~12억" },
  { min: 1_200_000_000, max: 2_500_000_000, rate: 0.013, deduction: 6_000_000, label: "12억~25억" },
  { min: 2_500_000_000, max: 5_000_000_000, rate: 0.015, deduction: 11_000_000, label: "25억~50억" },
  { min: 5_000_000_000, max: 9_400_000_000, rate: 0.02, deduction: 36_000_000, label: "50억~94억" },
  { min: 9_400_000_000, max: null, rate: 0.027, deduction: 101_800_000, label: "94억 초과" },
];

// ── 세액공제 ──

// 고령자 공제율
export const ELDERLY_DEDUCTION_TIERS = [
  { minAge: 70, rate: 0.4, label: "70세 이상" },
  { minAge: 65, rate: 0.3, label: "65~69세" },
  { minAge: 60, rate: 0.2, label: "60~64세" },
] as const;

// 장기보유 공제율
export const LONG_HOLD_DEDUCTION_TIERS = [
  { minYears: 15, rate: 0.5, label: "15년 이상" },
  { minYears: 10, rate: 0.4, label: "10~14년" },
  { minYears: 5, rate: 0.2, label: "5~9년" },
] as const;

// 합산 최대 공제율
export const MAX_COMBINED_DEDUCTION = 0.8;

// ── 부가세 ──
export const URBAN_AREA_TAX_RATE = 0.0014; // 도시지역분: 과세표준 × 0.14%
export const LOCAL_EDUCATION_TAX_RATE = 0.2; // 재산세 본세 × 20%
export const RURAL_SPECIAL_TAX_RATE = 0.2; // 종부세 × 20%

// ── 시가 프리셋 ──
export const MARKET_PRICE_PRESETS = [
  500_000_000,
  1_000_000_000,
  1_500_000_000,
  2_000_000_000,
  3_000_000_000,
] as const;

// ── 출처 ──
export const PROPERTY_TAX_SOURCES = [
  {
    name: "지방세법 제111조의2",
    url: "https://www.law.go.kr/lsSideInfoP.do?docCls=jo&joBrNo=02&joNo=0111&lsiSeq=282559",
    basis: "2026년 1세대 1주택 9억원 이하 특례세율",
  },
  {
    name: "지방세법 시행령 제109조",
    url: "https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0109&lsiSeq=286395",
    basis: "2026년 1세대 1주택 공정시장가액비율 43%·44%·45%",
  },
  {
    name: "지방세법 제110조·지방세법 시행령 제109조의2",
    url: "https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1026501427",
    basis: "직전 연도 공시가격 상당액과 5% 과세표준상한 계산",
  },
  {
    name: "종합부동산세법 제9조",
    url: "https://www.law.go.kr/법령/종합부동산세법",
    basis: "종부세 세율, 기본공제, 공제할 재산세액과 세액공제",
  },
  {
    name: "국세청 종합부동산세 계산 안내",
    url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7739&mi=40401",
    basis: "공제할 재산세액 계산과 전년도 총세액의 150% 세부담상한",
  },
  {
    name: "부동산공시가격알리미 2026 공동주택가격",
    url: "https://realtyprice.kr/notice/town/objectionGuide.htm",
    basis: "2026년 개별 공동주택 공시가격 확인",
  },
] as const;

// ── FAQ ──
export const PROPERTY_TAX_FAQS = [
  {
    q: "시가와 공시가격은 어떤 관계인가요?",
    a: "2026년 공시가격을 직접 입력하면 그 금액을 우선 사용합니다. 비워 두면 시세에 전국 현실화율 가정을 적용하지만 지역·주택별 차이가 있으므로 공시가격알리미의 개별 금액을 사용하는 편이 정확합니다.",
  },
  {
    q: "1세대 1주택 특례세율은 누구에게 적용되나요?",
    a: "세대원 전원이 주택 1채만 소유한 경우, 공시가격 9억원 이하 주택에 대해 일반세율보다 낮은 특례세율이 적용됩니다.",
  },
  {
    q: "종부세는 언제부터 내나요?",
    a: "1세대 1주택자는 공시가격에서 12억원을 차감한 금액이 과세표준이 됩니다. 공시가격이 12억원 이하면 종부세 대상이 아닙니다.",
  },
  {
    q: "고령자·장기보유 공제는 중복 적용되나요?",
    a: "네. 고령자 공제(최대 40%)와 장기보유 공제(최대 50%)는 합산 적용되지만, 합산 공제율 상한은 80%입니다.",
  },
  {
    q: "도시지역분은 항상 부과되나요?",
    a: "도시지역(「국토의 계획 및 이용에 관한 법률」상 도시지역)에 소재한 주택에만 과세표준의 0.14%가 추가됩니다. 대부분의 아파트는 도시지역에 해당합니다.",
  },
  {
    q: "공동명의나 다주택도 계산할 수 있나요?",
    a: "아니요. 현재 계산은 아파트를 단독 명의로 보유한 1세대 1주택만 지원합니다. 단독주택, 공동명의 특례, 다주택, 법인, 상속주택·지방 저가주택 등은 지원하지 않습니다.",
  },
  {
    q: "전년도 공시가격과 세액을 모르면 어떻게 하나요?",
    a: "전년도 공시가격이 없으면 재산세 과세표준상한을, 전년도 재산세·종부세 본세가 없으면 종부세 150% 세부담상한을 적용하지 않습니다. 이전 고지서와 공시가격알리미에서 확인해야 실제 고지액에 가까워집니다.",
  },
] as const;
