import React, { useState } from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useUserStore } from '../../stores/userStore';
import { COLORS } from '../../constants/colors';

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { profile, updateProfile } = useUserStore();
  const [reminderEnabled, setReminderEnabled] = useState(profile?.reminderEnabled ?? true);
  const [reminderTime, setReminderTime] = useState(profile?.reminderTime || '07:30');
  const [weeklyGoal, setWeeklyGoal] = useState(String(profile?.weeklyGoalMinutes || 150));

  const handleSave = async () => {
    if (!profile?.uid) return;
    await updateProfile(profile.uid, {
      reminderEnabled,
      reminderTime,
      weeklyGoalMinutes: parseInt(weeklyGoal) || 150,
    });
    Alert.alert('Đã lưu', 'Cài đặt đã được cập nhật');
  };

  const handleSignOut = () => {
    Alert.alert('Đăng xuất?', '', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Cài đặt</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User info */}
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{profile?.displayName || 'User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>🔔 Nhắc nhở</Text>
        <View style={styles.card}>
          <SettingRow label="Bật nhắc nhở">
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
              thumbColor="#fff"
            />
          </SettingRow>
          {reminderEnabled && (
            <SettingRow label="Giờ nhắc (HH:MM)">
              <TextInput
                style={styles.timeInput}
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="07:30"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numbers-and-punctuation"
              />
            </SettingRow>
          )}
        </View>

        {/* Goals */}
        <Text style={styles.sectionLabel}>🎯 Mục tiêu</Text>
        <View style={styles.card}>
          <SettingRow label="Mục tiêu tuần (phút)">
            <TextInput
              style={styles.timeInput}
              value={weeklyGoal}
              onChangeText={setWeeklyGoal}
              keyboardType="numeric"
              placeholder="150"
              placeholderTextColor={COLORS.textSecondary}
            />
          </SettingRow>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Lưu cài đặt</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  content: { paddingHorizontal: 20, paddingBottom: 32 },

  profileCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  profileName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { fontSize: 15, color: COLORS.text, flex: 1 },
  timeInput: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 80,
    textAlign: 'center',
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },

  signOutBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: COLORS.danger },
});
