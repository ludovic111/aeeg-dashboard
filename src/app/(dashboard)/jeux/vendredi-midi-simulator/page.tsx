"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Clock3, ShoppingBag, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useVendrediMidiLeaderboard } from "@/hooks/use-vendredi-midi-leaderboard";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/utils";

const WORLD_WIDTH = 900;
const WORLD_HEIGHT = 520;
const TOTAL_ROUND_MS = 75_000;
const LANE_COUNT = 4;

const LANE_X = [140, 340, 560, 760] as const;
const COUNTER_Y = 280;
const LEO_Y = 430;

const DISHES = [
  { id: "pasta", name: "Pasta Box", emoji: "🍝", color: "#FF9F1C" },
  { id: "poke", name: "Poke Bowl", emoji: "🥗", color: "#2EC4B6" },
  { id: "panini", name: "Panini", emoji: "🥪", color: "#FF6B6B" },
  { id: "dessert", name: "Dessert", emoji: "🍰", color: "#845EC2" },
] as const;

type GameMode = "idle" | "playing" | "game_over";
type DishId = (typeof DISHES)[number]["id"];

interface ActiveOrder {
  dishId: DishId;
  quantity: number;
  progress: number;
  expiresInMs: number;
  sequence: number;
}

interface InternalGameState {
  mode: GameMode;
  elapsedMs: number;
  score: number;
  completedOrders: number;
  misses: number;
  leoLane: number;
  activeOrder: ActiveOrder;
  sequence: number;
  actionText: string;
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

function pickRandomDishId(): DishId {
  const randomIndex = Math.floor(Math.random() * DISHES.length);
  return DISHES[randomIndex].id;
}

function createOrder(sequence: number, elapsedMs: number): ActiveOrder {
  const pressure = clamp(elapsedMs / TOTAL_ROUND_MS, 0, 1);
  const quantity = 1 + Math.floor(Math.random() * (pressure > 0.55 ? 4 : 3));
  const expiresInMs = 9_500 - Math.floor(pressure * 3_500);

  return {
    dishId: pickRandomDishId(),
    quantity,
    progress: 0,
    expiresInMs,
    sequence,
  };
}

function buildInitialState(): InternalGameState {
  return {
    mode: "idle",
    elapsedMs: 0,
    score: 0,
    completedOrders: 0,
    misses: 0,
    leoLane: 1,
    activeOrder: createOrder(1, 0),
    sequence: 1,
    actionText: "Pret pour le service de midi.",
  };
}

function getDishById(dishId: DishId) {
  return DISHES.find((dish) => dish.id === dishId) || DISHES[0];
}

export default function VendrediMidiSimulatorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef(0);
  const gameStateRef = useRef<InternalGameState>(buildInitialState());

  const [mode, setMode] = useState<GameMode>("idle");
  const [score, setScore] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(TOTAL_ROUND_MS);
  const [lastRunScore, setLastRunScore] = useState<number | null>(null);

  const { profile } = useAuth();
  const {
    entries,
    loading,
    submitting,
    personalBest,
    personalBestDurationMs,
    submitScore,
  } = useVendrediMidiLeaderboard();

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
    const dish = getDishById(state.activeOrder.dishId);
    const roundTimeLeft = clamp(TOTAL_ROUND_MS - state.elapsedMs, 0, TOTAL_ROUND_MS);
    const orderRatio = clamp(state.activeOrder.expiresInMs / 10_000, 0, 1);

    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const bgGradient = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    bgGradient.addColorStop(0, "#FFF8E7");
    bgGradient.addColorStop(1, "#FFE2B8");
    context.fillStyle = bgGradient;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    context.fillStyle = "#D7B98A";
    context.fillRect(0, 335, WORLD_WIDTH, WORLD_HEIGHT - 335);

    context.fillStyle = "#6D4C41";
    context.fillRect(0, 95, WORLD_WIDTH, 14);

    context.fillStyle = "#4E342E";
    context.fillRect(0, 108, WORLD_WIDTH, 8);

    context.fillStyle = "#1F2937";
    context.font = "900 30px system-ui";
    context.textAlign = "left";
    context.fillText("Vendredi Midi Simulator", 24, 44);

    context.font = "700 18px system-ui";
    context.fillText(`Score: ${state.score}`, 24, 74);
    context.fillText(`Commandes: ${state.completedOrders}`, 230, 74);
    context.fillText(`Temps: ${formatDuration(roundTimeLeft)}`, 450, 74);

