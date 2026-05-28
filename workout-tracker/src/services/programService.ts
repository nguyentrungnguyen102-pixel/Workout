import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ActiveProgramState } from '../types/program';
import { todayString } from '../lib/date';

export async function getActiveProgramState(uid: string): Promise<ActiveProgramState | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return data.activeProgram ?? null;
}

export async function activateProgram(uid: string, programId: string): Promise<ActiveProgramState> {
  const state: ActiveProgramState = {
    programId,
    startedAt: todayString(),
    currentDayIndex: 0,
    completedDates: [],
  };
  await updateDoc(doc(db, 'users', uid), { activeProgram: state });
  return state;
}

export async function advanceProgramDay(
  uid: string,
  currentState: ActiveProgramState,
  totalDays: number,
): Promise<ActiveProgramState> {
  const today = todayString();
  const completedDates = currentState.completedDates.includes(today)
    ? currentState.completedDates
    : [...currentState.completedDates, today];
  const nextIndex = (currentState.currentDayIndex + 1) % totalDays;
  const updated: ActiveProgramState = { ...currentState, currentDayIndex: nextIndex, completedDates };
  await updateDoc(doc(db, 'users', uid), { activeProgram: updated });
  return updated;
}

export async function deactivateProgramInFirestore(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { activeProgram: null });
}
