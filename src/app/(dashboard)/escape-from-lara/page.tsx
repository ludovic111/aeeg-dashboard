"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { RotateCcw, Rocket, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useSpaceShooterLeaderboard } from "@/hooks/use-space-shooter";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/utils";

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 520;
const PLAYER_Y = WORLD_HEIGHT - 58;
const PLAYER_HIT_RADIUS = 18;
const ENEMY_Y = 78;

type GameMode = "idle" | "playing" | "game_over";

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
}

interface InternalGameState {
  mode: GameMode;
  playerX: number;
  enemyX: number;
  enemyPhase: number;
  bullets: Bullet[];
  elapsedMs: number;
  score: number;
  spawnCooldownMs: number;
  nextBulletId: number;
  hudTickMs: number;
}

interface GameWindow extends Window {
  advanceTime?: (ms: number) => void;
  render_game_to_text?: () => string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDuration(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${mins}:${rem.toString().padStart(2, "0")}`;
}

function buildInitialState(): InternalGameState {
  return {
    mode: "idle",
    playerX: WORLD_WIDTH / 2,
    enemyX: WORLD_WIDTH / 2,
    enemyPhase: 0,
    bullets: [],
    elapsedMs: 0,
    score: 0,
    spawnCooldownMs: 800,
    nextBulletId: 1,
    hudTickMs: 0,
  };
}

function createStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    radius: 0.5 + Math.random() * 1.8,
    speed: 0.25 + Math.random() * 0.9,
    alpha: 0.25 + Math.random() * 0.6,
  }));
}

export default function EscapeFromLaraPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef<number>(0);
  const gameStateRef = useRef<InternalGameState>(buildInitialState());
  const draggingRef = useRef(false);
  const starsRef = useRef<Star[]>(createStars(120));

  const [mode, setMode] = useState<GameMode>("idle");
  const [score, setScore] = useState(0);
  const [runDurationMs, setRunDurationMs] = useState(0);
  const [lastRunScore, setLastRunScore] = useState<number | null>(null);

  const { profile } = useAuth();
  const {
    entries,
    loading,
    submitting,
    personalBest,
    personalBestDurationMs,
    submitScore,
  } = useSpaceShooterLeaderboard();

  const submitScoreRef = useRef(submitScore);

  useEffect(() => {
    submitScoreRef.current = submitScore;
  }, [submitScore]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const state = gameStateRef.current;

    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const backgroundGradient = context.createLinearGradient(
      0,
      0,
      0,
      WORLD_HEIGHT
    );
    backgroundGradient.addColorStop(0, "#090d29");
    backgroundGradient.addColorStop(0.55, "#121c48");
    backgroundGradient.addColorStop(1, "#050714");

    context.fillStyle = backgroundGradient;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    context.fillStyle = "rgba(90, 118, 255, 0.18)";
    context.fillRect(0, 0, WORLD_WIDTH, 130);

    for (const star of starsRef.current) {
      const animatedY =
        (star.y + state.elapsedMs * 0.05 * star.speed) % WORLD_HEIGHT;
      context.beginPath();
      context.arc(star.x, animatedY, star.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255,255,255,${star.alpha})`;
      context.fill();
    }

    context.save();
    context.translate(state.enemyX, ENEMY_Y);
    context.fillStyle = "#ff6b6b";
    context.beginPath();
    context.moveTo(0, -28);
    context.lineTo(-36, 16);
    context.lineTo(36, 16);
    context.closePath();
    context.fill();

    context.fillStyle = "#ff9f43";
    context.fillRect(-16, 12, 32, 16);

    context.fillStyle = "#1f2937";
    context.font = "bold 14px system-ui";
    context.textAlign = "center";
    context.fillText("LARA", 0, 8);
    context.restore();

    for (const bullet of state.bullets) {
      context.beginPath();
      context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      context.fillStyle = "#ffd166";
      context.fill();

      context.beginPath();
      context.arc(bullet.x, bullet.y, Math.max(1.5, bullet.radius - 2), 0, Math.PI * 2);
      context.fillStyle = "#f97316";
      context.fill();
    }

    context.save();
    context.translate(state.playerX, PLAYER_Y);
    context.fillStyle = "#4ecdc4";
    context.beginPath();
    context.moveTo(0, -26);
    context.lineTo(-26, 22);
    context.lineTo(0, 14);
    context.lineTo(26, 22);
    context.closePath();
    context.fill();