    context.fillStyle = "#ECEFF1";
    context.fillRect(24, 122, WORLD_WIDTH - 48, 88);
    context.strokeStyle = "#263238";
    context.lineWidth = 3;
    context.strokeRect(24, 122, WORLD_WIDTH - 48, 88);

    context.fillStyle = "#111827";
    context.font = "800 22px system-ui";
    context.fillText(`Commande #${state.activeOrder.sequence}`, 42, 157);

    context.font = "700 20px system-ui";
    context.fillText(
      `${dish.emoji} ${dish.name} x${state.activeOrder.quantity}`,
      42,
      188
    );

    context.fillStyle = "rgba(17, 24, 39, 0.16)";
    context.fillRect(545, 142, 315, 18);
    context.fillStyle = orderRatio > 0.3 ? "#10B981" : "#EF4444";
    context.fillRect(545, 142, Math.max(8, 315 * orderRatio), 18);
    context.strokeStyle = "#1F2937";
    context.strokeRect(545, 142, 315, 18);
    context.fillStyle = "#1F2937";
    context.font = "700 15px system-ui";
    context.fillText(
      `Delai commande: ${formatDuration(state.activeOrder.expiresInMs)}`,
      545,
      181
    );

    for (let lane = 0; lane < LANE_COUNT; lane += 1) {
      const laneDish = DISHES[lane];
      const laneX = LANE_X[lane] - 88;

      context.fillStyle = laneDish.color;
      context.fillRect(laneX, COUNTER_Y, 176, 78);
      context.strokeStyle = "#111827";
      context.lineWidth = 3;
      context.strokeRect(laneX, COUNTER_Y, 176, 78);

      if (laneDish.id === state.activeOrder.dishId) {
        context.strokeStyle = "#111827";
        context.lineWidth = 5;
        context.strokeRect(laneX - 6, COUNTER_Y - 6, 188, 90);
      }

      context.fillStyle = "#111827";
      context.textAlign = "center";
      context.font = "900 36px system-ui";
      context.fillText(laneDish.emoji, LANE_X[lane], COUNTER_Y + 40);
      context.font = "700 15px system-ui";
      context.fillText(laneDish.name, LANE_X[lane], COUNTER_Y + 66);
    }

    const leoX = LANE_X[state.leoLane];
    context.fillStyle = "#2563EB";
    context.beginPath();
    context.arc(leoX, LEO_Y, 30, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#DBEAFE";
    context.beginPath();
    context.arc(leoX, LEO_Y - 8, 14, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#111827";
    context.textAlign = "center";
    context.font = "900 14px system-ui";
    context.fillText("LEO", leoX, LEO_Y + 6);

    context.textAlign = "left";
    context.fillStyle = "#111827";
    context.font = "700 16px system-ui";
    context.fillText(`Progression commande: ${state.activeOrder.progress}/${state.activeOrder.quantity}`, 24, 510);

    context.fillStyle = "rgba(17, 24, 39, 0.75)";
    context.font = "700 15px system-ui";
    context.fillText(state.actionText, 390, 510);

    if (state.mode === "idle") {
      context.fillStyle = "rgba(15, 23, 42, 0.72)";
      context.fillRect(150, 220, WORLD_WIDTH - 300, 190);
      context.strokeStyle = "white";
      context.lineWidth = 3;
      context.strokeRect(150, 220, WORLD_WIDTH - 300, 190);
      context.fillStyle = "white";
      context.textAlign = "center";
      context.font = "900 32px system-ui";
      context.fillText("Service du vendredi midi", WORLD_WIDTH / 2, 270);
      context.font = "700 18px system-ui";
      context.fillText("Deplace Leo (fleches/A-D) et valide avec Espace.", WORLD_WIDTH / 2, 314);
      context.fillText("Respecte les commandes aleatoires avant la fin du chrono.", WORLD_WIDTH / 2, 344);
      context.fillText("Appuie sur Jouer pour commencer.", WORLD_WIDTH / 2, 377);
    }

    if (state.mode === "game_over") {
      context.fillStyle = "rgba(15, 23, 42, 0.74)";
      context.fillRect(205, 212, WORLD_WIDTH - 410, 192);
      context.strokeStyle = "#FDE68A";
      context.lineWidth = 3;
      context.strokeRect(205, 212, WORLD_WIDTH - 410, 192);
      context.fillStyle = "#FEF9C3";
      context.textAlign = "center";
      context.font = "900 34px system-ui";
      context.fillText("Service termine", WORLD_WIDTH / 2, 272);
      context.font = "700 20px system-ui";
      context.fillStyle = "white";
      context.fillText(`Plats achetes: ${state.score}`, WORLD_WIDTH / 2, 312);
      context.fillText(`Commandes finalisees: ${state.completedOrders}`, WORLD_WIDTH / 2, 344);
      context.fillText("Relance une partie pour battre ton record.", WORLD_WIDTH / 2, 376);
    }
  }, []);

