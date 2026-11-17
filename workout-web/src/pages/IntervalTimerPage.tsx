import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play, Square, Volume2, VolumeX, Minus, Plus, RotateCcw } from 'lucide-react';
import { useWorkoutStore } from '../stores/workoutStore';
import { SYSTEM_PRESETS } from '../constants/exercises';
import {
  INTERVAL_PRESETS, IntervalConfig, LIMITS, buildSchedule, totalDurationSec, workDurationSec,
  timerStateAt, workDoneSec, completedRounds, formatClock, describeConfig, normalizeConfig,
  SegmentKind,
} from '../lib/intervalTimer';

// HIIT / Tabata / EMOM interval timer — v2.35.0 (Phase 18).
// Guided interval sessions are a core feature of the most-downloaded
// workout apps (Nike Training Club, Seconds, Hevy/Strong timers). The clock
// is timestamp-based (see lib/intervalTimer.ts) so it stays correct even if
// the phone throttles timers in the background.

type Phase = 'setup' | 'running' | 'paused' | 'done';

const HIIT_PRESET = SYSTEM_PRESETS.find((p) => p.id === 'hiit_interval')!;
const SOUND_KEY = 'intervalTimerSound';

const KIND_STYLE: Record<SegmentKind, { label: string; bg: string; text: string }> = {
  prep: { label: 'CHUẨN BỊ', bg: 'bg-sky-600', text: 'text-white' },
  work: { label: 'TẬP', bg: 'bg-primary', text: 'text-white' },
  rest: { label: 'NGHỈ', bg: 'bg-success', text: 'text-white' },
};

function readSoundPref(): boolean {
  try { return localStorage.getItem(SOUND_KEY) !== '0'; } catch { return true; }
}

