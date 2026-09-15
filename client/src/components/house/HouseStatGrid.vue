<script setup lang="ts">
import { computed, type Component } from "vue";
import { Card, CardContent } from "@/components/ui/card";
import ResultHero from "@/components/common/ResultHero.vue";

const props = withDefaults(
  defineProps<{
    items: readonly {
      label: string;
      value: string;
      cls?: string;
    }[];
    icons: readonly Component[];
    iconClasses: readonly string[];
    /**
     * 대표 수치의 인덱스(BL-020). 지정하면 그 항목만 히어로로 올라가고 나머지가
     * 그리드에 남는다 — 계산기마다 대표값 위치가 다르다(취득세 0, 중개보수 2, 청약 3).
     * 생략하면 기존처럼 4개를 같은 크기로 늘어놓는다.
     */
    heroIndex?: number;
  }>(),
  { heroIndex: undefined }
);

const heroItem = computed(() =>
  props.heroIndex === undefined ? undefined : props.items[props.heroIndex]
);

// 히어로로 올라간 항목은 그리드에서 뺀다 — 같은 숫자를 두 번 보여주지 않는다
const gridEntries = computed(() =>
  props.items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => index !== props.heroIndex)
);
</script>

<template>
  <div class="space-y-3">
    <Card v-if="heroItem" class="house-stat-hero border-border/50 bg-card">
      <CardContent class="px-4 py-2">
        <ResultHero
          :label="heroItem.label"
          :value="heroItem.value"
          :value-class="heroItem.cls || 'text-primary'"
        />
      </CardContent>
    </Card>

    <div
      class="house-stat-grid grid grid-cols-1 gap-2 sm:grid-cols-2"
      :class="heroItem ? 'lg:grid-cols-3' : 'lg:grid-cols-4'"
    >
      <Card
        v-for="{ item, index } in gridEntries"
        :key="item.label"
        class="house-stat-card border-border/50 bg-muted/30"
      >
        <CardContent class="house-stat-card-content">
          <div class="house-stat-heading">
            <span class="house-stat-icon" :class="props.iconClasses[index]">
              <component
                :is="props.icons[index]"
                aria-hidden="true"
                class="h-3.5 w-3.5"
              />
            </span>
            <p class="house-stat-label">{{ item.label }}</p>
          </div>
          <p class="house-stat-value" :class="item.cls">{{ item.value }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
