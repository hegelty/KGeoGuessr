import { loadKakaoSdk } from "@/lib/kakao/loadKakaoSdk";

const DEFAULT_TEMPLATE_ID = Number(process.env.NEXT_PUBLIC_KAKAO_SHARE_TEMPLATE_ID ?? "130913");

type BaseSharePayload = {
  sharePath: string;
  shareUrl: string;
};

type MapSharePayload = BaseSharePayload & {
  title: string;
  contents: string;
};

type ResultSharePayload = BaseSharePayload & {
  title: string;
  contents: string;
};

function getTemplateArgs({
  title,
  contents,
  sharePath,
}: {
  title: string;
  contents: string;
  sharePath: string;
}) {
  return {
    TITLE: title,
    CONTENTS: contents,
    SHAREID: sharePath,
  };
}

function buildTextTemplate({
  title,
  contents,
  shareUrl,
}: {
  title: string;
  contents: string;
  shareUrl: string;
}) {
  return {
    objectType: "text" as const,
    text: `${title}\n${contents}`,
    link: {
      mobileWebUrl: shareUrl,
      webUrl: shareUrl,
    },
  };
}

async function sendCustomOrFallback(
  customPayload: {
    templateId: number;
    templateArgs: Record<string, string>;
  },
  fallbackPayload: ReturnType<typeof buildTextTemplate>,
) {
  const Kakao = await loadKakaoSdk();

  if (!Kakao.Share?.sendDefault) {
    throw new Error("카카오톡 공유 기능을 사용할 수 없습니다.");
  }

  try {
    if (Number.isFinite(customPayload.templateId) && Kakao.Share?.sendCustom) {
      Kakao.Share.sendCustom(customPayload);
      return;
    }
  } catch {
    // Fall back to the default template when the custom template is unavailable.
  }

  Kakao.Share.sendDefault(fallbackPayload);
}

export async function shareMapToKakaoTalk(payload: MapSharePayload) {
  const fallbackPayload = buildTextTemplate(payload);

  await sendCustomOrFallback(
    {
      templateId: DEFAULT_TEMPLATE_ID,
      templateArgs: getTemplateArgs(payload),
    },
    fallbackPayload,
  );
}

export async function shareResultToKakaoTalk(payload: ResultSharePayload) {
  const fallbackPayload = buildTextTemplate(payload);

  await sendCustomOrFallback(
    {
      templateId: DEFAULT_TEMPLATE_ID,
      templateArgs: getTemplateArgs(payload),
    },
    fallbackPayload,
  );
}
