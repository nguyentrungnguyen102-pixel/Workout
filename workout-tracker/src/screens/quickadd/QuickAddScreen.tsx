import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useUserStore } from '../../stores/userStore';
import { SYSTEM_PRESETS, CATEGORY_LABELS, MUSCLE_GROUP_LABELS } from '../../constants/exercises';
import { COLORS } from '../../constants/colors';
import { WorkoutPreset, ExerciseCategory, WorkoutTemplate, MuscleGroup } from '../../types/workout';
import { RootStackParamList } from '../../navigation/types';
import { getTemplates, deleteTemplate } from '../../services/templateService';
import { useProgramStore } from '../../stores/programStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CategoryFilter = ExerciseCategory | 'all';

const CATEGORY_FILTERS: { key: CategoryFilter; label: string; emoji: string }[] = [
  { key: 'all',       label: 'Tất cả',    emoji: '⚡' },
  { key: 'strength',  label: 'Sức mạnh',  emoji: '💪' },
  { key: 'dumbbell',  label: 'Tạ đơn',    emoji: '🏋️' },
  { key: 'cardio',    label: 'Cardio',    emoji: '🏃' },
  { key: 'mobility',  label: 'Linh hoạt', emoji: '🧘' },
  { key: 'recovery',  label: 'Phục hồi',  emoji: '🌿' },
];

const CAT_BADGE = COLORS.catStrength;

function getCategoryStyle(category: string) {
  switch (category) {
    case 'strength': return COLORS.catStrength;
    case 'cardio':   return COLORS.catCardio;
    case 'mobility': return COLORS.catMobility;
    case 'recovery': return COLORS.catRecovery;
    case 'dumbbell': return COLORS.catDumbbell;
    default:         return COLORS.catStrength;
  }
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakFire}>🔥</Text>
      <Text style={styles.streakText}>{streak}</Text>
    </View>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const cat = getCategoryStyle(category);
  const shortLabels: Record<string, string> = {
    strength: 'STR', cardio: 'CAR', mobility: 'MOB', recovery: 'REC', dumbbell: 'TẠ',
  };
  return (
    <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
      <Text style={[styles.catBadgeText, { color: cat.text }]}>{shortLabels[category] ?? category.toUpperCase().slice(0, 3)}</Text>
    </View>
  );
}

