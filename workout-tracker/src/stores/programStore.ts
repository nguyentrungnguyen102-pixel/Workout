import { create } from 'zustand';
import { ActiveProgramState, WorkoutProgram } from '../types/program';
import { PROGRAM_TEMPLATES } from '../constants/programTemplates';
import {
  activateProgram,
  advanceProgramDay,
  deactivateProgramInFirestore,
  getActiveProgramState,
} from '../services/programService';

interface ProgramStore {
  activeState: ActiveProgramState | null;
  loading: boolean;

  loadActiveProgram: (uid: string) => Promise<void>;
  activate: (uid: string, programId: string) => Promise<void>;
  advanceDay: (uid: string, completedDayId?: string) => Promise<void>;
  deactivate: (uid: string) => Promise<void>;

  getActiveProgram: () => WorkoutProgram | null;
  getTodayDay: () => WorkoutProgram['days'][0] | null;
}

export const useProgramStore = create<ProgramStore>((set, get) => ({
  activeState: null,
  loading: false,

  loadActiveProgram: async (uid) => {
    set({ loading: true });
    try {
      const state = await getActiveProgramState(uid);
      set({ activeState: state });
    } catch {
      // offline: keep null
    } finally {
      set({ loading: false });
    }
  },

  activate: async (uid, programId) => {
    const state = await activateProgram(uid, programId);
    set({ activeState: state });
  },

  advanceDay: async (uid, completedDayId) => {
    const { activeState } = get();
    if (!activeState) return;
    const prog = PROGRAM_TEMPLATES.find((p) => p.id === activeState.programId);
    if (!prog) return;
    const updated = await advanceProgramDay(uid, activeState, prog.days.length, completedDayId);
    set({ activeState: updated });
  },

  deactivate: async (uid) => {
    await deactivateProgramInFirestore(uid);
    set({ activeState: null });
  },

  getActiveProgram: () => {
    const { activeState } = get();
    if (!activeState) return null;
    return PROGRAM_TEMPLATES.find((p) => p.id === activeState.programId) ?? null;
  },

  getTodayDay: () => {
    const { activeState } = get();
    if (!activeState) return null;
    const prog = PROGRAM_TEMPLATES.find((p) => p.id === activeState.programId);
    if (!prog) return null;
    return prog.days[activeState.currentDayIndex] ?? null;
  },
}));
