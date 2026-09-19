<script setup lang="ts">
/**
 * SEO 리치 가이드 섹션 컴포넌트
 * 각 계산기 뷰 하단에 도메인 가이드 + FAQ + 체크리스트를 출력하여
 * vite-ssg SSR 시 HTML에 실제 텍스트가 반영되도록 한다. (07.biz 패턴 이식)
 *
 * 읽는 줄 길이 캡(65ch)은 <section>이 아니라 안쪽 p·li에 건다.
 * 카드째 좁히면 폭을 채운 계산기 카드(1152px) 아래에 650px짜리 산문 카드가 놓여
 * 우변이 어긋난다 — 줄이 길어서 생기는 문제를 카드 폭으로 푼 것이 원인이었다.
 */
export interface GuideSection {
  h2: string;
  body: string;
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideChecklist {
  title: string;
  items: string[];
}

export interface GuideSource {
  label: string;
  url: string;
}

defineProps<{
  title: string;
  intro: string;
  sections?: GuideSection[];
  faqs?: GuideFaq[];
  checklist?: GuideChecklist;
  sources?: GuideSource[];
  disclaimer?: string;
}>();
</script>

<template>
  <section class="seo-rich-guide retro-panel overflow-hidden">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 class="retro-title">{{ title }}</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <p class="max-w-[65ch] text-caption leading-relaxed text-muted-foreground">{{ intro }}</p>

      <div v-if="sections && sections.length > 0" class="space-y-4">
        <article
          v-for="(s, i) in sections"
          :key="`sec-${i}`"
          class="space-y-2"
        >
          <h3 class="text-body font-semibold text-foreground">{{ s.h2 }}</h3>
          <p class="max-w-[65ch] text-caption leading-relaxed text-muted-foreground">{{ s.body }}</p>
        </article>
      </div>

      <div v-if="checklist && checklist.items.length > 0" class="space-y-2">
        <h3 class="text-body font-semibold text-foreground">{{ checklist.title }}</h3>
        <ul class="ml-4 max-w-[65ch] list-disc space-y-1 text-caption text-muted-foreground">
          <li v-for="(item, i) in checklist.items" :key="`chk-${i}`">
            {{ item }}
          </li>
        </ul>
      </div>

      <div v-if="faqs && faqs.length > 0" class="space-y-3">
        <h3 class="text-body font-semibold text-foreground">자주 묻는 질문 (FAQ)</h3>
        <div
          v-for="(faq, i) in faqs"
          :key="`faq-${i}`"
          class="space-y-1"
        >
          <p class="max-w-[65ch] text-caption font-semibold text-foreground">Q. {{ faq.q }}</p>
          <p class="max-w-[65ch] text-caption leading-relaxed text-muted-foreground">A. {{ faq.a }}</p>
        </div>
      </div>

      <div v-if="sources && sources.length > 0" class="space-y-2">
        <h3 class="text-body font-semibold text-foreground">공식 출처</h3>
        <ul class="ml-4 max-w-[65ch] list-disc space-y-1 text-caption text-muted-foreground">
          <li v-for="(src, i) in sources" :key="`src-${i}`">
            <a
              :href="src.url"
              target="_blank"
              rel="noopener noreferrer"
              class="retro-link"
            >{{ src.label }}</a>
          </li>
        </ul>
      </div>

      <p
        v-if="disclaimer"
        class="max-w-[65ch] border-t border-border/40 pt-3 text-xs text-muted-foreground"
      >
        {{ disclaimer }}
      </p>
    </div>
  </section>
</template>
