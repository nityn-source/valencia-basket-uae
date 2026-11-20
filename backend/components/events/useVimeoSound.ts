"use client";

import { useState, type RefObject } from "react";

/**
 * Sound control for a Vimeo player in an iframe, through Vimeo's message interface. Unmuting also asks the
 * player to play, in case the browser paused it. Returns false when there is no player to talk to yet.
 */
export function useVimeoSound(frameRef: RefObject<HTMLIFrameElement | null>) {
  const [soundOn, setSoundOn] = useState(false);

  const setSound = (on: boolean) => {
    const player = frameRef.current?.contentWindow;
    if (!player) return false;
    const send = (method: string, value?: boolean | number) => player.postMessage(JSON.stringify({ method, value }), "https://player.vimeo.com");
    send("setMuted", !on);
    if (on) {
      send("setVolume", 1);
      send("play");
    }
    setSoundOn(on);
    return true;
  };

  return { soundOn, setSound, resetSound: () => setSoundOn(false) };
}