interface StepperProps {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function Stepper({ label, value, unit, step, min, max, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-between bg-card-2 border border-border rounded-xl px-3 py-2.5">
      <span className="text-sm font-semibold text-text-main">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Giảm ${label}`} disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-text-main disabled:opacity-40">
          <Minus size={14} />
        </button>
        <span className="w-16 text-center font-black text-text-main tabular-nums">{value}{unit}</span>
        <button type="button" aria-label={`Tăng ${label}`} disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-text-main disabled:opacity-40">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function IntervalTimerPage() {
  const navigate = useNavigate();
  const { draft, addExercise, updateExercise, setNotes, startDraft } = useWorkoutStore();

  const [presetId, setPresetId] = useState('tabata');
  const [config, setConfig] = useState<IntervalConfig>(INTERVAL_PRESETS[0].config);
  const [phase, setPhase] = useState<Phase>('setup');
  const [soundOn, setSoundOn] = useState(readSoundPref);
  const [now, setNow] = useState(() => Date.now());

  // Elapsed = accumulated (from previous run legs) + (now - runStart).
  const accMsRef = useRef(0);
  const runStartRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastCueRef = useRef<{ index: number; remaining: number }>({ index: -2, remaining: -1 });

  const schedule = useMemo(() => buildSchedule(config), [config]);
  const total = totalDurationSec(schedule);
  const elapsedMs = accMsRef.current + (phase === 'running' && runStartRef.current !== null ? now - runStartRef.current : 0);
  const state = timerStateAt(schedule, elapsedMs);
  const norm = normalizeConfig(config);

  // ---- sound / vibration --------------------------------------------------
  const beep = useCallback((freq: number, ms: number) => {
    if (!soundOn) return;
    const ctx = audioRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ms / 1000);
    } catch { /* audio unavailable — silent fallback */ }
  }, [soundOn]);

  const vibrate = (pattern: number | number[]) => {
    try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
  };

  // ---- wake lock (keep screen on while running) ---------------------------
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
      }
    } catch { /* denied / unsupported — timer still works */ }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  // ---- ticking -------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    const onVisible = () => {
      setNow(Date.now());
      // Wake lock is auto-released when the tab is hidden; re-acquire.
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [phase, requestWakeLock]);

  // Cues + finish detection, driven by the derived state.
  useEffect(() => {
    if (phase !== 'running') return;
    if (state.finished) {
      accMsRef.current = total * 1000;
      runStartRef.current = null;
      setPhase('done');
      releaseWakeLock();
      beep(880, 300); setTimeout(() => beep(880, 300), 350); setTimeout(() => beep(1175, 600), 700);
      vibrate([300, 100, 300, 100, 500]);
      return;
    }
    const last = lastCueRef.current;
    if (state.index !== last.index) {
      if (last.index !== -2) {
        // Transition bell: higher pitch into work, lower into rest.
        beep(state.segment?.kind === 'work' ? 1046 : 660, 450);
        vibrate(state.segment?.kind === 'work' ? [200, 80, 200] : 300);
      }
      lastCueRef.current = { index: state.index, remaining: state.remainingSec };
    } else if (state.remainingSec !== last.remaining) {
      if (state.remainingSec >= 1 && state.remainingSec <= 3) beep(587, 120);
      lastCueRef.current = { index: state.index, remaining: state.remainingSec };
    }
  }, [phase, state.finished, state.index, state.remainingSec, state.segment?.kind, total, beep, releaseWakeLock]);

  useEffect(() => () => {
    releaseWakeLock();
    audioRef.current?.close().catch(() => {});
  }, [releaseWakeLock]);

  // ---- controls -----------------------------------------------------------
  const ensureAudio = () => {
    try {
      if (!audioRef.current) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctor) audioRef.current = new Ctor();
      }
      audioRef.current?.resume().catch(() => {});
    } catch { /* ignore */ }
  };

  const start = () => {
    ensureAudio();
    setConfig(norm);
    accMsRef.current = 0;
    runStartRef.current = Date.now();
    lastCueRef.current = { index: -2, remaining: -1 };
    setNow(Date.now());
    setPhase('running');
    requestWakeLock();
  };

  const pause = () => {
    if (runStartRef.current !== null) accMsRef.current += Date.now() - runStartRef.current;
    runStartRef.current = null;
    setNow(Date.now());
    setPhase('paused');
    releaseWakeLock();
  };

  const resume = () => {
    ensureAudio();
    runStartRef.current = Date.now();
    setNow(Date.now());
    setPhase('running');
    requestWakeLock();
  };

  const stop = () => {
    if (runStartRef.current !== null) accMsRef.current += Date.now() - runStartRef.current;
    runStartRef.current = null;
    setNow(Date.now());
    setPhase('done');
    releaseWakeLock();
  };

  const reset = () => {
    accMsRef.current = 0;
    runStartRef.current = null;
    setPhase('setup');
  };

  const toggleSound = () => {
    setSoundOn((v) => {
      const next = !v;
      try { localStorage.setItem(SOUND_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  const choosePreset = (id: string) => {
    const p = INTERVAL_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setConfig(p.config);
  };

  // Any manual tweak turns a named preset into a custom interval (EMOM stays
  // EMOM — its rules differ), so the logged note never claims "Tabata" for
  // a 30s/15s session.
  const editField = (field: keyof Omit<IntervalConfig, 'mode'>, v: number) => {
    setConfig((c) => ({ ...c, mode: c.mode === 'emom' ? 'emom' : 'custom', [field]: v }));
    setPresetId((id) => (id === 'emom' ? 'emom' : 'custom'));
  };

  // ---- result → workout draft ---------------------------------------------
  const doneWorkSec = workDoneSec(schedule, accMsRef.current);
  const doneRounds = completedRounds(schedule, accMsRef.current);
  const canLog = doneWorkSec >= 30;

  const addToWorkout = () => {
    if (!canLog) return;
    const existing = draft.exercises.find((e) => e.presetId === HIIT_PRESET.id);
    if (existing) {
      updateExercise(HIIT_PRESET.id, { durationSeconds: (existing.durationSeconds || 0) + doneWorkSec });
    } else {
      addExercise({
        presetId: HIIT_PRESET.id,
        name: HIIT_PRESET.nameVi,
        category: HIIT_PRESET.category,
        unit: HIIT_PRESET.unit,
        sets: 1,
        durationSeconds: doneWorkSec,
      });
    }
    const line = `⏱️ ${describeConfig(config)} — ${doneRounds} hiệp, ${formatClock(doneWorkSec)} tập`;
    setNotes(draft.notes ? `${draft.notes}\n${line}` : line);
    startDraft();
    navigate('/');
  };

  // ---- render ---------------------------------------------------------------
  const header = (
    <div className="flex items-center justify-between mb-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text-secondary">
        <ArrowLeft size={18} /> <span className="text-sm font-semibold">Quay lại</span>
      </button>
      <button onClick={toggleSound} aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
        className="p-2 rounded-xl text-text-secondary hover:bg-card-2">
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
    </div>
  );

  if (phase === 'setup') {
    return (
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-28 max-w-xl mx-auto">
        {header}
        <h1 className="text-2xl font-black text-text-main mb-1">⏱️ Hẹn giờ HIIT</h1>
        <p className="text-sm text-text-secondary mb-4">Tabata, EMOM hoặc tự chỉnh — có tiếng bíp & rung báo đổi hiệp, màn hình luôn sáng khi đang chạy.</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {INTERVAL_PRESETS.map((p) => (
            <button key={p.id} onClick={() => choosePreset(p.id)}
              className={`text-left rounded-xl border-2 p-3 transition-colors ${presetId === p.id ? 'border-primary bg-primary-light' : 'border-border bg-card'}`}>
              <p className="font-black text-sm text-text-main">{p.label}</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-snug">{p.description}</p>
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-3 space-y-2 mb-4">
          <Stepper label={norm.mode === 'emom' ? 'Mỗi hiệp' : 'Tập'} value={norm.workSec} unit="s" step={5}
            min={LIMITS.workSec.min} max={LIMITS.workSec.max} onChange={(v) => editField('workSec', v)} />
          {norm.mode !== 'emom' && (
            <Stepper label="Nghỉ" value={norm.restSec} unit="s" step={5}
              min={LIMITS.restSec.min} max={LIMITS.restSec.max} onChange={(v) => editField('restSec', v)} />
          )}
          <Stepper label="Số hiệp" value={norm.rounds} unit="" step={1}
            min={LIMITS.rounds.min} max={LIMITS.rounds.max} onChange={(v) => editField('rounds', v)} />
          <Stepper label="Chuẩn bị" value={norm.prepSec} unit="s" step={5}
            min={LIMITS.prepSec.min} max={LIMITS.prepSec.max} onChange={(v) => editField('prepSec', v)} />
        </div>

        <div className="flex justify-between text-sm text-text-secondary mb-4 px-1">
          <span>Tổng: <b className="text-text-main">{formatClock(total)}</b></span>
          <span>Thời gian tập: <b className="text-text-main">{formatClock(workDurationSec(schedule))}</b></span>
        </div>

        <button onClick={start}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 text-lg">
          <Play size={20} /> Bắt đầu
        </button>
        <p className="text-xs text-text-muted mt-3 text-center">Gợi ý: kết hợp burpee, squat, hít đất, leo núi hoặc bài tạ đơn nhẹ (thruster, swing) cho mỗi hiệp.</p>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-28 max-w-xl mx-auto">
        {header}
        <div className="bg-card rounded-2xl border border-border p-6 text-center mb-4">
          <p className="text-4xl mb-2">{doneRounds >= norm.rounds ? '🎉' : '💪'}</p>
          <p className="text-xl font-black text-text-main mb-1">
            {doneRounds >= norm.rounds ? 'Hoàn thành!' : 'Đã dừng'}
          </p>
          <p className="text-sm text-text-secondary">{describeConfig(config)}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-card-2 rounded-xl p-3">
              <p className="text-2xl font-black text-text-main tabular-nums">{doneRounds}/{norm.rounds}</p>
              <p className="text-xs text-text-secondary">hiệp hoàn thành</p>
            </div>
            <div className="bg-card-2 rounded-xl p-3">
              <p className="text-2xl font-black text-text-main tabular-nums">{formatClock(doneWorkSec)}</p>
              <p className="text-xs text-text-secondary">thời gian tập</p>
            </div>
          </div>
        </div>
        <button onClick={addToWorkout} disabled={!canLog}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl mb-2 disabled:opacity-40">
          Thêm vào buổi tập hôm nay
        </button>
        {!canLog && <p className="text-xs text-text-muted text-center mb-2">Cần tập ít nhất 30 giây để ghi lại.</p>}
        <button onClick={reset}
          className="w-full py-3 bg-card border border-border text-text-main font-bold rounded-2xl flex items-center justify-center gap-2">
          <RotateCcw size={16} /> Tập lại / chỉnh hẹn giờ
        </button>
      </div>
    );
  }

  // running / paused
  const seg = state.segment;
  const style = seg ? KIND_STYLE[seg.kind] : KIND_STYLE.prep;
  const segProgress = seg ? 1 - Math.max(0, (seg.startSec + seg.durationSec - state.elapsedSec) / seg.durationSec) : 1;
  const next = state.index >= 0 ? schedule[state.index + 1] : undefined;

  return (
    <div className={`min-h-screen ${style.bg} ${style.text} transition-colors flex flex-col px-4 pt-6 pb-28`} data-testid="timer-running">
      <div className="flex items-center justify-between mb-2 max-w-xl w-full mx-auto">
        <span className="text-sm font-bold opacity-90">{seg && seg.round > 0 ? `Hiệp ${seg.round}/${norm.rounds}` : 'Sắp bắt đầu'}</span>
        <button onClick={toggleSound} aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'} className="p-2 rounded-xl bg-white/15">
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full mx-auto">
        <p className="text-2xl font-black tracking-widest mb-2" data-testid="timer-phase">{phase === 'paused' ? 'TẠM DỪNG' : style.label}</p>
        <p className="font-black tabular-nums leading-none text-[96px] md:text-[140px]" data-testid="timer-clock">{formatClock(state.remainingSec)}</p>
        <div className="w-full h-2 bg-white/25 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, segProgress * 100)}%` }} />
        </div>
        <div className="w-full flex justify-between text-sm font-semibold mt-3 opacity-90">
          <span>Còn lại {formatClock(state.totalSec - state.elapsedSec)}</span>
          <span>{next ? `Tiếp: ${KIND_STYLE[next.kind].label.toLowerCase()} ${next.durationSec}s` : 'Hiệp cuối!'}</span>
        </div>
      </div>
      <div className="flex gap-3 max-w-xl w-full mx-auto">
        {phase === 'running' ? (
          <button onClick={pause} className="flex-1 py-4 rounded-2xl bg-white/20 font-black flex items-center justify-center gap-2">
            <Pause size={20} /> Tạm dừng
          </button>
        ) : (
          <button onClick={resume} className="flex-1 py-4 rounded-2xl bg-white text-text-main font-black flex items-center justify-center gap-2" style={{ color: '#111' }}>
            <Play size={20} /> Tiếp tục
          </button>
        )}
        <button onClick={stop} className="px-5 py-4 rounded-2xl bg-black/25 font-black flex items-center justify-center gap-2">
          <Square size={18} /> Kết thúc
        </button>
      </div>
    </div>
  );
}
