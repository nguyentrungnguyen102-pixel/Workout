import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useUserStore } from '../../stores/userStore';
import { COLORS } from '../../constants/colors';
import { Intensity } from '../../types/workout';

const REST_PRESETS = [30, 60, 90];

function RestTimer() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (secs: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(secs);
    setActive(true);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
  };

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  if (active) {
    return (
      <View style={timerStyles.activeCard}>
        <View style={timerStyles.countdownRow}>
          <Text style={timerStyles.countdown}>{seconds}</Text>
          <Text style={timerStyles.countdownUnit}>giây</Text>
        </View>
        <Text style={timerStyles.restLabel}>Đang nghỉ giữa hiệp...</Text>
        <TouchableOpacity onPress={stop} style={timerStyles.skipBtn} activeOpacity={0.7}>
          <Text style={timerStyles.skipText}>Bỏ qua ⏭</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={timerStyles.card}>
      <Text style={timerStyles.label}>⏱ Nghỉ giữa hiệp</Text>
      <View style={timerStyles.presets}>
        {REST_PRESETS.map((s) => (
          <TouchableOpacity
            key={s}
            style={timerStyles.presetBtn}
            onPress={() => start(s)}
            activeOpacity={0.7}
          >
            <Text style={timerStyles.presetText}>{s}s</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const INTENSITY_OPTIONS: { label: string; value: Intensity; color: string; emoji: string }[] = [
  { label: 'Nhẹ',  value: 'light',    color: COLORS.success,  emoji: '🟢' },
  { label: 'Vừa',  value: 'moderate', color: '#FF9800',        emoji: '🟡' },
  { label: 'Nặng', value: 'heavy',    color: COLORS.danger,   emoji: '🔴' },
];

function getStep(unit: string) {
  if (unit === 'seconds') return 15;
  if (unit === 'minutes') return 5;
  return 5; // reps
}

function ExerciseRow({
  exercise,
  onRemove,
  onUpdate,
}: {
  exercise: any;
  onRemove: () => void;
  onUpdate: (updates: Partial<any>) => void;
}) {
  const unit = exercise.unit;
  const step = getStep(unit);

  const currentValue =
    unit === 'reps'
      ? exercise.reps ?? 0
      : Math.round((exercise.durationSeconds ?? 0) / (unit === 'minutes' ? 60 : 1));

  const displayUnit =
    unit === 'reps' ? 'lần' : unit === 'seconds' ? 'giây' : 'phút';

  const handleDecrement = () => {
    const next = Math.max(step, currentValue - step);
    if (unit === 'reps') {
      onUpdate({ reps: next });
    } else {
      onUpdate({ durationSeconds: next * (unit === 'minutes' ? 60 : 1) });
    }
  };

  const handleIncrement = () => {
    const next = currentValue + step;
    if (unit === 'reps') {
      onUpdate({ reps: next });
    } else {
      onUpdate({ durationSeconds: next * (unit === 'minutes' ? 60 : 1) });
    }
  };

  const handleTextChange = (text: string) => {
    const num = parseInt(text, 10);
    if (isNaN(num) || num <= 0) return;
    if (unit === 'reps') {
      onUpdate({ reps: num });
    } else {
      onUpdate({ durationSeconds: num * (unit === 'minutes' ? 60 : 1) });
    }
  };

  const handleSetsChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) onUpdate({ sets: num });
  };

  const handleWeightChange = (text: string) => {
    const num = parseFloat(text);
    if (isNaN(num) || num < 0) return;
    onUpdate({ weight: num || undefined });
  };

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseTop}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseControls}>
        {/* Sets (only for non-duration exercises) */}
        {unit === 'reps' && (
          <View style={styles.setsControl}>
            <Text style={styles.controlLabel}>Hiệp</Text>
            <TextInput
              style={styles.setsInput}
              value={String(exercise.sets ?? 3)}
              onChangeText={handleSetsChange}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          </View>
        )}

        {/* Stepper */}
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={handleDecrement} activeOpacity={0.7}>
            <Ionicons name="remove" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.stepValue}
            value={String(currentValue)}
            onChangeText={handleTextChange}
            keyboardType="number-pad"
            selectTextOnFocus
          />
          <Text style={styles.stepUnit}>{displayUnit}</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={handleIncrement} activeOpacity={0.7}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weight input — strength exercises only */}
      {unit === 'reps' && (
        <View style={styles.weightRow}>
          <Text style={styles.weightLabel}>🏋️ Tạ (kg)</Text>
          <TextInput
            style={styles.weightInput}
            value={exercise.weight ? String(exercise.weight) : ''}
            onChangeText={handleWeightChange}
            keyboardType="decimal-pad"
            placeholder="--"
            placeholderTextColor={COLORS.textMuted}
            selectTextOnFocus
          />
        </View>
      )}
    </View>
  );
}

