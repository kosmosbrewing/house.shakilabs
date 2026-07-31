<script setup lang="ts">
import { ShSurface, ShText } from "@shakilabs/ui";
import { useRouteSessionDraft } from "@/composables/useRouteSessionDraft";

const draft = useRouteSessionDraft({
  storageKey: "house:property-tax-session-draft:v1",
  routePath: "/property-tax",
  appId: "house",
  toolId: "property_tax",
});
</script>

<template>
  <!-- 저장된 입력이 있거나 기억이 켜진 사용자에게만 카드로 보여준다.
       처음 온 사용자에게는 첫 화면을 차지하는 카드가 답으로 가는 길만 막았다.
       기능은 한 줄 링크로 남겨 발견 가능성을 지킨다. -->
  <ShSurface
    v-if="draft.loaded.value && (draft.hasRestorableDraft.value || draft.tracking.value)"
    variant="outlined"
    padding="sm"
    class="flex flex-wrap items-center justify-between gap-3"
  >
    <div>
      <ShText as="h2" variant="heading">이 탭에서 보유세 입력 이어보기</ShText>
      <ShText variant="caption" tone="muted" class="mt-1">
        서버로 보내지 않고 이 탭에만 최대 8시간 기억합니다.
      </ShText>
    </div>
    <button v-if="draft.hasRestorableDraft.value" type="button" class="retro-button" @click="draft.restore">
      저장 입력 불러오기
    </button>
    <button v-else type="button" class="retro-button" @click="draft.clear">
      입력 기억 끄기
    </button>
  </ShSurface>

  <p v-else-if="draft.loaded.value" class="text-right">
    <button
      type="button"
      class="text-tiny text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
      @click="draft.enable"
    >
      이 탭에 입력 기억하기
    </button>
  </p>
</template>
