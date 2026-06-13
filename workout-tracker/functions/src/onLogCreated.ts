import * as functions from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import { calculateStreak, StreakDoc } from './streakCalculator';

const db = admin.firestore();
const logger = functions.logger;

const GOOGLE_SHEETS_KEY = defineSecret('GOOGLE_SHEETS_KEY');

export const onWorkoutLogCreated = functions.firestore.onDocumentCreated(
  { document: 'logs/{logId}', secrets: [GOOGLE_SHEETS_KEY] },
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

    // 2. Sync to Google Sheets via direct API
    try {
      const userSnap = await db.doc(`users/${userId}`).get();
      const userData = userSnap.data() as { sheetsId?: string } | undefined;
      const sheetsId = userData?.sheetsId;

      if (!sheetsId) {
        logger.info('No Google Sheet ID configured, skipping sync');
        return;
      }

      const keyJson = GOOGLE_SHEETS_KEY.value();
      if (!keyJson) {
        logger.warn('GOOGLE_SHEETS_KEY secret not set, skipping sync');
        return;
      }

      const credentials = JSON.parse(keyJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const syncedAt = new Date().toISOString();

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetsId,
        range: 'Sheet1!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            date,
            (log.exercises as any[]).map((e) => e.name).join(', '),
            log.exercises.length,
            log.totalDurationMinutes,
            log.intensity || '',
            log.intensityScore,
            log.caloriesEstimate,
            log.source,
            event.params.logId,
            syncedAt,
          ]],
        },
      });

      await snap.ref.update({
        syncedToSheets: true,
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info('Google Sheets sync successful');
    } catch (err) {
      logger.error('Google Sheets sync failed', err);
    }
  }
);