    context.fillStyle = "#0f172a";
    context.fillRect(-10, -8, 20, 18);

    context.fillStyle = "#34d399";
    context.fillRect(-18, 20, 36, 10);
    context.restore();

    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.font = "700 15px system-ui";
    context.textAlign = "left";
    context.fillText(`Score: ${Math.floor(state.score)}`, 18, 28);
    context.fillText(`Duree: ${formatDuration(state.elapsedMs)}`, 18, 50);
    context.fillText(
      `Difficulte: ${Math.min(99, 1 + Math.floor(state.elapsedMs / 6000))}`,
      18,
      72
    );

    if (state.mode === "idle") {
      context.fillStyle = "rgba(3, 7, 18, 0.72)";
      context.fillRect(120, 170, WORLD_WIDTH - 240, 190);
      context.strokeStyle = "rgba(255, 255, 255, 0.5)";
      context.lineWidth = 2;
      context.strokeRect(120, 170, WORLD_WIDTH - 240, 190);

      context.fillStyle = "white";
      context.textAlign = "center";
      context.font = "900 36px system-ui";
      context.fillText("Escape From Lara", WORLD_WIDTH / 2, 230);
      context.font = "700 19px system-ui";
      context.fillText(
        "Glissez votre vaisseau de gauche a droite pour eviter les tirs.",
        WORLD_WIDTH / 2,
        276
      );
      context.font = "700 17px system-ui";
      context.fillText("Lancez une partie pour commencer.", WORLD_WIDTH / 2, 314);
    }

