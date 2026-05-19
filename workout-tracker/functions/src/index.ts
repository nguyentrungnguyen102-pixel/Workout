import * as admin from 'firebase-admin';

admin.initializeApp();

export { onWorkoutLogCreated } from './onLogCreated';
export { sendSmartReminders } from './sendSmartReminders';