  const endGame = useCallback(() => {
    const state = gameStateRef.current;
    if (state.mode !== "playing") return;

    state.mode = "game_over";
    const finalScore = Math.max(0, Math.floor(state.score));
    const finalDuration = clamp(Math.floor(state.elapsedMs), 0, TOTAL_ROUND_MS);

    setMode("game_over");
    setScore(finalScore);
    setCompletedOrders(state.completedOrders);
    setTimeLeftMs(clamp(TOTAL_ROUND_MS - finalDuration, 0, TOTAL_ROUND_MS));
    setLastRunScore(finalScore);

    void submitScoreRef.current(finalScore, finalDuration).then((result) => {
      if (result.error) {
        toast.error(result.error.message || "Impossible d'enregistrer le score");
        return;
      }

      if (result.improved) {
        toast.success("Nouveau record sur Vendredi Midi Simulator !");
      }
    });
  }, []);

  const createNextOrder = useCallback(() => {
    const state = gameStateRef.current;
    state.sequence += 1;
    state.activeOrder = createOrder(state.sequence, state.elapsedMs);
  }, []);

  const applyPurchase = useCallback(() => {
    const state = gameStateRef.current;
    if (state.mode !== "playing") return;

    const currentDish = DISHES[state.leoLane];
    const activeOrderDish = getDishById(state.activeOrder.dishId);

    if (currentDish.id === state.activeOrder.dishId) {
      state.activeOrder.progress += 1;
      state.score += 1;
      state.actionText = `Leo valide ${activeOrderDish.name}.`;

      if (state.activeOrder.progress >= state.activeOrder.quantity) {
        state.completedOrders += 1;
        state.score += 2;
        state.actionText = `Commande #${state.activeOrder.sequence} terminee (+2 bonus).`;
        createNextOrder();
      }
    } else {
      state.misses += 1;
      state.score = Math.max(0, state.score - 1);
      state.elapsedMs += 2_500;
      state.actionText = `Erreur: ${currentDish.name} au lieu de ${activeOrderDish.name} (-1, -2.5s).`;
    }

    setScore(Math.floor(state.score));
    setCompletedOrders(state.completedOrders);
    setTimeLeftMs(clamp(TOTAL_ROUND_MS - state.elapsedMs, 0, TOTAL_ROUND_MS));
  }, [createNextOrder]);

  const stepGame = useCallback(
    (deltaMs: number) => {
      const state = gameStateRef.current;
      if (state.mode !== "playing") return;

      state.elapsedMs += deltaMs;
      state.activeOrder.expiresInMs -= deltaMs;

      if (state.activeOrder.expiresInMs <= 0) {
        state.misses += 1;
        state.score = Math.max(0, state.score - 2);
        state.actionText = "Commande expiree (-2).";
        createNextOrder();
      }

      if (state.elapsedMs >= TOTAL_ROUND_MS) {
        endGame();
        return;
      }

      setScore(Math.floor(state.score));
      setCompletedOrders(state.completedOrders);
      setTimeLeftMs(clamp(TOTAL_ROUND_MS - state.elapsedMs, 0, TOTAL_ROUND_MS));
    },
    [createNextOrder, endGame]
  );

  const startGame = useCallback(() => {
    const newState = buildInitialState();
    newState.mode = "playing";
    gameStateRef.current = newState;

    setMode("playing");
    setScore(0);
    setCompletedOrders(0);
    setTimeLeftMs(TOTAL_ROUND_MS);
    setLastRunScore(null);
  }, []);

  const moveLeo = useCallback((direction: -1 | 1) => {
    const state = gameStateRef.current;
    if (state.mode !== "playing") return;

    state.leoLane = clamp(state.leoLane + direction, 0, LANE_COUNT - 1);
  }, []);

  const moveLeoToClientX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const normalizedX = ((clientX - rect.left) / rect.width) * WORLD_WIDTH;

