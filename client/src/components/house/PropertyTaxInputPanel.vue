<script setup lang="ts">
import { ShPresetGroup } from "@shakilabs/ui";
import { MARKET_PRICE_PRESETS } from "@/data/propertyTax";
import { parseNumericInput } from "@/lib/utils";
import {
  sanitizePropertyTaxAmount,
  type PropertyTaxInput,
} from "@/utils/propertyTaxCalculator";

const form = defineModel<PropertyTaxInput>({ required: true });
const marketPricePresetOptions = MARKET_PRICE_PRESETS.map((value) => ({
  label: `${Math.round(value / 100_000_000)}억`,
  value,
}));

type AmountField =
  | "marketPrice"
  | "officialPrice"
  | "previousYearOfficialPrice"
  | "previousYearPropertyTax"
  | "previousYearComprehensiveTax";

function setAmount(field: AmountField, value: string) {
  form.value = {
    ...form.value,
    [field]: sanitizePropertyTaxAmount(parseNumericInput(value)),
  };
}

function setPreset(price: number) {
  form.value = { ...form.value, marketPrice: price, officialPrice: 0 };
}
</script>

<template>
  <section class="retro-panel-muted space-y-4 p-4">
    <div class="grid gap-3 md:grid-cols-2">
      <div class="space-y-1.5">
        <label for="property-market-price" class="text-caption font-semibold text-foreground">
          시가 (공시가격 미입력 시 추정용)
        </label>
        <input
          id="property-market-price"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.marketPrice.toLocaleString('ko-KR')"
          @input="setAmount('marketPrice', ($event.target as HTMLInputElement).value)"
        />
        <ShPresetGroup
          :model-value="form.officialPrice ? -1 : form.marketPrice"
          :options="marketPricePresetOptions"
          label="시가 빠른 선택"
          @update:model-value="setPreset"
        />
      </div>

      <div class="space-y-1.5">
        <label for="property-official-price" class="text-caption font-semibold text-foreground">
          2026년 공시가격 (권장)
        </label>
        <input
          id="property-official-price"
          type="text"
          inputmode="numeric"
          class="retro-input"
          placeholder="공시가격알리미 금액"
          :value="(form.officialPrice ?? 0) || ''"
          @input="setAmount('officialPrice', ($event.target as HTMLInputElement).value)"
        />
        <p class="text-[11px] leading-relaxed text-muted-foreground">
          입력하면 시가 기반 현실화율 추정 대신 이 금액을 우선 사용합니다.
        </p>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">주택 유형</span>
        <select v-model="form.housingType" class="retro-input">
          <option value="apartment">아파트</option>
          <option value="detached">단독주택 (현재 미지원)</option>
        </select>
      </label>
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">소유자 나이</span>
        <input v-model.number="form.ownerAge" class="retro-input" min="20" max="100" step="1" type="number" />
      </label>
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">보유 기간 (년)</span>
        <input v-model.number="form.holdingYears" class="retro-input" min="0" max="50" step="1" type="number" />
      </label>
      <label class="retro-panel flex min-h-[44px] items-center gap-2 px-3 py-3">
        <input v-model="form.isUrbanArea" class="retro-checkbox" type="checkbox" />
        <span class="text-caption font-semibold">도시지역 (대부분의 아파트)</span>
      </label>
    </div>

    <label class="retro-panel flex min-h-[44px] items-center gap-2 px-3 py-3">
      <input v-model="form.isSingleOwnerOneHome" class="retro-checkbox" type="checkbox" />
      <span class="text-caption font-semibold">단독 명의 1세대 1주택임을 확인합니다</span>
    </label>

    <div class="grid gap-3 md:grid-cols-3">
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">2025년 공시가격 (선택)</span>
        <input
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="(form.previousYearOfficialPrice ?? 0) || ''"
          @input="setAmount('previousYearOfficialPrice', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">2025년 재산세 본세 (선택)</span>
        <input
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.previousYearPropertyTax || ''"
          @input="setAmount('previousYearPropertyTax', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">2025년 종부세 본세 (선택)</span>
        <input
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="(form.previousYearComprehensiveTax ?? 0) || ''"
          @input="setAmount('previousYearComprehensiveTax', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <p class="text-caption leading-relaxed text-muted-foreground">
      전년도 공시가격은 재산세 5% 과세표준상한에, 전년도 재산세·종부세 본세는 종부세 150% 세부담상한에 사용합니다.
    </p>
  </section>
</template>
