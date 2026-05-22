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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { PROGRAM_TEMPLATES, DIFFICULTY_LABELS, FOCUS_LABELS } from '../../constants/programTemplates';
import { useProgramStore } from '../../stores/programStore';
import { useUserStore } from '../../stores/userStore';
import { RootStackParamList } from '../../navigation/types';
import { WorkoutProgram } from '../../types/program';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: COLORS.successLight,   text: COLORS.success },
  intermediate: { bg: '#FFF3E0',              text: '#E65100' },
  advanced:     { bg: COLORS.dangerLight,     text: COLORS.danger },
};

function ProgramCard({
  program,
  isActive,
  onPress,
  onActivate,
}: {
  program: WorkoutProgram;
  isActive: boolean;
  onPress: () => void;
  onActivate: () => void;
}) {
  const diffColor = DIFF_COLORS[program.difficulty] ?? DIFF_COLORS.beginner;

  return (
    <TouchableOpacity style={[styles.card, isActive && styles.cardActive]} onPress={onPress} activeOpacity={0.8}>
      {isActive && (
        <View style={styles.activeBadge}>
          <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
          <Text style={styles.activeBadgeText}>Đang theo</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{program.emoji}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.diffBadge, { backgroundColor: diffColor.bg }]}>
            <Text style={[styles.diffBadgeText, { color: diffColor.text }]}>
              {DIFFICULTY_LABELS[program.difficulty]}
            </Text>
          </View>
          <View style={styles.focusBadge}>
            <Text style={styles.focusBadgeText}>{FOCUS_LABELS[program.focus]}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.cardName}>{program.nameVi}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{program.descriptionVi}</Text>

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{program.daysPerWeek} ngày/tuần</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.statText}>~{program.estimatedMinutes} phút</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="layers-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{program.days.length} buổi</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.detailBtn} onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.detailBtnText}>Xem chi tiết</Text>
        </TouchableOpacity>
        {!isActive ? (
          <TouchableOpacity style={styles.activateBtn} onPress={onActivate} activeOpacity={0.8}>
            <Text style={styles.activateBtnText}>Bắt đầu</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeBtn}>
            <Ionicons name="checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.activeBtnText}>Đang chạy</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProgramsScreen() {
  const navigation = useNavigation<Nav>();
  const { profile } = useUserStore();
  const { activeState, loadActiveProgram, activate, deactivate } = useProgramStore();
  const uid = profile?.uid;

  useFocusEffect(
    useCallback(() => {
      if (uid) loadActiveProgram(uid);
    }, [uid])
  );

  const handleActivate = (program: WorkoutProgram) => {
    if (!uid) return;
    if (activeState?.programId === program.id) {
      Alert.alert('Huỷ chương trình?', `Bạn có muốn dừng "${program.nameVi}"?`, [
        { text: 'Giữ lại', style: 'cancel' },
        { text: 'Huỷ chương trình', style: 'destructive', onPress: () => deactivate(uid) },
      ]);
      return;
    }
    if (activeState) {
      const currentProg = PROGRAM_TEMPLATES.find((p) => p.id === activeState.programId);
      Alert.alert(
        'Đổi chương trình?',
        `Bạn đang theo "${currentProg?.nameVi}". Đổi sang "${program.nameVi}"?`,
        [
          { text: 'Giữ lại', style: 'cancel' },
          { text: 'Đổi chương trình', onPress: () => activate(uid, program.id) },
        ]
      );
      return;
    }
    activate(uid, program.id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Chương trình tập</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeState && (
          <View style={styles.activeSummary}>
            <Ionicons name="flame" size={16} color={COLORS.primary} />
            <Text style={styles.activeSummaryText}>
              Hoàn thành {activeState.completedDates.length} buổi kể từ{' '}
              {new Date(activeState.startedAt + 'T00:00:00').toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit',
              })}
            </Text>
          </View>
        )}

        {PROGRAM_TEMPLATES.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            isActive={activeState?.programId === program.id}
            onPress={() => navigation.navigate('ProgramDetail', { programId: program.id })}
            onActivate={() => handleActivate(program)}
          />
        ))}

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
  pageTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  content: { padding: 16 },

  activeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  activeSummaryText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', flex: 1 },

  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardActive: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardEmoji: { fontSize: 32 },
  cardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },

  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  diffBadgeText: { fontSize: 11, fontWeight: '700' },

  focusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: COLORS.card2,
  },
  focusBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },

  cardName: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 18 },

  cardStats: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', gap: 10 },
  detailBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.card2,
    alignItems: 'center',
  },
  detailBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },

  activateBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  activateBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  activeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  activeBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
