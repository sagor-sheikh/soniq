"use client";

import { useEffect, useRef } from "react";
import styles from "../Hero.module.css";

interface HeroVideoProps {
  src: string;
  className?: string;
  parallax?: string;
}

export function HeroVideo({
  src,
  className,
  parallax = "-60",
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Critical for Safari / iOS WebKit & Chrome autoplay compliance:
    // IDL DOM properties must be explicitly asserted in JS on mount
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const playVideo = () => {
      if (video.paused) {
        const promise = video.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // Autoplay policy prevented playback; will retry on first interaction
          });
        }
      }
    };

    playVideo();

    video.addEventListener("loadedmetadata", playVideo);
    video.addEventListener("canplay", playVideo);

    // Fallback: If browser autoplay policy blocked play on load,
    // immediately trigger on the first user interaction anywhere
    const onUserInteraction = () => {
      playVideo();
      window.removeEventListener("pointerdown", onUserInteraction);
      window.removeEventListener("touchstart", onUserInteraction);
      window.removeEventListener("scroll", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
    };

    window.addEventListener("pointerdown", onUserInteraction, {
      passive: true,
      once: true,
    });
    window.addEventListener("touchstart", onUserInteraction, {
      passive: true,
      once: true,
    });
    window.addEventListener("scroll", onUserInteraction, {
      passive: true,
      once: true,
    });
    window.addEventListener("keydown", onUserInteraction, {
      passive: true,
      once: true,
    });

    const onVisibilityChange = () => {
      if (!document.hidden) {
        playVideo();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      video.removeEventListener("loadedmetadata", playVideo);
      video.removeEventListener("canplay", playVideo);
      window.removeEventListener("pointerdown", onUserInteraction);
      window.removeEventListener("touchstart", onUserInteraction);
      window.removeEventListener("scroll", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className || styles.backgroundImage}
      data-parallax={parallax}
      data-bg-video
      src={src}
      data-src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      style={{ zIndex: 1 }}
      onCanPlay={(e) => {
        const v = e.currentTarget;
        v.muted = true;
        if (v.paused) void v.play().catch(() => {});
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
