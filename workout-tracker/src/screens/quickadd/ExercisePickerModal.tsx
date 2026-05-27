import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SYSTEM_PRESETS, CATEGORY_LABELS } from '../../constants/exercises';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useUserStore } from '../../stores/userStore';
import { COLORS } from '../../constants/colors';
import { WorkoutPreset, ExerciseCategory, ExerciseUnit } from '../../types/workout';
import { getCustomPresets, saveCustomPreset, deleteCustomPreset } from '../../services/customExerciseService';

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'mobility', 'recovery', 'weights'];

const UNIT_OPTIONS: { label: string; value: ExerciseUnit }[] = [
  { label: 'Reps', value: 'reps' },
  { label: 'Giây', value: 'seconds' },
  { label: 'Phút', value: 'minutes' },
];

const ICON_OPTIONS = ['🏋️', '💪', '🤸', '🏃', '🚴', '🧘', '🤼', '🥊', '⚽', '🏊', '🎯', '🔥', '⭐', '🌟', '💥'];

function CreateExerciseModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (preset: WorkoutPreset) => void;
}) {
  const { profile } = useUserStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const [unit, setUnit] = useState<ExerciseUnit>('reps');
  const [defaultValue, setDefaultValue] = useState('10');
  const [defaultSets, setDefaultSets] = useState('3');
  const [icon, setIcon] = useState('🏋️');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setCategory('strength');
    setUnit('reps');
    setDefaultValue('10');
    setDefaultSets('3');
    setIcon('🏋️');
  };

  const handleSave = async () => {
    if (!profile?.uid) return;
    if (!name.trim()) {
      Alert.alert('Thiếu tên', 'Nhập tên bài tập');
      return;
    }
    const val = parseFloat(defaultValue);
    if (!val || val <= 0) {
      Alert.alert('Giá trị không hợp lệ', 'Nhập số lớn hơn 0');
      return;
    }
    setSaving(true);
    try {
      const preset = await saveCustomPreset(profile.uid, {
        nameVi: name.trim(),
        category,
        unit,
        defaultValue: val,
        defaultSets: parseInt(defaultSets) || 3,
        icon,
      });
      onSave(preset);
      reset();
      onClose();
    } catch {
      Alert.alert('Lỗi', 'Không tạo được. Thử lại nhé!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={createStyles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={createStyles.header}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close" size={26} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={createStyles.title}>Tạo bài tập mới</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView contentContainerStyle={createStyles.content} showsVerticalScrollIndicator={false}>
            {/* Icon picker */}
            <Text style={createStyles.label}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={createStyles.iconRow}>
              {ICON_OPTIONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[createStyles.iconBtn, icon === ic && createStyles.iconBtnActive]}
                  onPress={() => setIcon(ic)}
                >
                  <Text style={createStyles.iconText}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name */}
            <Text style={createStyles.label}>Tên bài tập</Text>
            <TextInput
              style={createStyles.input}
              placeholder="VD: Hít đất nghịch"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
            />

            {/* Category */}
            <Text style={createStyles.label}>Nhóm cơ</Text>
            <View style={createStyles.optionRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[createStyles.optionBtn, category === c && createStyles.optionBtnActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[createStyles.optionText, category === c && createStyles.optionTextActive]}>
                    {CATEGORY_LABELS[c]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Unit */}
            <Text style={createStyles.label}>Đơn vị đo</Text>
            <View style={createStyles.optionRow}>
              {UNIT_OPTIONS.map((u) => (
                <TouchableOpacity
                  key={u.value}
                  style={[createStyles.optionBtn, unit === u.value && createStyles.optionBtnActive]}
                  onPress={() => setUnit(u.value)}
                >
                  <Text style={[createStyles.optionText, unit === u.value && createStyles.optionTextActive]}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Default values */}
            <View style={createStyles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={createStyles.label}>
                  Mặc định ({unit === 'reps' ? 'reps' : unit === 'seconds' ? 'giây' : 'phút'})
                </Text>
                <TextInput
                  style={createStyles.input}
                  value={defaultValue}
                  onChangeText={setDefaultValue}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              {unit === 'reps' && (
                <View style={{ flex: 1 }}>
                  <Text style={createStyles.label}>Số hiệp</Text>
                  <TextInput
                    style={createStyles.input}
                    value={defaultSets}
                    onChangeText={setDefaultSets}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              )}
            </View>
          </ScrollView>

          <View style={createStyles.footer}>
            <TouchableOpacity
              style={[createStyles.saveBtn, saving && createStyles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={createStyles.saveBtnText}>Tạo bài tập ✅</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ExercisePickerModal() {
  const navigation = useNavigation<any>();
  const { startDraft, addExercise, draft } = useWorkoutStore();
  const { profile } = useUserStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | 'all'>('all');
  const [customPresets, setCustomPresets] = useState<WorkoutPreset[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    setLoadingCustom(true);
    getCustomPresets(profile.uid)
      .then(setCustomPresets)
      .catch(() => {})
      .finally(() => setLoadingCustom(false));
  }, [profile?.uid]);

  const allPresets = useMemo(() => [...customPresets, ...SYSTEM_PRESETS], [customPresets]);

  const filtered = useMemo(() => {
    return allPresets.filter((p) => {
      const matchSearch =
        !search ||
        p.nameVi.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory, allPresets]);

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

  const handleDeleteCustom = (preset: WorkoutPreset) => {
    Alert.alert('Xoá bài tập?', `"${preset.nameVi}" sẽ bị xoá vĩnh viễn`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomPreset(preset.id);
          setCustomPresets((prev) => prev.filter((p) => p.id !== preset.id));
        },
      },
    ]);
  };

  const handleCustomCreated = (preset: WorkoutPreset) => {
    setCustomPresets((prev) => [preset, ...prev]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn bài tập</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
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

      {loadingCustom && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />}

      {/* Exercise list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy bài tập. Tap + để tạo mới.</Text>
        }
        renderItem={({ item }) => {
          const selected = isSelected(item.id);
          const isCustom = item.isCustom;
          return (
            <TouchableOpacity
              style={[styles.exerciseItem, selected && styles.exerciseItemSelected]}
              onPress={() => handleSelect(item)}
              disabled={selected}
              onLongPress={() => isCustom && handleDeleteCustom(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.exerciseIcon}>{item.icon}</Text>
              <View style={styles.exerciseInfo}>
                <View style={styles.exerciseNameRow}>
                  <Text style={styles.exerciseName}>{item.nameVi}</Text>
                  {isCustom && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>Tự tạo</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.exerciseSub}>
                  {CATEGORY_LABELS[item.category]} · {item.defaultValue} {item.unit}
                </Text>
              </View>
              {selected ? (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
              ) : isCustom ? (
                <TouchableOpacity
                  onPress={() => handleDeleteCustom(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />

      {/* Create exercise modal */}
      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCustomCreated}
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
    backgroundColor: COLORS.primaryLight,
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
    backgroundColor: COLORS.primaryLight,
  },
  exerciseIcon: { fontSize: 26 },
  exerciseInfo: { flex: 1 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  customBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  customBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
  exerciseSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 14, marginTop: 24 },
});

const createStyles = StyleSheet.create({
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
  content: { padding: 20, paddingBottom: 40 },
  footer: { padding: 20, paddingBottom: 32 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 16,
  },

  iconRow: { marginBottom: 4 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  iconBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  iconText: { fontSize: 22 },

  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  optionText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.primary },

  row2: { flexDirection: 'row', gap: 12 },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
