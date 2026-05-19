import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/userStore';
import { getRecentLogs } from '../../services/workoutService';
import { WorkoutLog } from '../../types/workout';
import { COLORS } from '../../constants/colors';

function StatCard({ label, value, unit, icon }: {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}{unit ? ` ${unit}` : ''}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { profile } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);

  const uid = profile?.uid;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getRecentLogs(uid, 30).then(setLogs).finally(() => setLoading(false));
  }, [uid]);

  const streak = profile?.streak?.current || 0;
  const longestStreak = profile?.streak?.longest || 0;
  const weeklyPct = profile?.weeklyStats
    ? Math.round((profile.weeklyStats.totalMinutes / profile.weeklyStats.targetMinutes) * 100)
    : 0;

  const totalMinutesMonth = logs.slice(0, 30).reduce((s, l) => s + l.totalDurationMinutes, 0);
  const totalCaloriesMonth = logs.slice(0, 30).reduce((s, l) => s + l.caloriesEstimate, 0);

  // Most frequent exercise
  const exerciseCounts: Record<string, number> = {};
  logs.forEach((log) => {
    log.exercises.forEach((e) => {
      exerciseCounts[e.name] = (exerciseCounts[e.name] || 0) + 1;
    });
  });
  const topExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Thống kê</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Streak section */}
          <Text style={styles.sectionTitle}>🔥 Streak</Text>
          <View style={styles.statsRow}>
            <StatCard label="Streak hiện tại" value={streak} unit="ngày" icon="🔥" />
            <StatCard label="Dài nhất" value={longestStreak} unit="ngày" icon="🏆" />
          </View>

          {/* Weekly */}
          <Text style={styles.sectionTitle}>📅 Tuần này</Text>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Tiến độ mục tiêu tuần</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(weeklyPct, 100)}%` }]} />
            </View>
            <Text style={styles.progressPct}>{weeklyPct}% · {profile?.weeklyStats?.totalMinutes || 0}/{profile?.weeklyStats?.targetMinutes || 150} phút</Text>
          </View>

          {/* Monthly */}
          <Text style={styles.sectionTitle}>📊 30 ngày qua</Text>
          <View style={styles.statsRow}>
            <StatCard label="Tổng thời gian" value={totalMinutesMonth} unit="phút" icon="⏱️" />
            <StatCard label="Calories" value={totalCaloriesMonth} unit="kcal" icon="🔥" />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Buổi tập" value={logs.length} unit="buổi" icon="💪" />
            <StatCard
              label="Bài tập yêu thích"
              value={topExercise ? topExercise[0] : '--'}
              icon="⭐"
            />
          </View>

          {/* Consistency score */}
          <View style={styles.consistencyCard}>
            <Text style={styles.consistencyTitle}>Điểm consistency</Text>
            <Text style={styles.consistencyScore}>
              {Math.min(100, Math.round((logs.length / 30) * 100))}
            </Text>
            <Text style={styles.consistencyMax}>/100</Text>
            <Text style={styles.consistencyHint}>
              Dựa trên số ngày tập trong 30 ngày qua
            </Text>
          </View>
        </ScrollView>
      )}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

  progressCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  progressLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressPct: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  consistencyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  consistencyTitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  consistencyScore: { fontSize: 72, fontWeight: '800', color: COLORS.primary },
  consistencyMax: { fontSize: 18, color: COLORS.textSecondary, marginTop: -8 },
  consistencyHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' },
});
