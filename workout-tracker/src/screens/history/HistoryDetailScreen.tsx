import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getLogById } from '../../services/workoutService';
import { WorkoutLog, ExerciseEntry } from '../../types/workout';
import { useWorkoutStore } from '../../stores/workoutStore';

type Route = RouteProp<RootStackParamList, 'LogDetail'>;

const INTENSITY_META = {
  light: { label: 'Nhẹ', color: '#4CAF50', emoji: '🟢' },
  moderate: { label: 'Vừa', color: '#FF9800', emoji: '🟡' },
  heavy: { label: 'Nặng', color: '#F44336', emoji: '🔴' },
};

function MetaChip({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function ExerciseCard({ exercise }: { exercise: ExerciseEntry }) {
  const { unit } = exercise;
  let detail = '';
  if (unit === 'reps') {
    detail = `${exercise.sets} hiệp × ${exercise.reps} reps`;
  } else if (unit === 'seconds') {
    const secs = exercise.durationSeconds || 0;
    detail = `${exercise.sets} hiệp × ${secs}s`;
  } else if (unit === 'minutes') {
    const mins = Math.round((exercise.durationSeconds || 0) / 60);
    detail = `${mins} phút`;
  } else {
    detail = `${exercise.sets} hiệp`;
  }

  const catColors: Record<string, string> = {
    strength: '#4A90E2',
    cardio: '#E24A4A',
    mobility: '#4AE28A',
    recovery: '#E2B44A',
  };
  const dotColor = catColors[exercise.category] || COLORS.primary;

  return (
    <View style={styles.exerciseCard}>
      <View style={[styles.catDot, { backgroundColor: dotColor }]} />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseDetail}>{detail}</Text>
      </View>
      {exercise.weight && (
        <Text style={styles.exerciseWeight}>{exercise.weight} kg</Text>
      )}
    </View>
  );
}

export default function HistoryDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { logId, date } = route.params;
  const { setDraftFromLog } = useWorkoutStore();

  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [loading, setLoading] = useState(true);

  const dateObj = new Date(date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  useEffect(() => {
    getLogById(logId)
      .then(setLog)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [logId]);

  const handleRepeat = () => {
    if (!log) return;
    Alert.alert(
      'Tập lại buổi này?',
      `${log.exercises.map((e) => e.name).join(', ')}`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Tập lại',
          onPress: () => {
            setDraftFromLog(log);
            navigation.navigate('WorkoutSummary');
          },
        },
      ]
    );
  };

  const intensity = log ? INTENSITY_META[log.intensity] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{dateStr}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : !log ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Không tìm thấy dữ liệu buổi tập này</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Meta row */}
          <View style={styles.metaRow}>
            <MetaChip icon="⏱️" value={`${log.totalDurationMinutes} phút`} />
            <MetaChip icon="🔥" value={`${log.caloriesEstimate} kcal`} />
            <MetaChip icon="💪" value={`${log.exercises.length} bài`} />
            {intensity && (
              <MetaChip icon={intensity.emoji} value={intensity.label} />
            )}
          </View>

          {/* Source tag */}
          {log.source === 'repeat_yesterday' && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>🔁 Lặp lại hôm qua</Text>
            </View>
          )}

          {/* Exercises */}
          <Text style={styles.sectionTitle}>Bài tập đã thực hiện</Text>
          {log.exercises.map((ex, i) => (
            <ExerciseCard key={i} exercise={ex} />
          ))}

          {/* Notes */}
          {log.notes ? (
            <>
              <Text style={styles.sectionTitle}>Ghi chú</Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{log.notes}</Text>
              </View>
            </>
          ) : null}

          {/* Repeat button */}
          <TouchableOpacity style={styles.repeatBtn} onPress={handleRepeat} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.repeatBtnText}>Tập lại buổi này 🔁</Text>
          </TouchableOpacity>

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
  backBtn: { padding: 4 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center' },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaIcon: { fontSize: 16 },
  metaValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  sourceBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sourceText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },

  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  exerciseDetail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  exerciseWeight: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  notesCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  notesText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },

  repeatBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  repeatBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' },
});
