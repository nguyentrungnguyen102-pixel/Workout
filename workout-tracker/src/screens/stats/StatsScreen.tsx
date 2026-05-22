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
import { useFocusEffect } from '@react-navigation/native';
import { useUserStore } from '../../stores/userStore';
import { useProgramStore } from '../../stores/programStore';
import { getRecentLogs } from '../../services/workoutService';
import { computePRs, getPRLabel, PersonalRecord } from '../../services/prService';
import { WorkoutLog } from '../../types/workout';
import { COLORS } from '../../constants/colors';

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

function VolumeChart({ logs }: { logs: WorkoutLog[] }) {
  const weeks: { label: string; volume: number }[] = [];
  const today = new Date();

  for (let w = 3; w >= 0; w--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const startStr = fmt(weekStart);
    const endStr = fmt(weekEnd);

    let vol = 0;
    for (const log of logs) {
      if (log.date >= startStr && log.date <= endStr) {
        for (const ex of log.exercises) {
          if (ex.unit === 'reps') {
            vol += (ex.sets ?? 1) * (ex.reps ?? 0);
          } else {
            vol += Math.round((ex.durationSeconds ?? 0) / 60);
          }
        }
      }
    }

    const label = w === 0 ? 'Tuần này' : `T-${w}`;
    weeks.push({ label, volume: vol });
  }

  const maxVol = Math.max(1, ...weeks.map((w) => w.volume));

  return (
    <View style={volStyles.card}>
      <Text style={styles.sectionTitle}>📈 Volume tập luyện (4 tuần)</Text>
      <View style={volStyles.chartRow}>
        {weeks.map((week, i) => {
          const pct = week.volume / maxVol;
          const isLast = i === weeks.length - 1;
          return (
            <View key={i} style={volStyles.col}>
              <Text style={volStyles.volNum}>
                {week.volume > 0 ? (week.volume >= 1000 ? `${(week.volume / 1000).toFixed(1)}k` : String(week.volume)) : '–'}
              </Text>
              <View style={volStyles.barWrapper}>
                <View
                  style={[
                    volStyles.barFill,
                    {
                      height: Math.max(4, pct * 80),
                      backgroundColor: isLast ? COLORS.primary : COLORS.heatmapModerate,
                    },
                  ]}
                />
              </View>
              <Text style={[volStyles.weekLabel, isLast && volStyles.weekLabelActive]}>{week.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={volStyles.hint}>Tổng reps + phút tập mỗi tuần</Text>
    </View>
  );
}

function PRCard({ pr }: { pr: PersonalRecord }) {
  const dateStr = pr.achievedDate
    ? new Date(pr.achievedDate + 'T00:00:00').toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit',
      })
    : '';

  return (
    <View style={styles.prCard}>
      <View style={styles.prLeft}>
        <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
        <Text style={styles.prDate}>{dateStr}</Text>
      </View>
      <View style={styles.prRight}>
        <Text style={styles.prValue}>{getPRLabel(pr)}</Text>
        <Text style={styles.prBadge}>🏆 PR</Text>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { profile, loadProfile } = useUserStore();
  const { activeState, loadActiveProgram, getActiveProgram } = useProgramStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllPRs, setShowAllPRs] = useState(false);

  const uid = profile?.uid;

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      loadProfile(uid).catch(() => {});
      loadActiveProgram(uid).catch(() => {});
      getRecentLogs(uid, 60).then(setLogs).catch(() => {}).finally(() => setLoading(false));
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

  const activeProg = getActiveProgram();
  const programAdherence = activeProg && activeState
    ? Math.min(100, Math.round((activeState.completedDates.length / Math.max(1, activeProg.daysPerWeek * 4)) * 100))
    : 0;

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

          {/* Volume chart */}
          <VolumeChart logs={logs} />

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
                <PRCard key={pr.presetId} pr={pr} />
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

          {/* Active program adherence */}
          {activeProg && activeState && (
            <View style={styles.programAdherenceCard}>
              <View style={styles.progAdherenceHeader}>
                <Text style={styles.progEmoji}>{activeProg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.progAdherenceLabel}>Chương trình đang theo</Text>
                  <Text style={styles.progAdherenceName}>{activeProg.nameVi}</Text>
                </View>
                <Text style={styles.progAdherencePct}>{programAdherence}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${programAdherence}%` as any }]} />
              </View>
              <Text style={styles.progAdherenceHint}>
                {activeState.completedDates.length} buổi · bắt đầu{' '}
                {new Date(activeState.startedAt + 'T00:00:00').toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit',
                })}
              </Text>
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

  programAdherenceCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  progAdherenceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progEmoji: { fontSize: 28 },
  progAdherenceLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  progAdherenceName: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  progAdherencePct: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  progAdherenceHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
});

const volStyles = StyleSheet.create({
  card: {
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
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: 8,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  volNum: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 2 },
  barWrapper: { width: '60%', height: 84, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 5, minHeight: 4 },
  weekLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  weekLabelActive: { color: COLORS.primary, fontWeight: '800' },
  hint: { fontSize: 11, color: COLORS.textMuted, marginTop: 8, textAlign: 'center' },
});
