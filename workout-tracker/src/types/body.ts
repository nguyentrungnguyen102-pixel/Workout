import { Timestamp } from 'firebase/firestore';

export interface BodyMetric {
  id: string;
  userId: string;
  date: string;
  weight?: number;
  bodyFatPercent?: number;
  waistCm?: number;
  notes?: string;
  createdAt?: Timestamp;
}
