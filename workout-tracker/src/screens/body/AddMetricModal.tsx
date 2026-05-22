import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useBodyStore } from '../../stores/bodyStore';
import { useUserStore } from '../../stores/userStore';
import { COLORS } from '../../constants/colors';

export default function AddMetricModal() {
  const navigation = useNavigation<any>();
  const { profile } = useUserStore();
  const { addMetric } = useBodyStore();

  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [hip, setHip] = useState('');
  const [arm, setArm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.uid) return;
    if (!weight && !chest && !hip && !arm) {
      Alert.alert('Thiếu dữ liệu', 'Hãy nhập ít nhất 1 chỉ số');
      return;
    }

    setSaving(true);
    try {
      await addMetric(profile.uid, {
        weight: weight ? parseFloat(weight) : undefined,
        chestCm: chest ? parseFloat(chest) : undefined,
        hipCm: hip ? parseFloat(hip) : undefined,
        armCm: arm ? parseFloat(arm) : undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Lỗi', 'Không lưu được. Thử lại nhé!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="close" size={26} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Cập nhật chỉ số</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.date}>
            📅 {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>⚖️ Cân nặng (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="70.5"
              placeholderTextColor={COLORS.textMuted}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>📐 Vòng ngực (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="90"
              placeholderTextColor={COLORS.textMuted}
              value={chest}
              onChangeText={setChest}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>🍑 Vòng mông (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="95"
              placeholderTextColor={COLORS.textMuted}
              value={hip}
              onChangeText={setHip}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>💪 Vòng tay (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="35"
              placeholderTextColor={COLORS.textMuted}
              value={arm}
              onChangeText={setArm}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Lưu chỉ số ✅</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  content: { flex: 1, padding: 24 },
  date: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },

  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  footer: { padding: 20, paddingBottom: 32 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.33,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
