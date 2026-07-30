# 부동산 계산기 · shakilabs

**▶ 라이브 서비스: <https://shakilabs.com/house>**

보증금 반환 지연이자, 재산세·보유세, 깡통전세 위험 진단 등 부동산 거래·보유에 필요한 계산기 모음.

## 주요 도구

- [보증금 반환 지연이자](https://shakilabs.com/house/delay-interest)
- [재산세·보유세](https://shakilabs.com/house/property-tax)
- [깡통전세 위험 진단](https://shakilabs.com/house/jeonse-risk)
- [전월세 전환율](https://shakilabs.com/house/jeonse-wolse-rate)
- [중개보수](https://shakilabs.com/house/brokerage-fee)
- [양도소득세](https://shakilabs.com/house/capital-gains-tax)

전체 서비스 12종: <https://shakilabs.com>

## 스택

Vue 3 (Composition API) · TypeScript · Vite · Tailwind CSS · 공유 UI `@shakilabs/ui`
정적 프리렌더/SSG로 배포하며, 계산 로직은 Vitest 경계값 테스트로 검증합니다.

## 개발

```bash
cd client
npm install
npm run dev
```
