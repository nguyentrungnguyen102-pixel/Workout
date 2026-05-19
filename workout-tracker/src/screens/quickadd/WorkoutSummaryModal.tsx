import React, { useState } from 'react';
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

const INTENSITY_OPTIONS: { label: string; value: Intensity; color: string; emoji: string }[] = [
  { label: 'Nhẹ', value: 'light', color: '#4CAF50', emoji: '🟢' },
  { label: 'Vừa', value: 'moderate', color: '#FF9800', emoji: '🟡' },
  { label: 'Nặng', value: 'heavy', color: '#F44336', emoji: '🔴' },
];

function ExerciseRow({ exercise, onRemove }: { exercise: any; onRemove: () => void }) {
  const unit = exercise.unit;
  const valueStr =
    unit === 'reps'
      ? `${exercise.sets} × ${exercise.reps} reps`
      : unit === 'seconds'
      ? `${exercise.sets} × ${exercise.durationSeconds}s`
      : unit === 'minutes'
      ? `${Math.round((exercise.durationSeconds || 0) / 60)} phút`
      : `${exercise.sets} sets`;

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseValue}>{valueStr}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Ionicons name="close-circle" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

export default function WorkoutSummaryModal() {
  const navigation = useNavigation<any>();
  const { profile } = useUserStore();
  const {
    draft,
    isLogging,
    setIntensity,
    setNotes,
    removeExercise,
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Xác nhận buổi tập</Text>
        <TouchableOpacity onPress={handleDiscard}>
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
              />
            ))}
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => navigation.navigate('ExercisePicker')}
            >
              <Ionicons name="add" size={18} color={COLORS.primary} />
              <Text style={styles.addMoreText}>Thêm bài tập</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Intensity picker */}
        <Text style={styles.sectionLabel}>Cường độ</Text>
        <View style={styles.intensityRow}>
          {INTENSITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.intensityBtn,
                draft.intensity === opt.value && {
                  borderColor: opt.color,
                  backgroundColor: `${opt.color}20`,
                },
              ]}
              onPress={() => setIntensity(opt.value)}
            >
              <Text style={styles.intensityEmoji}>{opt.emoji}</Text>
              <Text style={[styles.intensityLabel, draft.intensity === opt.value && { color: opt.color }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Ghi chú (tuỳ chọn)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Cảm giác hôm nay..."
          placeholderTextColor={COLORS.textSecondary}
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
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#000" />
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 16,
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  exerciseValue: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  removeBtn: { padding: 4 },

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
  },
  addExerciseBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
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
  },
  logBtnDisabled: { opacity: 0.5 },
  logBtnText: { fontSize: 17, fontWeight: '800', color: '#000' },
});
