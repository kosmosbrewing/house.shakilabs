<script setup lang="ts">
// 제목 오른쪽 아래로 떨어져 있던 밑줄 링크(`이 탭에 입력 기억하기` <button>)를
// 패키지 ShMemoryControl(role=switch + aria-checked)로 바꿔 제목과 한 그룹에 둔다.
// loan DsrMemoryControl·finance CalculatorMemoryControl과 같은 패턴이다(새 패턴을 만들지 않는다).
// 저장소·TTL·키 규약은 패키지가 소유한다: sessionStorage, 8시간, shaki:draft:house:property-tax:v1.
// 앱은 "무엇을 저장/복원할지"(= 입력이 쿼리로 실린 계산기 주소 한 줄)만 정한다.
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ShMemoryControl } from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";
import { ageBucket, parseMemoryDraft } from "@/lib/memoryDraft";

const props = defineProps<{
  /** 계산기의 공유 쿼리(기본값과 다른 입력만 담긴다). 기본 경로에 붙이면 같은 입력이 그대로 열린다. */
  query: Record<string, string>;
}>();

// 규약(shaki:draft:<category>:<tool>:v1) 이전 키. 새 컨트롤은 읽지 않고, 남은 초안은 한 번 지운다.
const LEGACY_STORAGE_KEY = "house:property-tax-session-draft:v1";
const ROUTE_PATH = "/property-tax";

type MemoryControlExposed = {
  save: (payload: unknown) => void;
  clear: () => void;
};

const control = ref<MemoryControlExposed | null>(null);
const route = useRoute();
const router = useRouter();
const tracking = ref(false);

// setup 시점 = 들어온 주소. 맨 경로로 들어왔을 때만 복원한다 — 링크·공유 URL·금액 프리셋
// 경로로 들어온 값을 저장본이 덮어쓰면 사용자가 방금 연 화면이 사라진다.
const enteredBare = route.fullPath === ROUTE_PATH;

// 저장본은 늘 기본 경로 + 입력 쿼리다. 금액 프리셋(/property-tax/:price)에서 켜도 같은 입력을
// 기본 경로로 되살린다 — 프리셋 경로로 복원하면 같은 뷰 인스턴스가 재사용돼 프리셋 금액이 빠진다.
function snapshotPath(): string {
  return router.resolve({ path: ROUTE_PATH, query: props.query }).fullPath;
}

function saveCurrent(): void {
  control.value?.save({ path: snapshotPath(), savedAt: Date.now() });
}

function handleEnable(): void {
  tracking.value = true;
  saveCurrent();
}

function handleDisable(): void {
  tracking.value = false;
}

async function handleRestore(payload: unknown): Promise<void> {
  tracking.value = true;
  const draft = parseMemoryDraft(payload, ROUTE_PATH);
  // 스키마 밖이거나 다른 도구의 경로면 되살리지 않고 버린다
  if (!draft) {
    control.value?.clear();
    tracking.value = false;
    return;
  }
  if (!enteredBare) return;
  trackEvent("recent_result_open", {
    app_id: "house",
    tool_id: "property_tax",
    age_bucket: ageBucket(draft.savedAt),
  });
  await router.replace(draft.path);
}

onMounted(() => {
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // 저장소 차단 브라우저 — 지울 것도 없다
  }
});

// 켜져 있는 동안 입력(=공유 쿼리)이 바뀔 때마다 최신 주소로 갱신한다
watch(
  () => props.query,
  () => {
    if (tracking.value) saveCurrent();
  },
  { flush: "post" },
);
</script>

<template>
  <ShMemoryControl
    ref="control"
    category="house"
    tool="property-tax"
    @enable="handleEnable"
    @disable="handleDisable"
    @restore="handleRestore"
  />
</template>
