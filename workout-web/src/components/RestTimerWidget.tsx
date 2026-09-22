import { useEffect, useRef, useState } from 'react';
import { Timer, Pause, Play, X, Plus } from 'lucide-react';
import { formatElapsedClock } from '../lib/format';
import { REST_PRESETS_SECONDS, clampRestSeconds, computeRemainingSeconds, addSecondsToEnd } from '../lib/restTimer';

// Plays a short two-beep alert with the Web Audio API — no audio asset to
// ship, and it works even when the tab has no <audio> element. Best-effort:
// browsers that block autoplay audio (or don't support the API) just get the
// vibration + visual flash instead, so this never throws into the caller.
function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.18].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.16);
    });
    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    // best-effort only
  }
}

function notifyDone() {
  playBeep();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch { /* unsupported */ }
  }
}

interface RestTimerWidgetProps {
  // Only rendered once a workout session is actively being built (matches
  // the visibility rule the "Log workout" elapsed clock already uses) — a
  // rest timer with nothing to rest between doesn't make sense.
  visible: boolean;
}

export default function RestTimerWidget({ visible }: RestTimerWidgetProps) {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [pausedRemaining, setPausedRemaining] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [done, setDone] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const doneFiredRef = useRef(false);

  // Defined before any early return / effect that references it below —
  // both `start` (called from the effect-registered JSX) and the auto-
  // dismiss effect close over `reset`, and a `const` declared after a
  // conditional return would stay in the temporal dead zone on renders
  // that bail out before reaching it.
  const reset = () => {
    setEndAt(null);
    setPaused(false);
    setDone(false);
    setRemaining(0);
    setPausedRemaining(0);
    doneFiredRef.current = false;
  };

  const start = (seconds: number) => {
    doneFiredRef.current = false;
    setDone(false);
    setPaused(false);
    setEndAt(Date.now() + clampRestSeconds(seconds) * 1000);
    setShowPresets(false);
  };

  const togglePause = () => {
    if (!endAt) return;
    if (paused) {
      setEndAt(Date.now() + pausedRemaining * 1000);
      setPaused(false);
    } else {
      setPausedRemaining(computeRemainingSeconds(endAt));
      setPaused(true);
    }
  };

  const addTime = (delta: number) => {
    if (!endAt) return;
    if (paused) {
      setPausedRemaining((r) => clampRestSeconds(r + delta));
    } else {
      setEndAt((prev) => (prev ? addSecondsToEnd(prev, delta) : prev));
    }
  };

  useEffect(() => {
    if (!endAt || paused) return;
    const tick = () => {
      const r = computeRemainingSeconds(endAt);
      setRemaining(r);
      if (r === 0 && !doneFiredRef.current) {
        doneFiredRef.current = true;
        setDone(true);
        notifyDone();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt, paused]);

  // Auto-dismiss the "done" state back to idle a few seconds after it fires,
  // so the pill doesn't sit on screen forever if the user doesn't tap it.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => reset(), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // The widget hides once the draft is cleared (workout saved / discarded),
  // but this component stays mounted (only its render output is gated) — so
  // without this, a rest timer left running would keep ticking invisibly in
  // the background and could fire the beep/vibration, or leave a stale
  // "done" pill waiting to reappear, the next time a new session starts.
  useEffect(() => {
    if (!visible) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const idle = endAt === null && !done;
  const displaySeconds = paused ? pausedRemaining : remaining;

  return (
    <div className="fixed bottom-32 md:bottom-24 right-4 z-40 flex flex-col items-end gap-2">
      {showPresets && idle && (
        <div className="bg-card border border-border rounded-2xl shadow-lg p-2 flex flex-col gap-1.5 w-32">
          {REST_PRESETS_SECONDS.map((s) => (
            <button
              key={s}
              onClick={() => start(s)}
              className="text-xs font-bold text-text-main bg-card-2 hover:bg-primary hover:text-white rounded-xl py-2 transition-colors"
            >
              {s < 60 ? `${s}s` : `${Math.round(s / 60)} phút`}
            </button>
          ))}
        </div>
      )}

      {idle && (
        <button
          onClick={() => setShowPresets((v) => !v)}
          aria-label="Hẹn giờ nghỉ giữa hiệp"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-card border border-border shadow-lg text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
        >
          <Timer size={22} />
        </button>
      )}

      {!idle && done && (
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-success text-white font-black text-sm px-4 py-3 rounded-2xl shadow-lg shadow-success/40 animate-pulse"
        >
          <span>⏰ Hết giờ nghỉ! 💪</span>
        </button>
      )}

      {!idle && !done && (
        <div className="flex items-center gap-1.5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/40 pl-1.5 pr-2 py-1.5">
          <button
            onClick={reset}
            aria-label="Huỷ hẹn giờ"
            className="p-1.5 rounded-xl hover:bg-white/15 transition-colors"
          >
            <X size={16} />
          </button>
          <span className="font-mono font-black text-base tabular-nums min-w-[3.5rem] text-center">
            {formatElapsedClock(displaySeconds)}
          </span>
          <button
            onClick={() => addTime(15)}
            aria-label="Cộng thêm 15 giây"
            className="flex items-center px-1.5 py-1.5 rounded-xl hover:bg-white/15 transition-colors text-xs font-bold"
          >
            <Plus size={12} />15s
          </button>
          <button
            onClick={togglePause}
            aria-label={paused ? 'Tiếp tục đếm' : 'Tạm dừng'}
            className="p-1.5 rounded-xl hover:bg-white/15 transition-colors"
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}
