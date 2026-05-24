import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getLogsForExercise } from '../../services/workoutService';
import { computePRs } from '../../services/prService';
import { useUserStore } from '../../stores/userStore';
import { WorkoutLog, ExerciseEntry } from '../../types/workout';

interface Session {
  date: string;
  entry: ExerciseEntry;
}

type Route = RouteProp<RootStackParamList, 'ExerciseProgress'>;

function formatDate(dateStr: string, format: 'short' | 'full' = 'short') {
  const d = new Date(dateStr + 'T00:00:00');
  if (format === 'full') {
    return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function ExerciseProgressScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { presetId, exerciseName } = route.params;
  const { profile } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    getLogsForExercise(profile.uid, presetId)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile?.uid, presetId]);

  const sessions: Session[] = logs
    .map((log: WorkoutLog) => ({ date: log.date, entry: log.exercises.find((e: ExerciseEntry) => e.presetId === presetId)! }))
    .filter((s: { date: string; entry: ExerciseEntry }) => !!s.entry);

  const prs = computePRs(logs);
  const pr = prs.find((p) => p.presetId === presetId);

  const isReps = sessions[0]?.entry.unit === 'reps';
  const isSeconds = sessions[0]?.entry.unit === 'seconds';
  const hasWeight = sessions.some((s: Session) => s.entry.weight);

  const chartSessions: Session[] = [...sessions].reverse().slice(-12);
  const chartValues = chartSessions.map((s: Session) => {
    if (hasWeight && s.entry.weight) return s.entry.weight;
    if (isReps) return s.entry.reps ?? 0;
    if (isSeconds) return s.entry.durationSeconds ?? 0;
    return Math.round((s.entry.durationSeconds ?? 0) / 60);
  });
  const maxVal = Math.max(1, ...chartValues);

  const chartLabel = hasWeight ? '📈 Tiến độ tạ (kg)' : isReps ? '📈 Tiến độ reps' : isSeconds ? '📈 Tiến độ (giây)' : '📈 Tiến độ (phút)';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{exerciseName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Chưa có dữ liệu cho bài tập này</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* PR card */}
          {pr && (
            <View style={styles.prCard}>
              <Text style={styles.prLabel}>🏆 Kỷ lục cá nhân</Text>
              <View style={styles.prChipRow}>
                {pr.bestWeight !== undefined && (
                  <View style={styles.prChip}>
                    <Text style={styles.prChipValue}>{pr.bestWeight}</Text>
                    <Text style={styles.prChipUnit}>kg</Text>
                  </View>
                )}
                {pr.bestReps !== undefined && (
                  <View style={styles.prChip}>
                    <Text style={styles.prChipValue}>{pr.bestReps}</Text>
                    <Text style={styles.prChipUnit}>reps</Text>
                  </View>
                )}
                {pr.bestDurationSeconds !== undefined && (
                  <View style={styles.prChip}>
                    <Text style={styles.prChipValue}>
                      {isSeconds ? pr.bestDurationSeconds : Math.round(pr.bestDurationSeconds / 60)}
                    </Text>
                    <Text style={styles.prChipUnit}>{isSeconds ? 'giây' : 'phút'}</Text>
                  </View>
                )}
                {pr.bestSets !== undefined && (
                  <View style={styles.prChip}>
                    <Text style={styles.prChipValue}>{pr.bestSets}</Text>
                    <Text style={styles.prChipUnit}>hiệp</Text>
                  </View>
                )}
              </View>
              <Text style={styles.prDate}>
                Đạt được: {formatDate(pr.achievedDate, 'full')}
              </Text>
            </View>
          )}

          {/* Overview stats */}
          <View style={styles.overviewRow}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{sessions.length}</Text>
              <Text style={styles.overviewLabel}>Lần đã tập</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{formatDate(sessions[0].date)}</Text>
              <Text style={styles.overviewLabel}>Gần nhất</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{formatDate(sessions[sessions.length - 1].date)}</Text>
              <Text style={styles.overviewLabel}>Lần đầu</Text>
            </View>
          </View>

          {/* Progress chart */}
          {chartSessions.length > 1 && (
            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>{chartLabel}</Text>
              <View style={styles.barChart}>
                {chartSessions.map((s: Session, i: number) => {
                  const val = chartValues[i];
                  const heightPct = val / maxVal;
                  return (
                    <View key={i} style={styles.barCol}>
                      {val > 0 && (
                        <Text style={styles.barTopVal}>
                          {Number.isInteger(val) ? val : val.toFixed(1)}
                        </Text>
                      )}
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: Math.max(4, heightPct * 80) },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{formatDate(s.date)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Session history */}
          <Text style={styles.sectionTitle}>📋 Lịch sử ({sessions.length} buổi)</Text>
          {sessions.map((s: Session, i: number) => {
            const { entry } = s;
            let detail = '';
            if (entry.unit === 'reps') {
              detail = `${entry.sets} × ${entry.reps} reps`;
              if (entry.weight) detail += ` · ${entry.weight} kg`;
            } else if (entry.unit === 'seconds') {
              detail = `${entry.sets} × ${entry.durationSeconds}s`;
            } else {
              detail = `${Math.round((entry.durationSeconds ?? 0) / 60)} phút`;
            }
            return (
              <View key={i} style={styles.sessionRow}>
                <Text style={styles.sessionDate}>{formatDate(s.date, 'full')}</Text>
                <Text style={styles.sessionDetail}>{detail}</Text>
              </View>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4, width: 40 },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  prCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  prLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  prChipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  prChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  prChipValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
  prChipUnit: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  prDate: { fontSize: 12, color: COLORS.primary + 'CC', fontWeight: '600' },

  overviewRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  overviewCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  overviewValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  overviewLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

  chartCard: {
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  barTopVal: { fontSize: 9, color: COLORS.primary, fontWeight: '700' },
  barTrack: { width: '70%', height: 80, justifyContent: 'flex-end' },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    opacity: 0.85,
  },
  barLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '600' },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionDate: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  sessionDetail: { fontSize: 14, fontWeight: '700', color: COLORS.text },
});
