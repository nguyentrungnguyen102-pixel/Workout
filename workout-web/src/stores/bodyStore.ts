import { create } from 'zustand';
import { BodyMetric } from '../types/body';
import { addBodyMetric, getBodyMetrics, getLatestBodyMetric } from '../services/bodyService';

interface BodyStore {
  metrics: BodyMetric[];
  latestMetric: BodyMetric | null;
  loading: boolean;

  loadMetrics: (uid: string) => Promise<void>;
  addMetric: (uid: string, data: Omit<BodyMetric, 'id' | 'userId' | 'date' | 'createdAt'>) => Promise<void>;
  resetAll: () => void;
}

export const useBodyStore = create<BodyStore>((set, get) => ({
  metrics: [],
  latestMetric: null,
  loading: false,

  resetAll: () => set({ metrics: [], latestMetric: null, loading: false }),

  loadMetrics: async (uid) => {
    set({ loading: true });
    try {
      const [metrics, latest] = await Promise.all([
        getBodyMetrics(uid, 30),
        getLatestBodyMetric(uid),
      ]);
      set({ metrics, latestMetric: latest });
    } catch {
      // Firestore unavailable — keep empty state
    } finally {
      set({ loading: false });
    }
  },

  addMetric: async (uid, data) => {
    await addBodyMetric(uid, data);
    await get().loadMetrics(uid);
  },
}));
