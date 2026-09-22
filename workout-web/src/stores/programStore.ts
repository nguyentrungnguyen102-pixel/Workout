import { create } from 'zustand';
import { ActiveProgramState, WorkoutProgram } from '../types/program';
import { PROGRAM_TEMPLATES } from '../constants/programTemplates';
import { findProgramById } from '../lib/customProgram';
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
  // customPrograms defaults to [] so callers with only PROGRAM_TEMPLATES
  // (nothing user-built yet) don't have to pass anything.
  advanceDay: (uid: string, customPrograms?: WorkoutProgram[]) => Promise<void>;
  deactivate: (uid: string) => Promise<void>;

  getActiveProgram: (customPrograms?: WorkoutProgram[]) => WorkoutProgram | null;
  getTodayDay: (customPrograms?: WorkoutProgram[]) => WorkoutProgram['days'][0] | null;
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

  advanceDay: async (uid, customPrograms = []) => {
    const { activeState } = get();
    if (!activeState) return;
    const prog = findProgramById(activeState.programId, PROGRAM_TEMPLATES, customPrograms);
    if (!prog) return;
    const updated = await advanceProgramDay(uid, activeState, prog.days.length);
    set({ activeState: updated });
  },

  deactivate: async (uid) => {
    await deactivateProgramInFirestore(uid);
    set({ activeState: null });
  },

  getActiveProgram: (customPrograms = []) => {
    const { activeState } = get();
    if (!activeState) return null;
    return findProgramById(activeState.programId, PROGRAM_TEMPLATES, customPrograms);
  },

  getTodayDay: (customPrograms = []) => {
    const { activeState } = get();
    if (!activeState) return null;
    const prog = findProgramById(activeState.programId, PROGRAM_TEMPLATES, customPrograms);
    if (!prog) return null;
    return prog.days[activeState.currentDayIndex] ?? null;
  },
}));
