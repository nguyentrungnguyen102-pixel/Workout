import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useUserStore } from '../../stores/userStore';
import { SYSTEM_PRESETS, CATEGORY_LABELS } from '../../constants/exercises';
import { COLORS } from '../../constants/colors';
import { WorkoutPreset, ExerciseCategory } from '../../types/workout';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CategoryFilter = ExerciseCategory | 'all';

const CATEGORY_FILTERS: { key: CategoryFilter; label: string; emoji: string }[] = [
  { key: 'all',       label: 'Tất cả',    emoji: '⚡' },
  { key: 'strength',  label: 'Sức mạnh',  emoji: '💪' },
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
    strength: 'STR', cardio: 'CAR', mobility: 'MOB', recovery: 'REC',
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
    loadYesterdayLog,
    loadTodayLog,
    loadRecentLogs,
  } = useWorkoutStore();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const uid = profile?.uid;

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      loadYesterdayLog(uid);
      loadTodayLog(uid);
      loadRecentLogs(uid);
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

  const hasDraft = draft.exercises.length > 0;
  const streak = profile?.streak?.current || 0;
  const weeklyPct = profile?.weeklyStats
    ? Math.round((profile.weeklyStats.totalMinutes / profile.weeklyStats.targetMinutes) * 100)
    : 0;

  const filteredPresets = SYSTEM_PRESETS.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

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
          <StreakBadge streak={streak} />
        </View>

        {/* Weekly progress card */}
        {weeklyPct > 0 && (
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyLabel}>Mục tiêu tuần</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(weeklyPct, 100)}%` as any }]} />
            </View>
            <Text style={styles.weeklyPct}>{weeklyPct}% hoàn thành</Text>
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
                onPress={() => setActiveCategory(item.key)}
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
  weeklyPct: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

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

  categoryTabList: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
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
});
