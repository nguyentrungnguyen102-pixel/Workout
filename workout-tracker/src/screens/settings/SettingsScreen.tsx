import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
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
  const [weeklyGoal, setWeeklyGoal] = useState(String(profile?.weeklyGoalMinutes || 150));
  const [sheetsId, setSheetsId] = useState(profile?.sheetsId || '');

  const handleSave = async () => {
    if (!profile?.uid) return;
    await updateProfile(profile.uid, {
      weeklyGoalMinutes: parseInt(weeklyGoal) || 150,
      sheetsId: sheetsId.trim() || undefined,
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User info */}
        <View style={styles.profileCard}>
          <Text style={styles.profileAvatar}>👤</Text>
          <Text style={styles.profileName}>{profile?.displayName || 'User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          {profile?.streak?.current ? (
            <View style={styles.profileStreak}>
              <Text style={styles.profileStreakText}>🔥 {profile.streak.current} ngày streak</Text>
            </View>
          ) : null}
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

        {/* Integration */}
        <Text style={styles.sectionLabel}>🔗 Tích hợp Google Sheets</Text>
        <View style={styles.card}>
          <Text style={styles.webhookHint}>
            Nhập Google Sheet ID để tự động ghi dữ liệu sau mỗi buổi tập. Lấy ID từ URL của Sheet: docs.google.com/spreadsheets/d/[ID]/edit
          </Text>
          <TextInput
            style={[styles.timeInput, styles.webhookInput]}
            value={sheetsId}
            onChangeText={setSheetsId}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />
        </View>

        {/* Version info */}
        <View style={styles.versionCard}>
          <Text style={styles.versionText}>Workout Tracker v5.0.0</Text>
          <Text style={styles.versionSub}>Phase 5 · Tạ đơn tại nhà</Text>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Lưu cài đặt</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
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
  profileAvatar: { fontSize: 40, marginBottom: 10 },
  profileName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  profileStreak: {
    marginTop: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  profileStreakText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

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

  webhookHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  webhookInput: {
    minWidth: undefined,
    width: '100%',
    textAlign: 'left',
    fontWeight: '400',
    fontSize: 13,
    marginBottom: 14,
  },

  versionCard: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  versionText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  versionSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  signOutBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: COLORS.danger },
});