    if (state.mode === "game_over") {
      context.fillStyle = "rgba(15, 23, 42, 0.72)";
      context.fillRect(205, 170, WORLD_WIDTH - 410, 180);
      context.strokeStyle = "#f87171";
      context.lineWidth = 3;
      context.strokeRect(205, 170, WORLD_WIDTH - 410, 180);

      context.fillStyle = "#fecaca";
      context.textAlign = "center";
      context.font = "900 34px system-ui";
      context.fillText("Collision!", WORLD_WIDTH / 2, 230);
      context.font = "700 20px system-ui";
      context.fillStyle = "white";
      context.fillText(`Score final: ${Math.floor(state.score)}`, WORLD_WIDTH / 2, 274);
      context.font = "700 17px system-ui";
      context.fillText("Cliquez sur Rejouer pour retenter.", WORLD_WIDTH / 2, 312);
    }
  }, []);

  const endGame = useCallback(() => {
    const state = gameStateRef.current;
    if (state.mode !== "playing") return;

    state.mode = "game_over";
    const finalScore = Math.floor(state.score);
    const finalDuration = Math.floor(state.elapsedMs);

    setMode("game_over");
    setScore(finalScore);
    setRunDurationMs(finalDuration);
    setLastRunScore(finalScore);

    void submitScoreRef.current(finalScore, finalDuration).then((result) => {
      if (result.error) {
        toast.error(result.error.message || "Impossible d'enregistrer le score");
        return;
      }

      if (result.improved) {
        toast.success("Nouveau record personnel !");
      }
    });
  }, []);

  const spawnVolley = useCallback((difficulty: number) => {
    const state = gameStateRef.current;
    const volleyCount = Math.min(7, 1 + Math.floor(difficulty * 0.9));
    const baseSpread = 20 + difficulty * 2.8;
    const aimStrength = 48 + difficulty * 9;
    const speedBase = 175 + difficulty * 38;

    for (let index = 0; index < volleyCount; index += 1) {
      const spreadOffset = (index - (volleyCount - 1) / 2) * baseSpread;
      const playerOffsetRatio = (state.playerX - state.enemyX) / (WORLD_WIDTH / 2);
      const vx = spreadOffset * 1.05 + playerOffsetRatio * aimStrength;
      const vy = speedBase + Math.abs(spreadOffset) * 0.28;

      state.bullets.push({
        id: state.nextBulletId++,
        x: clamp(state.enemyX + spreadOffset * 0.25, 24, WORLD_WIDTH - 24),
        y: ENEMY_Y + 22,
        vx,
        vy,
        radius: 8,
      });
    }
  }, []);

  const stepGame = useCallback(
    (deltaMs: number) => {
      const state = gameStateRef.current;
      if (state.mode !== "playing") return;

      state.elapsedMs += deltaMs;
      const difficulty = 1 + state.elapsedMs / 10000;

      state.score += (deltaMs / 1000) * (8 + difficulty * 1.6);
      state.enemyPhase += (deltaMs / 1000) * (0.9 + difficulty * 0.14);
      state.enemyX = WORLD_WIDTH / 2 + Math.sin(state.enemyPhase) * (WORLD_WIDTH * 0.34);

      state.spawnCooldownMs -= deltaMs;
      if (state.spawnCooldownMs <= 0) {
        spawnVolley(difficulty);
        const nextDelay = Math.max(150, 900 - difficulty * 95);
        state.spawnCooldownMs += nextDelay;
      }

      state.bullets = state.bullets
        .map((bullet) => ({
          ...bullet,
          x: bullet.x + bullet.vx * (deltaMs / 1000),
          y: bullet.y + bullet.vy * (deltaMs / 1000),
        }))
        .filter(
          (bullet) =>
            bullet.y < WORLD_HEIGHT + 40 &&
            bullet.x > -60 &&
            bullet.x < WORLD_WIDTH + 60
        );

      const collided = state.bullets.some((bullet) => {
        const dx = bullet.x - state.playerX;
        const dy = bullet.y - PLAYER_Y;
        const allowed = PLAYER_HIT_RADIUS + bullet.radius;
        return dx * dx + dy * dy <= allowed * allowed;
      });

      if (collided) {
        endGame();
        return;
      }

      state.hudTickMs += deltaMs;
      if (state.hudTickMs >= 120) {
        state.hudTickMs = 0;
        setScore(Math.floor(state.score));
        setRunDurationMs(Math.floor(state.elapsedMs));
      }
    },
    [endGame, spawnVolley]
  );

  const startGame = useCallback(() => {
    const newState = buildInitialState();
    newState.mode = "playing";
    newState.enemyPhase = Math.random() * Math.PI * 2;
    newState.enemyX = WORLD_WIDTH / 2;
    newState.spawnCooldownMs = 760;
    gameStateRef.current = newState;

    setMode("playing");
    setScore(0);
    setRunDurationMs(0);
    setLastRunScore(null);
  }, []);

  const updatePlayerFromClientX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const normalized = (clientX - rect.left) / rect.width;
    const x = normalized * WORLD_WIDTH;
    gameStateRef.current.playerX = clamp(x, 30, WORLD_WIDTH - 30);
  }, []);

  const handleCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "playing") return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePlayerFromClientX(event.clientX);
  };

  const handleCanvasPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current || mode !== "playing") return;
    updatePlayerFromClientX(event.clientX);
  };

  const handleCanvasPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const buildTextState = useCallback(() => {
    const state = gameStateRef.current;
    return JSON.stringify({
      coordinate_system: {
        origin: "top-left",
        x_axis: "increases to the right",
        y_axis: "increases downward",
      },
      mode: state.mode,
      player: {
        x: Math.round(state.playerX),
        y: PLAYER_Y,
        hit_radius: PLAYER_HIT_RADIUS,
      },
      lara_ship: {
        x: Math.round(state.enemyX),
        y: ENEMY_Y,
      },
      bullets: state.bullets.slice(0, 20).map((bullet) => ({
        x: Math.round(bullet.x),
        y: Math.round(bullet.y),
        vx: Math.round(bullet.vx),
        vy: Math.round(bullet.vy),
        radius: bullet.radius,
      })),
      bullet_count: state.bullets.length,
      score: Math.floor(state.score),
      elapsed_ms: Math.floor(state.elapsedMs),
      difficulty_level: Number((1 + state.elapsedMs / 10000).toFixed(2)),
      personal_best: personalBest,
    });
  }, [personalBest]);

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!lastFrameTimestampRef.current) {
        lastFrameTimestampRef.current = timestamp;
      }

      const deltaMs = Math.min(42, timestamp - lastFrameTimestampRef.current);
      lastFrameTimestampRef.current = timestamp;

      stepGame(deltaMs);
      drawGame();
      animationFrameRef.current = window.requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = window.requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      lastFrameTimestampRef.current = 0;
    };
  }, [drawGame, stepGame]);

  useEffect(() => {
    const win = window as GameWindow;

    win.render_game_to_text = buildTextState;
    win.advanceTime = (ms: number) => {
      const totalMs = Math.max(0, ms);
      const steps = Math.max(1, Math.round(totalMs / (1000 / 60)));
      const stepMs = totalMs / steps;

      for (let index = 0; index < steps; index += 1) {
        stepGame(stepMs);
      }
      drawGame();
    };

    return () => {
      delete win.render_game_to_text;
      delete win.advanceTime;
    };
  }, [buildTextState, drawGame, stepGame]);

  const statusLabel = useMemo(() => {
    if (mode === "playing") return "Partie en cours";
    if (mode === "game_over") return "Partie terminee";
    return "Pret a jouer";
  }, [mode]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">🚀 Escape From Lara</h1>
        <p className="mt-1 text-sm font-bold text-[var(--foreground)]/60">
          Glissez le vaisseau de gauche a droite pour survivre aux tirs de Lara.
          Plus vous tenez, plus le jeu accelere.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6 items-start">
        <Card accentColor="#4ECDC4">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Mini-jeu spatial</CardTitle>
              <Button type="button" onClick={startGame}>
                <RotateCcw className="h-4 w-4" strokeWidth={3} />
                {mode === "playing" ? "Recommencer" : "Jouer"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm font-black">
              <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2">
                Etat: {statusLabel}
              </div>
              <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2">
                Score: {score}
              </div>
              <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2">
                Duree: {formatDuration(runDurationMs)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <canvas
              ref={canvasRef}
              width={WORLD_WIDTH}
              height={WORLD_HEIGHT}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              className="w-full rounded-lg border-2 border-[var(--border-color)] bg-black touch-none select-none"
            />
            <p className="text-xs font-bold text-[var(--foreground)]/60">
              Controle: maintenez le clic (ou le doigt) sur le canvas puis glissez
              horizontalement pour esquiver les projectiles.
            </p>
            {lastRunScore !== null && (
              <p className="text-sm font-black text-[var(--foreground)]/80">
                Derniere tentative: {lastRunScore} points en{" "}
                {formatDuration(runDurationMs)}.
              </p>
            )}
          </CardContent>
        </Card>

        <Card accentColor="#FFE66D">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5" strokeWidth={3} />
              Leaderboard
            </CardTitle>
            <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] p-3 space-y-1">
              <p className="text-sm font-black">Votre meilleur score: {personalBest}</p>
              <p className="text-xs font-bold text-[var(--foreground)]/65">
                Duree record: {formatDuration(personalBestDurationMs)}
              </p>
              {submitting && (
                <p className="text-xs font-bold text-[var(--foreground)]/65">
                  Sauvegarde du score en cours...
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-14" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <p className="text-sm font-bold text-[var(--foreground)]/65">
                Aucun score pour le moment. Lancez la premiere partie.
              </p>
            ) : (
              entries.map((entry, index) => {
                const displayName = entry.player?.full_name || "Membre AEEG";
                const isCurrentUser = Boolean(profile?.id && entry.player_id === profile.id);

                return (
                  <div
                    key={entry.id}
                    className={`rounded-lg border-2 p-2 ${
                      isCurrentUser
                        ? "border-brutal-teal bg-brutal-teal/15"
                        : "border-[var(--border-color)] bg-[var(--card-bg)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-black text-sm">
                        #{index + 1}
                      </div>
                      <Avatar
                        size="sm"
                        name={displayName}
                        src={entry.player?.avatar_url || null}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{displayName}</p>
                        <p className="text-xs font-bold text-[var(--foreground)]/65">
                          Mis a jour {formatRelative(entry.updated_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">{entry.best_score}</p>
                        <p className="text-xs font-bold text-[var(--foreground)]/65">
                          {formatDuration(entry.best_duration_ms)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card accentColor="#FF6B6B">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Rocket className="h-5 w-5 mt-0.5" strokeWidth={3} />
            <div className="space-y-1">
              <p className="text-sm font-black">Objectif</p>
              <p className="text-sm font-bold text-[var(--foreground)]/70">
                Lara envoie des salves de plus en plus denses et rapides. Votre
                mission est simple: survivre le plus longtemps possible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