export default function QuickAddScreen() {
  const navigation = useNavigation<Nav>();
  const { profile } = useUserStore();
  const {
    draft,
    yesterdayLog,
    todayLog,
    recentLogs,
    startDraft,
    addExercise,
    resetDraft,
    repeatYesterday,
    loadRecentLogs,
  } = useWorkoutStore();

  const { activeState, loadActiveProgram, getActiveProgram, getTodayDay } = useProgramStore();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [activeMuscleGroup, setActiveMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const uid = profile?.uid;

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      loadRecentLogs(uid);
      loadActiveProgram(uid);
      getTemplates(uid).then(setTemplates).catch(() => {});
    }, [uid])
  );

  // Scan all recent logs (sorted desc) to find most recent value for this exercise
  const getSuggestedValue = useCallback((preset: WorkoutPreset) => {
    for (const log of recentLogs) {
      const entry = log.exercises.find((e) => e.presetId === preset.id);
      if (entry) return entry;
    }
    return null;
  }, [recentLogs]);

  const handlePresetTap = useCallback(
    (preset: WorkoutPreset) => {
      startDraft();
      const suggested = getSuggestedValue(preset);
      const entry = {
        presetId: preset.id,
        name: preset.nameVi,
        category: preset.category,
        unit: preset.unit,
        sets: suggested?.sets ?? preset.defaultSets ?? 3,
        reps: preset.unit === 'reps'
          ? (suggested?.reps ?? preset.defaultValue)
          : undefined,
        durationSeconds: (preset.unit === 'seconds' || preset.unit === 'minutes')
          ? (suggested?.durationSeconds ?? (preset.unit === 'minutes' ? preset.defaultValue * 60 : preset.defaultValue))
          : undefined,
      };
      addExercise(entry);
      navigation.navigate('WorkoutSummary');
    },
    [startDraft, addExercise, navigation, getSuggestedValue]
  );

  const handleRepeatYesterday = useCallback(async () => {
    if (!uid || !yesterdayLog) return;
    await repeatYesterday(uid);
    navigation.navigate('WorkoutSummary');
  }, [uid, yesterdayLog, repeatYesterday, navigation]);

  const handleLoadTemplate = useCallback(
    (template: WorkoutTemplate) => {
      startDraft();
      template.exercises.forEach((ex) => addExercise({ ...ex }));
      navigation.navigate('WorkoutSummary');
    },
    [startDraft, addExercise, navigation]
  );

  const handleDeleteTemplate = useCallback(
    (template: WorkoutTemplate) => {
      Alert.alert('Xoá template?', `"${template.name}" sẽ bị xoá`, [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(template.id).catch(() => {});
            setTemplates((prev) => prev.filter((t) => t.id !== template.id));
          },
        },
      ]);
    },
    []
  );

  const handleLoadProgramDay = useCallback(() => {
    const todayDay = getTodayDay();
    if (!todayDay) return;
    resetDraft();
    startDraft();
    todayDay.exercises.forEach((ex) => {
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
  }, [getTodayDay, resetDraft, startDraft, addExercise, navigation]);

  const activeProg = getActiveProgram();
  const todayProgramDay = getTodayDay();

  const hasDraft = draft.exercises.length > 0;
  const streak = profile?.streak?.current || 0;
  const targetMinutes = profile?.weeklyStats?.targetMinutes || profile?.weeklyGoalMinutes || 150;
  const weeklyPct = profile?.weeklyStats?.totalMinutes
    ? Math.min(100, Math.round((profile.weeklyStats.totalMinutes / targetMinutes) * 100))
    : 0;
  const sessionCount = profile?.weeklyStats?.sessionCount || 0;
  const weeklyGoalSessions = profile?.weeklyGoalSessions || 4;

  const filteredPresets = SYSTEM_PRESETS.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (activeCategory === 'dumbbell' && activeMuscleGroup !== 'all' && p.muscleGroup !== activeMuscleGroup) return false;
    return true;
  });

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Chào {profile?.displayName?.split(' ')[0] || 'anh'} 👋</Text>
            <Text style={styles.subtitle}>{today}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.programsBtn}
              onPress={() => navigation.navigate('ProgramsList')}
              activeOpacity={0.7}
            >
              <Ionicons name="barbell-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <StreakBadge streak={streak} />
          </View>
        </View>

        {/* Weekly progress card */}
        {(weeklyPct > 0 || sessionCount > 0) && (
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyLabel}>Mục tiêu tuần</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(weeklyPct, 100)}%` as any }]} />
            </View>
            <View style={styles.weeklyFooter}>
              <Text style={styles.weeklyPct}>{weeklyPct}% phút</Text>
              <Text style={styles.weeklySessions}>
                {sessionCount}/{weeklyGoalSessions} buổi
              </Text>
            </View>
          </View>
        )}

        {/* Đã tập hôm nay */}
        {todayLog && (
          <View style={styles.todayCard}>
            <Text style={styles.todayTitle}>✅ Đã tập hôm nay!</Text>
            <Text style={styles.todaySub}>
              {todayLog.exercises.map((e) => e.name).join(' · ')} · {todayLog.totalDurationMinutes} phút
            </Text>
          </View>
        )}

        {/* Draft in progress */}
        {hasDraft && (
          <TouchableOpacity
            style={styles.continueCard}
            onPress={() => navigation.navigate('WorkoutSummary')}
            activeOpacity={0.7}
          >
            <Text style={styles.continueTitle}>⚡ Tiếp tục buổi tập</Text>
            <Text style={styles.continueSub}>
              {draft.exercises.length} bài đã chọn → Tap để hoàn thành
            </Text>
          </TouchableOpacity>
        )}

        {/* Lặp lại hôm qua */}
        {yesterdayLog && !todayLog && (
          <TouchableOpacity style={styles.repeatCard} onPress={handleRepeatYesterday} activeOpacity={0.7}>
            <View style={styles.repeatLeft}>
              <Text style={styles.repeatTitle}>🔁 Lặp lại hôm qua</Text>
              <Text style={styles.repeatSub} numberOfLines={1}>
                {yesterdayLog.exercises.map((e) => e.name).join(' · ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Active program day card */}
        {activeProg && todayProgramDay && !todayLog && (
          <TouchableOpacity style={styles.programCard} onPress={handleLoadProgramDay} activeOpacity={0.7}>
            <View style={styles.programCardLeft}>
              <Text style={styles.programCardEmoji}>{todayProgramDay.emoji}</Text>
              <View>
                <Text style={styles.programCardTitle}>{activeProg.nameVi}</Text>
                <Text style={styles.programCardDay}>{todayProgramDay.nameVi} · {todayProgramDay.focusVi}</Text>
              </View>
            </View>
            <Ionicons name="play-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Saved templates */}
        {templates.length > 0 && (
          <View style={styles.templatesSection}>
            <Text style={styles.templatesSectionTitle}>📌 Template đã lưu</Text>
            <FlatList
              data={templates}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.templateCard}
                  onPress={() => handleLoadTemplate(item)}
                  onLongPress={() => handleDeleteTemplate(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.templateName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.templateMeta}>{item.exercises.length} bài</Text>
                  <Text style={styles.templateExercises} numberOfLines={1}>
                    {item.exercises.map((e) => e.name).join(' · ')}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Category filter tabs */}
        <FlatList
          data={CATEGORY_FILTERS}
          horizontal
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabList}
          renderItem={({ item }) => {
            const active = activeCategory === item.key;
            return (
              <TouchableOpacity
                style={[styles.categoryTab, active && styles.categoryTabActive]}
                onPress={() => {
                  setActiveCategory(item.key);
                  setActiveMuscleGroup('all');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryTabEmoji}>{item.emoji}</Text>
                <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Muscle group sub-filter — shown only when Tạ đơn is active */}
        {activeCategory === 'dumbbell' && (
          <FlatList
            data={([
              { key: 'all', label: 'Tất cả', emoji: '🏋️' },
              ...Object.entries(MUSCLE_GROUP_LABELS).map(([key, val]) => ({
                key,
                label: val.label,
                emoji: val.emoji,
              })),
            ] as { key: string; label: string; emoji: string }[])}
            horizontal
            keyExtractor={(item) => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.muscleGroupTabList}
            renderItem={({ item }) => {
              const active = activeMuscleGroup === item.key;
              return (
                <TouchableOpacity
                  style={[styles.muscleGroupTab, active && styles.muscleGroupTabActive]}
                  onPress={() => setActiveMuscleGroup(item.key as MuscleGroup | 'all')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryTabEmoji}>{item.emoji}</Text>
                  <Text style={[styles.muscleGroupTabText, active && styles.muscleGroupTabTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Exercise grid — 2 columns */}
        <FlatList
          data={filteredPresets}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.presetRow}
          contentContainerStyle={styles.presetGrid}
          renderItem={({ item }) => {
            const suggested = getSuggestedValue(item);
            const valueLabel = suggested
              ? (item.unit === 'reps'
                  ? `Gần nhất: ${suggested.reps} reps`
                  : `Gần nhất: ${Math.round((suggested.durationSeconds || 0) / (item.unit === 'minutes' ? 60 : 1))} ${item.unit}`)
              : (item.unit === 'reps'
                  ? `Mặc định: ${item.defaultValue} reps`
                  : `Mặc định: ${item.defaultValue} ${item.unit}`);

            return (
              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handlePresetTap(item)}
                activeOpacity={0.7}
              >
                <CategoryBadge category={item.category} />
                <Text style={styles.presetIcon}>{item.icon}</Text>
                <Text style={styles.presetName} numberOfLines={1}>{item.nameVi}</Text>
                <Text style={styles.presetHint}>{valueLabel}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Browse all */}
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('ExercisePicker')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={18} color={COLORS.primary} />
          <Text style={styles.browseBtnText}>Tìm bài tập khác</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  streakFire: { fontSize: 13 },
  streakText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  weeklyCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  weeklyLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  weeklyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyPct: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  weeklySessions: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  todayCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.successLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.success + '44',
  },
  todayTitle: { fontSize: 15, fontWeight: '700', color: COLORS.success },
  todaySub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  continueCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  continueTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  continueSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  repeatCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
  },
  repeatLeft: { flex: 1 },
  repeatTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  repeatSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  programsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  programCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  programCardEmoji: { fontSize: 28 },
  programCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  programCardDay: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  categoryTabList: { paddingHorizontal: 20, gap: 8, marginBottom: 10 },
  muscleGroupTabList: { paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  muscleGroupTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  muscleGroupTabActive: {
    backgroundColor: COLORS.catDumbbell.bg,
    borderColor: COLORS.catDumbbell.text,
  },
  muscleGroupTabText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  muscleGroupTabTextActive: { color: COLORS.catDumbbell.text },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryTabEmoji: { fontSize: 13 },
  categoryTabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  categoryTabTextActive: { color: '#fff' },

  presetGrid: { paddingHorizontal: 20 },
  presetRow: { gap: 10, marginBottom: 10 },
  presetCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    marginBottom: 8,
  },
  catBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  presetIcon: { fontSize: 24, marginBottom: 4 },
  presetName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  presetHint: { fontSize: 11, color: COLORS.textSecondary },

  browseBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  browseBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  templatesSection: { marginBottom: 16, paddingHorizontal: 20 },
  templatesSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  templatesList: { gap: 8, paddingRight: 4 },
  templateCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 12,
    minWidth: 130,
    maxWidth: 160,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templateName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  templateMeta: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginBottom: 2 },
  templateExercises: { fontSize: 10, color: COLORS.textSecondary },
});
