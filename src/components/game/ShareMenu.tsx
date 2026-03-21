"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ShareAction } from "@/types/game";

type Props = {
  sharing: boolean;
  shareAction: ShareAction;
  kakaoAction: Exclude<ShareAction, "copy-link" | null>;
  kakaoLabel: string;
  onCopyLink: () => void;
  onKakaoShare: () => void;
  buttonClassName?: string;
  menuAlign?: "left" | "right";
  block?: boolean;
  disabled?: boolean;
};

export function ShareMenu({
  sharing,
  shareAction,
  kakaoAction,
  kakaoLabel,
  onCopyLink,
  onKakaoShare,
  buttonClassName,
  menuAlign = "right",
  block = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (sharing) {
      setOpen(false);
    }
  }, [sharing]);

  function handleCopyLink() {
    setOpen(false);
    onCopyLink();
  }

  function handleKakaoShare() {
    setOpen(false);
    onKakaoShare();
  }

  return (
    <div
      ref={rootRef}
      className={[
        "share-menu",
        open ? "is-open" : "",
        block ? "is-block" : "",
        menuAlign === "left" ? "align-left" : "align-right",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Button
        className={buttonClassName}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled || sharing}
      >
        {sharing ? "공유 중..." : "공유"}
      </Button>

      {open ? (
        <div className="glass-panel share-menu-popover" role="menu">
          <button className="share-menu-item" onClick={handleKakaoShare} disabled={sharing}>
            {shareAction === kakaoAction ? "카카오톡 여는 중..." : kakaoLabel}
          </button>
          <button className="share-menu-item" onClick={handleCopyLink} disabled={sharing}>
            {shareAction === "copy-link" ? "링크 복사 중..." : "링크 복사"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