export default function WorkoutSummaryModal() {
  const navigation = useNavigation<any>();
  const { profile, loadProfile } = useUserStore();
  const {
    draft,
    isLogging,
    setIntensity,
    setNotes,
    removeExercise,
    updateExercise,
    logWorkout,
    resetDraft,
  } = useWorkoutStore();
  const [saving, setSaving] = useState(false);

  const handleLog = async () => {
    if (!profile?.uid) return;
    if (draft.exercises.length === 0) {
      Alert.alert('Chưa có bài tập', 'Hãy thêm ít nhất 1 bài tập');
      return;
    }
    setSaving(true);
    try {
      await logWorkout(profile.uid);
      await loadProfile(profile.uid);
      navigation.navigate('Main');
    } catch (err) {
      Alert.alert('Lỗi', 'Không lưu được. Thử lại nhé!');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('Huỷ buổi tập?', 'Dữ liệu sẽ bị xoá', [
      { text: 'Giữ lại', style: 'cancel' },
      {
        text: 'Huỷ',
        style: 'destructive',
        onPress: () => {
          resetDraft();
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-down" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Xác nhận buổi tập</Text>
        <TouchableOpacity onPress={handleDiscard} activeOpacity={0.7}>
          <Text style={styles.discardText}>Huỷ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise list */}
        <Text style={styles.sectionLabel}>Bài tập</Text>
        {draft.exercises.length === 0 ? (
          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => navigation.navigate('ExercisePicker')}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.addExerciseBtnText}>Thêm bài tập</Text>
          </TouchableOpacity>
        ) : (
          <>
            {draft.exercises.map((ex) => (
              <ExerciseRow
                key={ex.presetId}
                exercise={ex}
                onRemove={() => removeExercise(ex.presetId)}
                onUpdate={(updates) => updateExercise(ex.presetId, updates)}
              />
            ))}
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => navigation.navigate('ExercisePicker')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={COLORS.primary} />
              <Text style={styles.addMoreText}>Thêm bài tập</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Rest Timer */}
        {draft.exercises.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Nghỉ giữa hiệp</Text>
            <RestTimer />
          </>
        )}

        {/* Intensity picker */}
        <Text style={styles.sectionLabel}>Cường độ</Text>
        <View style={styles.intensityRow}>
          {INTENSITY_OPTIONS.map((opt) => {
            const active = draft.intensity === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.intensityBtn,
                  active && { borderColor: opt.color, backgroundColor: opt.color },
                ]}
                onPress={() => setIntensity(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.intensityEmoji}>{opt.emoji}</Text>
                <Text style={[styles.intensityLabel, active && { color: '#fff', fontWeight: '800' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Ghi chú (tuỳ chọn)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Cảm giác hôm nay..."
          placeholderTextColor={COLORS.textMuted}
          value={draft.notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Log button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.logBtn, (saving || draft.exercises.length === 0) && styles.logBtnDisabled]}
          onPress={handleLog}
          disabled={saving || draft.exercises.length === 0}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.logBtnText}>
                Log {draft.exercises.length} bài tập ✅
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  discardText: { fontSize: 15, color: COLORS.danger },

  content: { flex: 1, padding: 20 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 20,
  },

  exerciseRow: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  removeBtn: { padding: 4 },

  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setsControl: { alignItems: 'center' },
  controlLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
  setsInput: {
    backgroundColor: COLORS.card2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 44,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stepperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stepValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    paddingVertical: 8,
  },
  stepUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    paddingRight: 8,
  },

  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  weightLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  weightInput: {
    backgroundColor: COLORS.card2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 72,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    paddingVertical: 18,
    marginTop: 4,
  },
  addExerciseBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  addMoreText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  intensityRow: { flexDirection: 'row', gap: 10 },
  intensityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 4,
  },
  intensityEmoji: { fontSize: 20 },
  intensityLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },

  notesInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.33,
    shadowRadius: 10,
    elevation: 6,
  },
  logBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  logBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});

const timerStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  presets: { flexDirection: 'row', gap: 8 },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  presetText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  activeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  countdownRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  countdown: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 56,
  },
  countdownUnit: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 6 },
  restLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  skipText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
