import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SYSTEM_PRESETS, CATEGORY_LABELS } from '../../constants/exercises';
import { useWorkoutStore } from '../../stores/workoutStore';
import { COLORS } from '../../constants/colors';
import { WorkoutPreset, ExerciseCategory } from '../../types/workout';

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'mobility', 'recovery'];

export default function ExercisePickerModal() {
  const navigation = useNavigation<any>();
  const { startDraft, addExercise, draft } = useWorkoutStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return SYSTEM_PRESETS.filter((p) => {
      const matchSearch =
        !search ||
        p.nameVi.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  const isSelected = (presetId: string) =>
    draft.exercises.some((e) => e.presetId === presetId);

  const handleSelect = (preset: WorkoutPreset) => {
    if (isSelected(preset.id)) return;
    startDraft();
    addExercise({
      presetId: preset.id,
      name: preset.nameVi,
      category: preset.category,
      unit: preset.unit,
      sets: preset.defaultSets ?? 3,
      reps: preset.unit === 'reps' ? preset.defaultValue : undefined,
      durationSeconds:
        preset.unit === 'seconds'
          ? preset.defaultValue
          : preset.unit === 'minutes'
          ? preset.defaultValue * 60
          : undefined,
    });
    navigation.navigate('WorkoutSummary');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn bài tập</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <FlatList
        data={(['all', ...CATEGORIES] as const).map((c) => c)}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === item && styles.categoryChipActive]}
            onPress={() => setActiveCategory(item as any)}
          >
            <Text style={[styles.categoryChipText, activeCategory === item && styles.categoryChipTextActive]}>
              {item === 'all' ? 'Tất cả' : CATEGORY_LABELS[item]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Exercise list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const selected = isSelected(item.id);
          return (
            <TouchableOpacity
              style={[styles.exerciseItem, selected && styles.exerciseItemSelected]}
              onPress={() => handleSelect(item)}
              disabled={selected}
            >
              <Text style={styles.exerciseIcon}>{item.icon}</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.nameVi}</Text>
                <Text style={styles.exerciseSub}>
                  {CATEGORY_LABELS[item.category]} · {item.defaultValue} {item.unit}
                </Text>
              </View>
              {selected && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  categoryList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  categoryChipTextActive: { color: COLORS.primary },

  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  exerciseItemSelected: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDark,
  },
  exerciseIcon: { fontSize: 26 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  exerciseSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
