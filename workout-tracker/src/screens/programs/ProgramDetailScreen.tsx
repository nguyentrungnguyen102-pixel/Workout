import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { PROGRAM_TEMPLATES, DIFFICULTY_LABELS, FOCUS_LABELS } from '../../constants/programTemplates';
import { useProgramStore } from '../../stores/programStore';
import { useUserStore } from '../../stores/userStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { RootStackParamList } from '../../navigation/types';
import { ProgramDay } from '../../types/program';
import { SYSTEM_PRESETS } from '../../constants/exercises';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProgramDetail'>;

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: COLORS.successLight,   text: COLORS.success },
  intermediate: { bg: '#FFF3E0',              text: '#E65100' },
  advanced:     { bg: COLORS.dangerLight,     text: COLORS.danger },
};

function DayCard({
  day,
  isCurrent,
  isCompleted,
  onLoadWorkout,
}: {
  day: ProgramDay;
  isCurrent: boolean;
  isCompleted: boolean;
  onLoadWorkout: () => void;
}) {
  return (
    <View style={[styles.dayCard, isCurrent && styles.dayCardCurrent, isCompleted && styles.dayCardDone]}>
      <View style={styles.dayHeader}>
        <View style={styles.dayLeft}>
          <Text style={styles.dayEmoji}>{day.emoji}</Text>
          <View>
            <Text style={styles.dayName}>{day.nameVi}</Text>
            <Text style={styles.dayFocus} numberOfLines={1}>{day.focusVi}</Text>
          </View>
        </View>
        <View style={styles.dayRight}>
          {isCompleted && (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.doneBadgeText}>Xong</Text>
            </View>
          )}
          {isCurrent && !isCompleted && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Hôm nay</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.exerciseList}>
        {day.exercises.map((ex, i) => {
          const preset = SYSTEM_PRESETS.find((p) => p.id === ex.presetId);
          const icon = preset?.icon ?? '💪';
          const valLabel = ex.unit === 'reps'
            ? `${ex.sets} × ${ex.reps} lần`
            : `${ex.sets} × ${Math.round((ex.durationSeconds ?? 0) / (ex.unit === 'minutes' ? 60 : 1))} ${ex.unit === 'minutes' ? 'phút' : 'giây'}`;

          return (
            <View key={i} style={styles.exRow}>
              <Text style={styles.exIcon}>{icon}</Text>
              <Text style={styles.exName} numberOfLines={1}>{ex.nameVi}</Text>
              <Text style={styles.exVal}>{valLabel}</Text>
            </View>
          );
        })}
      </View>

      {isCurrent && (
        <TouchableOpacity style={styles.loadBtn} onPress={onLoadWorkout} activeOpacity={0.8}>
          <Ionicons name="play" size={16} color="#fff" />
          <Text style={styles.loadBtnText}>Bắt đầu buổi này</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ProgramDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { programId } = route.params;
  const { profile } = useUserStore();
  const { activeState, loadActiveProgram, activate, deactivate } = useProgramStore();
  const { startDraft, addExercise, resetDraft } = useWorkoutStore();
  const uid = profile?.uid;

  useFocusEffect(
    useCallback(() => {
      if (uid) loadActiveProgram(uid);
    }, [uid])
  );

  const program = PROGRAM_TEMPLATES.find((p) => p.id === programId);
  if (!program) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: COLORS.text, padding: 20 }}>Không tìm thấy chương trình.</Text>
      </SafeAreaView>
    );
  }

  const isActive = activeState?.programId === programId;
  const diffColor = DIFF_COLORS[program.difficulty] ?? DIFF_COLORS.beginner;

  const handleActivate = () => {
    if (!uid) return;
    if (isActive) {
      Alert.alert('Huỷ chương trình?', 'Tiến độ sẽ bị xoá.', [
        { text: 'Giữ lại', style: 'cancel' },
        { text: 'Huỷ', style: 'destructive', onPress: () => deactivate(uid) },
      ]);
      return;
    }
    if (activeState) {
      const cur = PROGRAM_TEMPLATES.find((p) => p.id === activeState.programId);
      Alert.alert('Đổi chương trình?', `Đang theo "${cur?.nameVi}". Đổi sang chương trình này?`, [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đổi', onPress: () => activate(uid, programId) },
      ]);
      return;
    }
    activate(uid, programId);
  };

  const handleLoadWorkout = (day: ProgramDay) => {
    resetDraft();
    startDraft();
    day.exercises.forEach((ex) => {
      const preset = SYSTEM_PRESETS.find((p) => p.id === ex.presetId);
      addExercise({
        presetId: ex.presetId,
        name: preset?.nameVi ?? ex.nameVi,
        category: preset?.category ?? 'strength',
        unit: preset?.unit ?? ex.unit,
        sets: ex.sets,
        reps: ex.unit === 'reps' ? ex.reps : undefined,
        durationSeconds: ex.unit !== 'reps' ? ex.durationSeconds : undefined,
      });
    });
    navigation.navigate('WorkoutSummary');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>{program.nameVi}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{program.emoji}</Text>
          <View style={styles.heroMeta}>
            <View style={[styles.diffBadge, { backgroundColor: diffColor.bg }]}>
              <Text style={[styles.diffBadgeText, { color: diffColor.text }]}>
                {DIFFICULTY_LABELS[program.difficulty]}
              </Text>
            </View>
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>{FOCUS_LABELS[program.focus]}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{program.nameVi}</Text>
          <Text style={styles.heroDesc}>{program.descriptionVi}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{program.daysPerWeek}</Text>
              <Text style={styles.heroStatLabel}>ngày/tuần</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{program.estimatedMinutes}'</Text>
              <Text style={styles.heroStatLabel}>mỗi buổi</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{program.days.length}</Text>
              <Text style={styles.heroStatLabel}>buổi/chu kỳ</Text>
            </View>
          </View>
        </View>

        {/* Activate button */}
        <TouchableOpacity
          style={[styles.activateBtn, isActive && styles.deactivateBtn]}
          onPress={handleActivate}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isActive ? 'stop-circle-outline' : 'play-circle-outline'}
            size={20}
            color={isActive ? COLORS.danger : '#fff'}
          />
          <Text style={[styles.activateBtnText, isActive && styles.deactivateBtnText]}>
            {isActive ? 'Dừng chương trình' : 'Bắt đầu chương trình'}
          </Text>
        </TouchableOpacity>

        {isActive && (
          <View style={styles.progressSummary}>
            <Ionicons name="trending-up" size={14} color={COLORS.primary} />
            <Text style={styles.progressText}>
              Đã hoàn thành {activeState!.completedDates.length} buổi · Buổi tiếp:{' '}
              {program.days[activeState!.currentDayIndex]?.nameVi}
            </Text>
          </View>
        )}

        {/* Day list */}
        <Text style={styles.sectionTitle}>Lịch tập chi tiết</Text>
        {program.days.map((day) => {
          const isCurrent = isActive && activeState?.currentDayIndex === day.order - 1;
          const isCompleted = false; // simplified — could track per-day
          return (
            <DayCard
              key={day.id}
              day={day}
              isCurrent={isCurrent}
              isCompleted={isCompleted}
              onLoadWorkout={() => handleLoadWorkout(day)}
            />
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  backBtn: { width: 36, alignItems: 'flex-start' },
  pageTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center' },

  content: { padding: 16 },

  hero: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroEmoji: { fontSize: 44, marginBottom: 10 },
  heroMeta: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  diffBadgeText: { fontSize: 12, fontWeight: '700' },
  focusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: COLORS.card2 },
  focusBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  heroName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  heroDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around' },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  heroStatLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: COLORS.border, alignSelf: 'center' },

  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  activateBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  deactivateBtn: {
    backgroundColor: COLORS.dangerLight,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: COLORS.danger + '44',
  },
  deactivateBtnText: { color: COLORS.danger },

  progressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  progressText: { fontSize: 12, color: COLORS.primary, fontWeight: '600', flex: 1 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 4 },

  dayCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardCurrent: { borderColor: COLORS.primary, borderWidth: 1.5 },
  dayCardDone: { opacity: 0.65 },

  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dayEmoji: { fontSize: 24 },
  dayName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  dayFocus: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  dayRight: { flexDirection: 'row', gap: 6 },

  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  doneBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.success },

  currentBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  currentBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  exerciseList: { gap: 6, marginBottom: 4 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  exName: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '600' },
  exVal: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  loadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  loadBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
