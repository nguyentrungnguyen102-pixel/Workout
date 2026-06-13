import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '../../stores/userStore';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GOAL_OPTIONS = [
  { value: 90,  label: '1.5 giờ / tuần', sub: 'Nhẹ nhàng', emoji: '🌿' },
  { value: 150, label: '2.5 giờ / tuần', sub: 'Khuyến nghị', emoji: '💪', recommended: true },
  { value: 240, label: '4 giờ / tuần',   sub: 'Chuyên sâu', emoji: '🏆' },
  { value: 300, label: '5 giờ / tuần',   sub: 'Vận động viên', emoji: '🔥' },
];

const SESSION_OPTIONS = [
  { value: 2, label: '2 ngày / tuần' },
  { value: 3, label: '3 ngày / tuần' },
  { value: 4, label: '4 ngày / tuần' },
  { value: 5, label: '5 ngày / tuần' },
];

const STEP_COUNT = 3;

function StepDots({ step }: { step: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, updateProfile } = useUserStore();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [weeklyGoal, setWeeklyGoal] = useState(150);
  const [weeklyGoalSessions, setWeeklyGoalSessions] = useState(4);
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (step < STEP_COUNT - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      await updateProfile(profile.uid, {
        displayName: displayName.trim() || profile.displayName,
        weeklyGoalMinutes: weeklyGoal,
        weeklyGoalSessions,
        onboardingDone: true,
      });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StepDots step={step} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>👋</Text>
              <Text style={styles.stepTitle}>Chào mừng!</Text>
              <Text style={styles.stepSub}>
                Hãy thiết lập tài khoản để bắt đầu hành trình tập luyện.
              </Text>
              <Text style={styles.fieldLabel}>Tên của bạn</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Nhập tên..."
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>🎯</Text>
              <Text style={styles.stepTitle}>Mục tiêu của bạn</Text>
              <Text style={styles.stepSub}>
                Bạn muốn tập bao nhiêu mỗi tuần?
              </Text>
              <View style={styles.optionList}>
                {GOAL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionCard,
                      weeklyGoal === opt.value && styles.optionCardActive,
                    ]}
                    onPress={() => setWeeklyGoal(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.optionLabel,
                        weeklyGoal === opt.value && styles.optionLabelActive,
                      ]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.optionSub}>{opt.sub}</Text>
                    </View>
                    {opt.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Đề xuất</Text>
                      </View>
                    )}
                    {weeklyGoal === opt.value && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Số ngày tập / tuần</Text>
              <View style={styles.sessionRow}>
                {SESSION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.sessionChip,
                      weeklyGoalSessions === opt.value && styles.sessionChipActive,
                    ]}
                    onPress={() => setWeeklyGoalSessions(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.sessionChipText,
                      weeklyGoalSessions === opt.value && styles.sessionChipTextActive,
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>🚀</Text>
              <Text style={styles.stepTitle}>Sẵn sàng tập!</Text>
              <Text style={styles.stepSub}>
                Tất cả đã được thiết lập. Bắt đầu ngay thôi!
              </Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Tóm tắt cài đặt</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>👤</Text>
                  <Text style={styles.summaryText}>{displayName || 'Người dùng'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>🎯</Text>
                  <Text style={styles.summaryText}>{weeklyGoal} phút / tuần · {weeklyGoalSessions} ngày</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>🏠</Text>
                  <Text style={styles.summaryText}>Bài tập tạ đơn tại nhà có sẵn</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>📊</Text>
                  <Text style={styles.summaryText}>Theo dõi streak & thành tích cá nhân</Text>
                </View>
              </View>

              <View style={styles.featureList}>
                {[
                  '💪 Ghi lại buổi tập nhanh chóng',
                  '🏋️ 34 bài tập gồm tạ đơn tại nhà',
                  '📈 Biểu đồ tiến bộ & kỷ lục cá nhân',
                  '🔥 Theo dõi streak hàng ngày',
                  '📋 Chương trình tập theo lộ trình',
                ].map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>← Quay lại</Text>
            </TouchableOpacity>
          )}
          {step < STEP_COUNT - 1 ? (
            <TouchableOpacity
              style={[styles.nextBtn, step === 0 && !displayName.trim() && styles.nextBtnDisabled]}
              onPress={handleNext}
              disabled={step === 0 && !displayName.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Tiếp theo →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleFinish}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextBtnText}>Bắt đầu tập! 🚀</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },

  content: { paddingHorizontal: 24, paddingBottom: 20 },
  stepContainer: { paddingTop: 24 },
  stepEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
  },

  optionList: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionEmoji: { fontSize: 22 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  optionLabelActive: { color: COLORS.primary },
  optionSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  recommendedBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recommendedText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  sessionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sessionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  sessionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sessionChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  sessionChipTextActive: { color: '#fff' },

  summaryCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    gap: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIcon: { fontSize: 18 },
  summaryText: { fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1 },

  featureList: { gap: 8 },
  featureItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  nextBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
