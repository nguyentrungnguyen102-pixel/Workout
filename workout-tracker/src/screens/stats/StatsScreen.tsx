import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
  const { profile, loadProfile } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);

  const uid = profile?.uid;

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      loadProfile(uid).catch(() => {});
      getRecentLogs(uid, 30).then(setLogs).catch(() => {}).finally(() => setLoading(false));
    }, [uid])
  );

  const streak = profile?.streak?.current || 0;
  const longestStreak = profile?.streak?.longest || 0;
  const targetMinutes = profile?.weeklyStats?.targetMinutes || profile?.weeklyGoalMinutes || 150;
  const weeklyPct = profile?.weeklyStats?.totalMinutes
    ? Math.min(100, Math.round((profile.weeklyStats.totalMinutes / targetMinutes) * 100))
    : 0;

  const totalMinutesMonth = logs.reduce((s, l) => s + l.totalDurationMinutes, 0);
  const totalCaloriesMonth = logs.reduce((s, l) => s + l.caloriesEstimate, 0);

  const exerciseCounts: Record<string, number> = {};
  logs.forEach((log) => {
    log.exercises.forEach((e) => {
      exerciseCounts[e.name] = (exerciseCounts[e.name] || 0) + 1;
    });
  });
  const topExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0];
  const consistencyScore = Math.min(100, Math.round((logs.length / 30) * 100));

  // Compute personal records from 30-day logs
  const personalRecords = useMemo(() => {
    const prs: Record<string, { name: string; bestReps?: number; bestWeight?: number; bestDuration?: number }> = {};
    logs.forEach((log) => {
      log.exercises.forEach((e) => {
        if (!prs[e.presetId]) prs[e.presetId] = { name: e.name };
        const pr = prs[e.presetId];
        if (e.reps && (!pr.bestReps || e.reps > pr.bestReps)) pr.bestReps = e.reps;
        if (e.weight && (!pr.bestWeight || e.weight > pr.bestWeight)) pr.bestWeight = e.weight;
        if (e.durationSeconds && (!pr.bestDuration || e.durationSeconds > pr.bestDuration)) pr.bestDuration = e.durationSeconds;
      });
    });
    return Object.entries(prs)
      .filter(([, pr]) => pr.bestReps || pr.bestWeight || pr.bestDuration)
      .slice(0, 6);
  }, [logs]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Thống kê</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Streak Hero Card */}
          <View style={styles.streakHero}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakLabel}>ngày liên tiếp</Text>
            </View>
            <View style={styles.streakRight}>
              <View style={styles.streakStat}>
                <Text style={styles.streakStatValue}>{logs.length}</Text>
                <Text style={styles.streakStatLabel}>buổi / tháng</Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakStat}>
                <Text style={styles.streakStatValue}>{totalCaloriesMonth}</Text>
                <Text style={styles.streakStatLabel}>kcal</Text>
              </View>
            </View>
          </View>

          {/* Weekly */}
          <Text style={styles.sectionTitle}>📅 Tuần này</Text>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Tiến độ mục tiêu tuần</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(weeklyPct, 100)}%` as any }]} />
            </View>
            <Text style={styles.progressPct}>
              {weeklyPct}% · {profile?.weeklyStats?.totalMinutes || 0}/{targetMinutes} phút
            </Text>
          </View>

          {/* Monthly */}
          <Text style={styles.sectionTitle}>📊 30 ngày qua</Text>
          <View style={styles.statsRow}>
            <StatCard label="Tổng thời gian" value={totalMinutesMonth} unit="phút" icon="⏱️" />
            <StatCard label="Calo" value={totalCaloriesMonth} unit="kcal" icon="🔥" />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Buổi tập" value={logs.length} unit="buổi" icon="💪" />
            <StatCard label="Dài nhất" value={longestStreak} unit="ngày" icon="🏆" />
          </View>
          {topExercise && (
            <View style={styles.topExerciseCard}>
              <Text style={styles.topExerciseLabel}>Bài tập yêu thích</Text>
              <Text style={styles.topExerciseName}>{topExercise[0]}</Text>
              <Text style={styles.topExerciseCount}>{topExercise[1]} lần trong 30 ngày</Text>
            </View>
          )}

          {/* Consistency score */}
          <View style={styles.consistencyCard}>
            <Text style={styles.consistencyTitle}>Điểm consistency</Text>
            <Text style={styles.consistencyScore}>{consistencyScore}</Text>
            <Text style={styles.consistencyMax}>/100</Text>
            <View style={styles.consistencyBar}>
              <View style={[styles.consistencyFill, { width: `${consistencyScore}%` as any }]} />
            </View>
            <Text style={styles.consistencyHint}>Dựa trên số ngày tập trong 30 ngày qua</Text>
          </View>

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🏆 Kỷ lục cá nhân (30 ngày)</Text>
              {personalRecords.map(([id, pr]) => (
                <View key={id} style={styles.prCard}>
                  <Text style={styles.prName}>{pr.name}</Text>
                  <View style={styles.prBadges}>
                    {pr.bestReps !== undefined && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prBadgeText}>{pr.bestReps} reps</Text>
                      </View>
                    )}
                    {pr.bestWeight !== undefined && (
                      <View style={[styles.prBadge, styles.prBadgeWeight]}>
                        <Text style={[styles.prBadgeText, styles.prBadgeWeightText]}>{pr.bestWeight} kg</Text>
                      </View>
                    )}
                    {pr.bestDuration !== undefined && pr.bestReps === undefined && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prBadgeText}>
                          {pr.bestDuration >= 60
                            ? `${Math.round(pr.bestDuration / 60)} phút`
                            : `${pr.bestDuration}s`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
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

  // Streak Hero
  streakHero: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.33,
    shadowRadius: 10,
    elevation: 6,
  },
  streakLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  streakNumber: { fontSize: 56, fontWeight: '900', color: '#fff', lineHeight: 60 },
  streakFire: { fontSize: 32, marginBottom: 4 },
  streakLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 6, alignSelf: 'flex-end' },
  streakRight: { alignItems: 'center', gap: 12 },
  streakStat: { alignItems: 'center' },
  streakStatValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  streakStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  streakDivider: { width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

  progressCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
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

  topExerciseCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  topExerciseLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  topExerciseName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  topExerciseCount: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

  consistencyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  consistencyTitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  consistencyScore: { fontSize: 72, fontWeight: '900', color: COLORS.primary },
  consistencyMax: { fontSize: 18, color: COLORS.textSecondary, marginTop: -8, marginBottom: 16 },
  consistencyBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  consistencyFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  consistencyHint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },

  prCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  prName: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  prBadges: { flexDirection: 'row', gap: 6 },
  prBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  prBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  prBadgeWeight: { backgroundColor: '#EFF6FF', borderColor: '#2563EB33' },
  prBadgeWeightText: { color: '#2563EB' },
});
