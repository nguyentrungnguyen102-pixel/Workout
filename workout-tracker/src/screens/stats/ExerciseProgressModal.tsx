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
import { RootStackParamList } from '../../navigation/types';
import { getExerciseHistory, ExerciseDataPoint } from '../../services/workoutService';
import { useUserStore } from '../../stores/userStore';
import { COLORS } from '../../constants/colors';

type Route = RouteProp<RootStackParamList, 'ExerciseProgress'>;

function BarChart({ points, label, getValue }: {
  points: ExerciseDataPoint[];
  label: string;
  getValue: (p: ExerciseDataPoint) => number;
}) {
  const values = points.map(getValue);
  const maxVal = Math.max(1, ...values);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{label}</Text>
      <View style={styles.barRow}>
        {points.map((p, i) => {
          const pct = values[i] / maxVal;
          const barH = Math.max(4, Math.round(pct * 64));
          const isLast = i === points.length - 1;
          const dateLabel = new Date(p.date + 'T00:00:00').toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit',
          });
          return (
            <View key={i} style={styles.barCol}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barH,
                      backgroundColor: isLast ? COLORS.primary : COLORS.heatmapLight,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, isLast && styles.barLabelLast]}>
                {values[i]}
              </Text>
              {(i === 0 || isLast || i === Math.floor(points.length / 2)) && (
                <Text style={styles.barDate}>{dateLabel}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ExerciseProgressModal() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { presetId, name } = route.params;
  const { profile } = useUserStore();
  const [points, setPoints] = useState<ExerciseDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    getExerciseHistory(profile.uid, presetId, 20)
      .then(setPoints)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile?.uid, presetId]);

  const hasReps = points.some((p) => p.reps !== undefined);
  const hasWeight = points.some((p) => (p.weight ?? 0) > 0);
  const hasDuration = points.some((p) => p.durationSeconds !== undefined);

  const totalSets = points.reduce((s, p) => s + p.sets, 0);
  const bestReps = hasReps ? Math.max(...points.map((p) => (p.reps ?? 0) * p.sets)) : 0;
  const bestWeight = hasWeight ? Math.max(...points.map((p) => p.weight ?? 0)) : 0;
  const bestDuration = hasDuration
    ? Math.max(...points.map((p) => (p.durationSeconds ?? 0) * p.sets))
    : 0;
  const avgSets =
    points.length > 0
      ? (totalSets / points.length).toFixed(1)
      : '0';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{name}</Text>
        <View style={{ width: 80 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : points.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>Chưa có dữ liệu cho bài tập này</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{points.length}</Text>
              <Text style={styles.statLbl}>buổi tập</Text>
            </View>
            {hasReps && (
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{bestReps}</Text>
                <Text style={styles.statLbl}>reps tốt nhất</Text>
              </View>
            )}
            {hasWeight && (
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{bestWeight} kg</Text>
                <Text style={styles.statLbl}>tạ tốt nhất</Text>
              </View>
            )}
            {hasDuration && !hasReps && (
              <View style={styles.statCard}>
                <Text style={styles.statVal}>{Math.round(bestDuration / 60)} phút</Text>
                <Text style={styles.statLbl}>thời gian nhất</Text>
              </View>
            )}
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{avgSets}</Text>
              <Text style={styles.statLbl}>sets tb</Text>
            </View>
          </View>

          {/* Bar charts — only shown when enough sessions */}
          {points.length >= 2 && hasReps && (
            <BarChart
              points={points}
              label="📈 Tổng reps theo buổi"
              getValue={(p) => (p.reps ?? 0) * p.sets}
            />
          )}
          {points.length >= 2 && hasWeight && (
            <BarChart
              points={points}
              label="🏋️ Tạ (kg) theo buổi"
              getValue={(p) => p.weight ?? 0}
            />
          )}
          {points.length >= 2 && hasDuration && !hasReps && (
            <BarChart
              points={points}
              label="⏱ Thời gian (giây) theo buổi"
              getValue={(p) => (p.durationSeconds ?? 0) * p.sets}
            />
          )}

          {/* Session list */}
          <Text style={styles.sectionTitle}>Lịch sử từng buổi</Text>
          {[...points].reverse().map((p, i) => {
            const dateLabel = new Date(p.date + 'T00:00:00').toLocaleDateString('vi-VN', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
            });
            const detail = hasReps
              ? `${p.sets} sets × ${p.reps} reps${(p.weight ?? 0) > 0 ? ` · ${p.weight} kg` : ''}`
              : hasDuration
              ? `${p.sets} sets × ${Math.round((p.durationSeconds ?? 0) / 60)} phút`
              : `${p.sets} sets`;

            return (
              <View key={i} style={styles.sessionCard}>
                <Text style={styles.sessionDate}>{dateLabel}</Text>
                <Text style={styles.sessionDetail}>{detail}</Text>
              </View>
            );
          })}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 80 },
  backText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  statCard: {
    flex: 1,
    minWidth: 72,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  statLbl: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

  chartCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingTop: 4,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 2 },
  barWrapper: {
    width: '70%',
    height: 64,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  barLabelLast: { color: COLORS.primary, fontWeight: '800' },
  barDate: {
    fontSize: 8,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 4,
  },
  sessionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionDate: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  sessionDetail: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
});
