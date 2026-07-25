import { Timestamp } from 'firebase/firestore';

export interface BodyMetric {
  id: string;
  userId: string;
  date: string;
  weight?: number;
  chestCm?: number;
  hipCm?: number;
  armCm?: number;
  waistCm?: number;
  neckCm?: number;
  notes?: string;
  createdAt?: Timestamp;
}
