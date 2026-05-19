import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useUserStore } from '../../stores/userStore';
import { SYSTEM_PRESETS, CATEGORY_LABELS } from '../../constants/exercises';
import { COLORS } from '../../constants/colors';
import { WorkoutPreset, ExerciseEntry } from '../../types/workout';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakFire}>🔥</Text>
      <Text style={styles.streakText}>{streak}</Text>
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
    startDraft,
    addExercise,
    resetDraft,
    repeatYesterday,
    loadYesterdayLog,
    loadTodayLog,
  } = useWorkoutStore();

  const uid = profile?.uid;

  useEffect(() => {
    if (!uid) return;
    loadYesterdayLog(uid);
    loadTodayLog(uid);
  }, [uid]);

  const handlePresetTap = useCallback(
    (preset: WorkoutPreset) => {
      startDraft();
      const entry: ExerciseEntry = {
        presetId: preset.id,
        name: preset.nameVi,
        category: preset.category,
        unit: preset.unit,
        sets: preset.defaultSets ?? 3,
        reps: preset.unit === 'reps' ? preset.defaultValue : undefined,
        durationSeconds:
          preset.unit === 'seconds' || preset.unit === 'minutes'
            ? preset.unit === 'minutes'
              ? preset.defaultValue * 60
              : preset.defaultValue
            : undefined,
      };
      addExercise(entry);
      navigation.navigate('WorkoutSummary');
    },
    [startDraft, addExercise, navigation]
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

  const topPresets = SYSTEM_PRESETS.slice(0, 6);
  const strengthPresets = SYSTEM_PRESETS.filter((p) => p.category === 'strength');
  const cardioPresets = SYSTEM_PRESETS.filter((p) => p.category === 'cardio');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Chào {profile?.displayName?.split(' ')[0] || 'anh'} 👋</Text>
            <Text style={styles.subtitle}>Hôm nay tập gì?</Text>
          </View>
          <StreakBadge streak={streak} />
        </View>

        {/* Weekly progress bar */}
        {weeklyPct > 0 && (
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyLabel}>Mục tiêu tuần này</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(weeklyPct, 100)}%` }]} />
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
          >
            <Text style={styles.continueTitle}>⚡ Tiếp tục buổi tập</Text>
            <Text style={styles.continueSub}>
              {draft.exercises.length} bài đã chọn → Tap để hoàn thành
            </Text>
          </TouchableOpacity>
        )}

        {/* Lặp lại hôm qua */}
        {yesterdayLog && !todayLog && (
          <TouchableOpacity style={styles.repeatCard} onPress={handleRepeatYesterday}>
            <View style={styles.repeatLeft}>
              <Text style={styles.repeatTitle}>🔁 Lặp lại hôm qua</Text>
              <Text style={styles.repeatSub} numberOfLines={1}>
                {yesterdayLog.exercises.map((e) => e.name).join(' · ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Quick presets */}
        <Text style={styles.sectionTitle}>Bài tập phổ biến</Text>
        <FlatList
          data={topPresets}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={styles.presetRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.presetCard}
              onPress={() => handlePresetTap(item)}
              activeOpacity={0.75}
            >
              <Text style={styles.presetIcon}>{item.icon}</Text>
              <Text style={styles.presetName} numberOfLines={1}>{item.nameVi}</Text>
              <Text style={styles.presetDefault}>
                {item.unit === 'reps' ? `${item.defaultValue} reps` : `${item.defaultValue} ${item.unit}`}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Strength */}
        <Text style={styles.sectionTitle}>💪 Sức mạnh</Text>
        <FlatList
          data={strengthPresets}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chipCard} onPress={() => handlePresetTap(item)}>
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text style={styles.chipName}>{item.nameVi}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Cardio */}
        <Text style={styles.sectionTitle}>🏃 Cardio</Text>
        <FlatList
          data={cardioPresets}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chipCard} onPress={() => handlePresetTap(item)}>
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text style={styles.chipName}>{item.nameVi}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Browse all */}
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('ExercisePicker')}
        >
          <Ionicons name="search" size={18} color={COLORS.primary} />
          <Text style={styles.browseBtnText}>Tìm kiếm bài tập khác</Text>
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
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakFire: { fontSize: 18 },
  streakText: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  weeklyCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
  },
  weeklyLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  weeklyPct: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  todayCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  todayTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  todaySub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  continueCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1a2a1a',
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
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  repeatLeft: { flex: 1 },
  repeatTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  repeatSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },

  presetRow: { paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  presetCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    minHeight: 90,
  },
  presetIcon: { fontSize: 26, marginBottom: 6 },
  presetName: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  presetDefault: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },

  horizontalList: { paddingHorizontal: 20, gap: 10, marginBottom: 4 },
  chipCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  chipIcon: { fontSize: 20 },
  chipName: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  browseBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  browseBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
