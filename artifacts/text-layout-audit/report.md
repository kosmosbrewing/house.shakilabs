# 텍스트 배치 개선 결과

## 결과
- 대상: House 22개 라우트, 브라우저 101개 상태.
- 최종 판정: page overflow, 값·단위/컨트롤 줄바꿈, 텍스트 overflow, 고아줄, 슬라이더 오류 모두 0건.
- `npm run typecheck` → `npm test` → `npm run build` 통과, 63개 테스트 통과.

## 적용 내용
- 양도세·취득세·재산세 등 결과 Grid와 Summary 행을 200%에서 한 열로 재배치했습니다.
- 필요경비율 눈금 `0%/15%`를 track과 같은 2열 Grid로 맞추고, `비과세` 배지는 전체 문구로 다음 행에 이동합니다.
- 헤더 안내와 소개 목록은 pretty/balance로 마지막 한 글자 고립을 제거했습니다.

## 관련 코드
- [responsive-accessibility.css](../../client/src/assets/css/responsive-accessibility.css)
- [CapitalGainsTaxCalculator.vue](../../client/src/components/house/CapitalGainsTaxCalculator.vue)
- [JeonseVsWolseResult.vue](../../client/src/components/house/JeonseVsWolseResult.vue)
- [PropertyTaxCalculator.vue](../../client/src/components/house/PropertyTaxCalculator.vue)
- [AboutView.vue](../../client/src/views/AboutView.vue)

근거: `../../../artifacts/text-layout-audit/computed-style-evidence.json`, `../../../artifacts/text-layout-audit/final-consolidated-summary.json`. 열린 이슈는 [issues.json](./issues.json)입니다.
