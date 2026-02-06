"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLAYER_ELEMENT_ID = "login-tutorial-player";

interface YouTubePlayer {
  destroy: () => void;
}

interface YouTubePlayerStateEvent {
  data: number;
}

interface YouTubeWindow extends Window {
  YT?: {
    Player: new (
      elementId: string,
      options: {
        videoId: string;
        playerVars?: Record<string, number>;
        events?: {
          onStateChange?: (event: YouTubePlayerStateEvent) => void;
        };
      }
    ) => YouTubePlayer;
    PlayerState: {
      ENDED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
}

function setTutorialGateDone() {
  document.cookie = "tutorial_gate=done; path=/; samesite=lax";
}

export default function WatchTutorialPage() {
  const router = useRouter();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const win = window as YouTubeWindow;
    let mounted = true;

    const initializePlayer = () => {
      if (!mounted || !win.YT?.Player) return;

      playerRef.current = new win.YT.Player(PLAYER_ELEMENT_ID, {
        videoId: "FPBPLXPGt4I",
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === win.YT?.PlayerState.ENDED) {
              setCanContinue(true);
            }
          },
        },
      });
    };

    if (win.YT?.Player) {
      initializePlayer();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }

      const previousReady = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        initializePlayer();
      };
    }

    return () => {
      mounted = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const handleDone = () => {
    if (!canContinue) return;
    setTutorialGateDone();
    router.push("/login");
  };

  return (
    <Card accentColor="#6BCB77">
      <CardHeader>
        <CardTitle className="text-2xl">Regardez le tutoriel d&apos;abord</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-bold text-[var(--foreground)]/70">
          Veuillez regarder ce tutoriel avant de vous connecter. Le bouton
          pour continuer se débloque uniquement à la fin de la vidéo.
        </p>

        <div className="overflow-hidden rounded-lg border-2 border-[var(--border-color)] bg-black shadow-[3px_3px_0px_0px_var(--shadow-color)]">
          <div className="aspect-video">
            <div id={PLAYER_ELEMENT_ID} className="h-full w-full" />
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleDone}
          disabled={!canContinue}
        >
          {canContinue
            ? "J&apos;ai regardé le tutoriel, continuer vers la connexion"
            : "Terminez la vidéo pour continuer"}
        </Button>
      </CardContent>
    </Card>
  );
}
