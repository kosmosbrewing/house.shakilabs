<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { Link } from "lucide-vue-next";

const props = defineProps<{
  show: boolean;
  kakaoBusy: boolean;
  summaryText: string;
}>();

const emit = defineEmits<{
  close: [];
  shareKakao: [];
  copyLink: [];
}>();

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === "Escape" && props.show) {
    emit("close");
  }
}

const isBrowser = typeof window !== "undefined";

watch(
  () => props.show,
  (show) => {
    if (!isBrowser) return;

    if (show) {
      window.addEventListener("keydown", handleEscapeKey);
      return;
    }

    window.removeEventListener("keydown", handleEscapeKey);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (!isBrowser) return;
  window.removeEventListener("keydown", handleEscapeKey);
});

function handleAction(action: "kakao" | "link"): void {
  emit("close");
  if (action === "kakao") emit("shareKakao");
  else emit("copyLink");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="props.show"
        class="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />
        <div class="relative z-10 mx-4 w-full max-w-sm max-h-[85vh] overflow-y-auto translate-y-[5vh] retro-panel border border-border sm:translate-y-0">
          <div class="retro-titlebar">
            <h3 id="share-modal-title" class="retro-title text-[1rem]!">공유하기</h3>
            <button class="retro-kbd text-xs" aria-label="공유 모달 닫기" @click="emit('close')">ESC</button>
          </div>

          <div class="space-y-3 p-4">
            <div
              v-if="props.summaryText"
              class="retro-panel-muted border border-border/40 px-3 py-2"
            >
              <p class="text-caption text-muted-foreground">현재 계산 조건</p>
              <p class="mt-1 break-words text-caption font-semibold">{{ props.summaryText }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                class="flex flex-col items-center gap-2 retro-panel-muted border border-border/40 p-3 transition-colors hover:border-yellow-400/60 disabled:opacity-50"
                :disabled="props.kakaoBusy"
                aria-label="카카오톡 공유"
                @click="handleAction('kakao')"
              >
                <img
                  src="/images/icons/kakaotalk-sharing-medium.png?v=1"
                  alt=""
                  aria-hidden="true"
                  class="h-6 w-6 object-contain"
                />
                <span class="text-center text-[0.6875rem] font-bold leading-tight whitespace-nowrap sm:text-[0.72rem]">카카오톡 공유</span>
              </button>

              <button
                class="flex flex-col items-center gap-2 retro-panel-muted border border-border/40 p-3 transition-colors hover:border-border/80"
                aria-label="공유 링크 복사"
                @click="handleAction('link')"
              >
                <Link class="h-6 w-6 text-muted-foreground" />
                <span class="text-center text-[0.6875rem] font-bold leading-tight whitespace-nowrap sm:text-[0.72rem]">링크 복사</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
