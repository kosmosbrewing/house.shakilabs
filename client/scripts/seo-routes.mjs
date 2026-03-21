// 파라미터 단위: 만 원 (URL 파라미터 × 10,000 = 원화)
export const BROKERAGE_PRICES = [10000, 30000, 50000, 70000, 100000];
export const JEONSE_DEPOSITS = [10000, 20000, 30000, 50000];
export const DELAY_DEPOSITS = [5000, 10000, 20000, 30000];
export const PROPERTY_TAX_PRICES = [30000, 50000, 100000, 150000, 200000];
export const CAPITAL_GAINS_SELL_PRICES = [50000, 80000, 120000, 200000];
export const ACQUISITION_PRICES = [30000, 60000, 90000, 120000, 150000];
export const RENTAL_YIELD_PRICES = [30000, 50000, 70000, 100000, 150000];
export const JEONSE_WOLSE_RATE_DEPOSITS = [10000, 20000, 30000, 50000];

export const SEO_ROUTES = [
  "/",
  "/delay-interest",
  "/jeonse-vs-wolse",
  "/jeonse-wolse-rate",
  "/brokerage-fee",
  "/first-home",
  "/housing-subscription",
  "/property-tax",
  "/capital-gains-tax",
  "/acquisition-tax",
  "/rental-yield",
  "/about",
  "/terms",
  "/privacy",
  ...BROKERAGE_PRICES.map((p) => `/brokerage-fee/${p}`),
  ...JEONSE_DEPOSITS.map((d) => `/jeonse-vs-wolse/${d}`),
  ...JEONSE_WOLSE_RATE_DEPOSITS.map((d) => `/jeonse-wolse-rate/${d}`),
  ...DELAY_DEPOSITS.map((d) => `/delay-interest/${d}`),
  ...PROPERTY_TAX_PRICES.map((p) => `/property-tax/${p}`),
  ...CAPITAL_GAINS_SELL_PRICES.map((p) => `/capital-gains-tax/${p}`),
  ...ACQUISITION_PRICES.map((p) => `/acquisition-tax/${p}`),
  ...RENTAL_YIELD_PRICES.map((p) => `/rental-yield/${p}`),
];
