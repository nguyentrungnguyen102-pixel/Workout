// Notification scheduling disabled (v5.0.0) — no-op to prevent runtime errors
// on simulators and Expo Go environments.
// setNotificationHandler is configured in App.tsx for in-app notification display.

export async function scheduleWorkoutReminder(_time: string, _enabled: boolean): Promise<void> {
  // no-op
}

export async function cancelWorkoutReminders(): Promise<void> {
  // no-op
}