    let nearestLane = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let lane = 0; lane < LANE_COUNT; lane += 1) {
      const distance = Math.abs(LANE_X[lane] - normalizedX);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearestLane = lane;
      }
    }

    gameStateRef.current.leoLane = nearestLane;
  }, []);

  const onCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "playing") return;
    moveLeoToClientX(event.clientX);
    applyPurchase();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (gameStateRef.current.mode !== "playing") return;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        moveLeo(-1);
      } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        moveLeo(1);
      } else if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key.toLowerCase() === "e"
      ) {
        event.preventDefault();
        applyPurchase();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyPurchase, moveLeo]);

  const buildTextState = useCallback(() => {
    const state = gameStateRef.current;
    const orderDish = getDishById(state.activeOrder.dishId);

    return JSON.stringify({
      coordinate_system: {
        origin: "top-left",
        x_axis: "increases to the right",
        y_axis: "increases downward",
      },
      mode: state.mode,
      leo: {
        lane: state.leoLane,
        x: LANE_X[state.leoLane],
        y: LEO_Y,
      },
      counters: DISHES.map((dish, index) => ({
        lane: index,
        x: LANE_X[index],
        y: COUNTER_Y,
        dish_id: dish.id,
        dish_name: dish.name,
      })),
      active_order: {
        sequence: state.activeOrder.sequence,
        dish_id: state.activeOrder.dishId,
        dish_name: orderDish.name,
        quantity: state.activeOrder.quantity,
        progress: state.activeOrder.progress,
        expires_in_ms: Math.max(0, Math.floor(state.activeOrder.expiresInMs)),
      },
      score: Math.floor(state.score),
      completed_orders: state.completedOrders,
      misses: state.misses,
      elapsed_ms: Math.floor(state.elapsedMs),
      round_time_left_ms: Math.max(0, TOTAL_ROUND_MS - Math.floor(state.elapsedMs)),
      personal_best: personalBest,
    });
  }, [personalBest]);

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!lastFrameTimestampRef.current) {
        lastFrameTimestampRef.current = timestamp;
      }

      const deltaMs = Math.min(40, timestamp - lastFrameTimestampRef.current);
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
    if (mode === "playing") return "Service en cours";
    if (mode === "game_over") return "Service termine";
    return "Pret";
  }, [mode]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">🍽️ Vendredi Midi Simulator</h1>
        <p className="mt-1 text-sm font-bold text-[var(--foreground)]/60">
          Controle Leo chez Miams et respecte des commandes aleatoires avant la fin
          du temps imparti.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6 items-start">
        <Card accentColor="#FF9F1C">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Jeu principal</CardTitle>
              <Button type="button" onClick={startGame}>
                {mode === "playing" ? "Recommencer" : "Jouer"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm font-black">
              <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2">
                Etat: {statusLabel}
              </div>
              <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2">
                Score: {score}
              </div>
              <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2">
                Commandes: {completedOrders}
              </div>
              <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2">
                Temps: {formatDuration(timeLeftMs)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <canvas
              ref={canvasRef}
              width={WORLD_WIDTH}
              height={WORLD_HEIGHT}
              onPointerDown={onCanvasPointerDown}
              className="w-full rounded-lg border-2 border-[var(--border-color)] bg-black/20 touch-none select-none"
            />
            <p className="text-xs font-bold text-[var(--foreground)]/70">
              Controles: fleches ou A/D pour bouger Leo, Espace/Entrer pour acheter.
              Sur mobile: touchez le comptoir voulu pour acheter.
            </p>
            {lastRunScore !== null && (
              <p className="text-sm font-black text-[var(--foreground)]/80">
                Derniere tentative: {lastRunScore} plats achetes.
              </p>
            )}
          </CardContent>
        </Card>

        <Card accentColor="#2EC4B6">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5" strokeWidth={3} />
              Leaderboard
            </CardTitle>
            <div className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] p-3 space-y-1">
              <p className="text-sm font-black">Votre meilleur score: {personalBest}</p>
              <p className="text-xs font-bold text-[var(--foreground)]/65">
                Temps record: {formatDuration(personalBestDurationMs)}
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

      <Card accentColor="#FFE66D">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3">
              <ShoppingBag className="h-5 w-5 mt-0.5" strokeWidth={3} />
              <div className="space-y-1">
                <p className="text-sm font-black">Objectif</p>
                <p className="text-sm font-bold text-[var(--foreground)]/70">
                  Achetez le maximum de plats tout en respectant les commandes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="h-5 w-5 mt-0.5" strokeWidth={3} />
              <div className="space-y-1">
                <p className="text-sm font-black">Regles</p>
                <p className="text-sm font-bold text-[var(--foreground)]/70">
                  Les commandes changent aleatoirement et expirent. Les erreurs font
                  perdre des points et du temps.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
