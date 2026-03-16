import { computed, ref, toValue, type MaybeRefOrGetter } from "vue";
import { showAlert } from "./useAlert";
import { buildAbsoluteUrl, copyToClipboard } from "@/lib/routeState";
import { trackEvent } from "@/lib/analytics";
import { ensureKakaoSdk } from "@/lib/kakaoSdk";

type QueryPrimitive = string | number | boolean | null | undefined;

interface ShareOptions {
  title: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
  summaryText?: MaybeRefOrGetter<string>;
  path?: MaybeRefOrGetter<string>;
  query?: MaybeRefOrGetter<Record<string, QueryPrimitive> | undefined>;
  buttonLabel?: MaybeRefOrGetter<string>;
}

export function useResultShare(options: ShareOptions) {
  const showShareModal = ref(false);
  const kakaoBusy = ref(false);

  const shareSummary = computed(() => toValue(options.summaryText) || toValue(options.title));

  function resolvePath(): string {
    return toValue(options.path) || window.location.pathname || "/";
  }

  function resolveQuery(): Record<string, QueryPrimitive> | undefined {
    return toValue(options.query);
  }

  function resolveUrl(): string {
    return buildAbsoluteUrl(resolvePath(), resolveQuery());
  }

  function openShare(): void {
    trackEvent("ux_share_modal_open", { page: resolvePath() });
    showShareModal.value = true;
  }

  function closeShare(): void {
    showShareModal.value = false;
  }

  async function copyLink(): Promise<void> {
    const copied = await copyToClipboard(resolveUrl());

    if (!copied) {
      trackEvent("ux_share_link_copy_fail", { page: resolvePath() });
      showAlert("링크 복사에 실패했습니다", { type: "error" });
      return;
    }

    trackEvent("ux_share_link_copy_success", { page: resolvePath() });
    showAlert("링크가 복사되었습니다");
  }

  async function shareKakao(): Promise<void> {
    if (kakaoBusy.value) return;
    kakaoBusy.value = true;

    try {
      await ensureKakaoSdk();
      if (!window.Kakao?.Share) throw new Error("Kakao Share not available");

      const url = resolveUrl();
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: toValue(options.title),
          description: toValue(options.description),
          imageUrl: `${window.location.origin}/favicon.png`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          {
            title: toValue(options.buttonLabel) || "계산 결과 보기",
            link: { mobileWebUrl: url, webUrl: url },
          },
        ],
      });
      trackEvent("ux_share_kakao_success", { page: resolvePath() });
    } catch {
      trackEvent("ux_share_kakao_fail", { page: resolvePath() });
      showAlert("카카오톡 공유에 실패했습니다", { type: "error" });
    } finally {
      kakaoBusy.value = false;
    }
  }

  return {
    showShareModal,
    kakaoBusy,
    shareSummary,
    openShare,
    closeShare,
    shareKakao,
    copyLink,
  };
}
