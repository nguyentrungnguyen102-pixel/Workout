import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '../../stores/userStore';
import { getRecentLogs } from '../../services/workoutService';
import { computePRs, getPRLabel, PersonalRecord } from '../../services/prService';
import { WorkoutLog } from '../../types/workout';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatCard({ label, value, unit, icon }: {
  label: string; value: string | number; unit?: string; icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}{unit ? ` ${unit}` : ''}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function WeeklyBarChart({ logs }: { logs: WorkoutLog[] }) {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const today = new Date();
  const last7: { dateStr: string; dayLabel: string; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    last7.push({
      dateStr: `${y}-${m}-${day}`,
      dayLabel: days[d.getDay()],
      isToday: i === 0,
    });
  }

  const counts: Record<string, number> = {};
  for (const log of logs) {
    const d = log.date;
    if (last7.some((x) => x.dateStr === d)) {
      counts[d] = (counts[d] || 0) + 1;
    }
  }
  const maxCount = Math.max(1, ...Object.values(counts));

  return (
    <View style={styles.barChartCard}>
      <Text style={styles.sectionTitle}>📅 7 ngày gần đây</Text>
      <View style={styles.barChartRow}>
        {last7.map(({ dateStr, dayLabel, isToday }) => {
          const count = counts[dateStr] || 0;
          const heightPct = count / maxCount;
          const hasSession = count > 0;
          return (
            <View key={dateStr} style={styles.barCol}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: Math.max(4, heightPct * 60),
                      backgroundColor: hasSession
                        ? (isToday ? COLORS.primary : COLORS.heatmapModerate)
                        : COLORS.border,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barDayLabel, isToday && styles.barDayLabelToday]}>
                {dayLabel}
              </Text>
              {hasSession && (
                <Text style={styles.barCount}>{count}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PRCard({ pr, onPress }: { pr: PersonalRecord; onPress: () => void }) {
  const dateStr = pr.achievedDate
    ? new Date(pr.achievedDate + 'T00:00:00').toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity style={styles.prCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.prLeft}>
        <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
        <Text style={styles.prDate}>{dateStr}</Text>
      </View>
      <View style={styles.prRight}>
        <Text style={styles.prValue}>{getPRLabel(pr)}</Text>
        <Text style={styles.prBadge}>🏆 Xem tiến độ →</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function StatsScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, loadProfile } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllPRs, setShowAllPRs] = useState(false);

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

  const prs = computePRs(logs);
  const displayedPRs = showAllPRs ? prs : prs.slice(0, 4);

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

          {/* Weekly progress bar */}
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>🎯 Tiến độ mục tiêu tuần</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(weeklyPct, 100)}%` as any }]} />
            </View>
            <Text style={styles.progressPct}>
              {weeklyPct}% · {profile?.weeklyStats?.totalMinutes || 0}/{targetMinutes} phút
            </Text>
          </View>

          {/* Weekly bar chart */}
          <WeeklyBarChart logs={logs} />

          {/* Monthly stats */}
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

          {/* Personal Records */}
          {prs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🏆 Kỷ lục cá nhân (PR)</Text>
              {displayedPRs.map((pr) => (
                <PRCard
                  key={pr.presetId}
                  pr={pr}
                  onPress={() => navigation.navigate('ExerciseProgress', {
                    presetId: pr.presetId,
                    exerciseName: pr.name,
                  })}
                />
              ))}
              {prs.length > 4 && (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={() => setShowAllPRs((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showMoreText}>
                    {showAllPRs ? 'Thu gọn ↑' : `Xem thêm ${prs.length - 4} PR ↓`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
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

  streakHero: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 12,
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

  barChartCard: {
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
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
    paddingTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barWrapper: {
    width: '70%',
    height: 64,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barDayLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  barDayLabelToday: { color: COLORS.primary, fontWeight: '800' },
  barCount: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '700',
    position: 'absolute',
    top: 0,
  },

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

  prCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  prLeft: { flex: 1 },
  prName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  prDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  prRight: { alignItems: 'flex-end', gap: 4 },
  prValue: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  prBadge: { fontSize: 11, color: COLORS.textSecondary },

  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  showMoreText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

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
});
