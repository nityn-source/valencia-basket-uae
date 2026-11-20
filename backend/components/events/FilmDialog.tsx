"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { vimeoPlayerSrc, type VimeoVideo } from "@/lib/vimeo";

/** The full-size, sound-on Vimeo player in a pop-up. The film stops when it closes. */
export function FilmDialog({
  open,
  onOpenChange,
  video,
  title,
  ratio,
  onCloseFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: VimeoVideo;
  title: string;
  ratio: string;
  onCloseFocus?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-auto max-w-none gap-0 border-0 bg-black p-0 shadow-none sm:max-w-none [&>button]:right-2 [&>button]:top-2 [&>button]:z-20 [&>button]:bg-black/60 [&>button]:p-2 [&>button]:text-white [&>button]:opacity-100"
        style={{ height: "min(90vh, 820px)", aspectRatio: ratio, maxWidth: "94vw" }}
        // Keep focus on the pop-up, not inside Vimeo's player: a key press inside the player never reaches this page, so Escape would not close it.
        onOpenAutoFocus={(event) => { event.preventDefault(); (event.currentTarget as HTMLElement | null)?.focus(); }}
        onCloseAutoFocus={(event) => { event.preventDefault(); window.setTimeout(() => onCloseFocus?.(), 0); }}
        tabIndex={-1}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">The camp film. Press Escape to close it.</DialogDescription>
        <iframe
          src={vimeoPlayerSrc(video, "sound")}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full border-0"
        />
      </DialogContent>
    </Dialog>
  );
}
