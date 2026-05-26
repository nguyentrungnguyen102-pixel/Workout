// Notifications are disabled — stubs kept for future re-enable

export async function scheduleWorkoutReminder(_time: string, _enabled: boolean): Promise<void> {
  // no-op: notification scheduling not supported in Expo Go / web preview
}

export async function cancelWorkoutReminders(): Promise<void> {
  // no-op
}
