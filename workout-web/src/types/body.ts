import { Timestamp } from 'firebase/firestore';

export interface BodyMetric {
  id: string;
  userId: string;
  date: string;
  weight?: number;
  heightCm?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  armCm?: number;
  notes?: string;
  createdAt?: Timestamp;
}
