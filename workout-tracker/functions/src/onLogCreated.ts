import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import { calculateStreak, StreakDoc } from './streakCalculator';

const db = admin.firestore();
const logger = functions.logger;

export const onWorkoutLogCreated = functions.firestore.onDocumentCreated(
  'logs/{logId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const log = snap.data() as {
      userId: string;
      date: string;
      exercises: unknown[];
      totalDurationMinutes: number;
      intensity: string;
      intensityScore: number;
      caloriesEstimate: number;
      source: string;
    };

    const { userId, date } = log;

    // 1. Update streak
    try {
      const streakRef = db.doc(`streaks/${userId}`);
      const streakSnap = await streakRef.get();
      const existing = streakSnap.exists ? (streakSnap.data() as StreakDoc) : null;
      const updated = calculateStreak(existing, date);

      await streakRef.set(
        { ...updated, uid: userId, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      logger.info(`Streak updated for ${userId}: ${updated.currentStreak} days`);
    } catch (err) {
      logger.error('Streak update failed', err);
    }

    // 2. Sync to Google Sheets via n8n webhook
    try {
      const userSnap = await db.doc(`users/${userId}`).get();
      const user = userSnap.data() as { n8nWebhookUrl?: string } | undefined;
      const webhookUrl = user?.n8nWebhookUrl || process.env.N8N_WEBHOOK_URL;

      if (!webhookUrl) {
        logger.info('No webhook URL configured, skipping sync');
        return;
      }

      const payload = {
        logId: event.params.logId,
        userId,
        date,
        exercises: (log.exercises as any[]).map((e) => e.name).join(', '),
        exerciseCount: log.exercises.length,
        totalDurationMinutes: log.totalDurationMinutes,
        intensity: log.intensity,
        intensityScore: log.intensityScore,
        caloriesEstimate: log.caloriesEstimate,
        source: log.source,
        syncedAt: new Date().toISOString(),
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Webhook returned ${res.status}`);
      }

      await snap.ref.update({
        syncedToSheets: true,
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info('Webhook sync successful');
    } catch (err) {
      logger.error('Webhook sync failed', err);
    }
  }
);
