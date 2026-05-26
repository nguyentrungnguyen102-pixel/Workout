import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUserStore } from '../../stores/userStore';
import { getRecentLogs } from '../../services/workoutService';
import { useHeatmap } from '../../hooks/useHeatmap';
import { WorkoutLog } from '../../types/workout';
import { COLORS } from '../../constants/colors';
import { toLocalDateString } from '../../lib/date';

// --- Heatmap ---
function HeatmapCalendar({ uid }: { uid: string }) {
  const { data, loading } = useHeatmap(uid);

  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toLocalDateString(d));
  }

  const getCellColor = (date: string) => {
    const cell = data[date];
    if (!cell) return COLORS.heatmapNone;
    switch (cell.intensity) {
      case 'light':    return COLORS.heatmapLight;
      case 'moderate': return COLORS.heatmapModerate;
      case 'heavy':    return COLORS.heatmapHeavy;
      default:         return COLORS.heatmapNone;
    }
  };

  if (loading) {
    return <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} />;
  }

  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <View style={heatStyles.container}>
      <Text style={heatStyles.title}>90 ngày gần đây</Text>
      <View style={heatStyles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={heatStyles.week}>
            {week.map((date) => (
              <View
                key={date}
                style={[heatStyles.cell, { backgroundColor: getCellColor(date) }]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={heatStyles.legend}>
        <View style={[heatStyles.legendDot, { backgroundColor: COLORS.heatmapNone }]} />
        <Text style={heatStyles.legendText}>Nghỉ</Text>
        <View style={[heatStyles.legendDot, { backgroundColor: COLORS.heatmapLight }]} />
        <Text style={heatStyles.legendText}>Nhẹ</Text>
        <View style={[heatStyles.legendDot, { backgroundColor: COLORS.heatmapModerate }]} />
        <Text style={heatStyles.legendText}>Vừa</Text>
        <View style={[heatStyles.legendDot, { backgroundColor: COLORS.heatmapHeavy }]} />
        <Text style={heatStyles.legendText}>Nặng</Text>
      </View>
      <Text style={heatStyles.summary}>
        Đã tập {Object.keys(data).length} ngày trong 90 ngày qua
      </Text>
    </View>
  );
}

const heatStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  grid: { flexDirection: 'row', gap: 3, marginBottom: 10 },
  week: { flexDirection: 'column', gap: 3 },
  cell: { width: 12, height: 12, borderRadius: 2 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, color: COLORS.textSecondary, marginRight: 4 },
  summary: { fontSize: 12, color: COLORS.textSecondary },
});

// --- Log card ---
function LogCard({ log, onPress }: { log: WorkoutLog; onPress: () => void }) {
  const dateObj = new Date(log.date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('vi-VN', { weekday: 'short' });
  const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  const timeStr = (log as any).createdAt?.seconds
    ? new Date((log as any).createdAt.seconds * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const intensityColor = {
    light:    COLORS.success,
    moderate: '#FF9800',
    heavy:    COLORS.danger,
  }[log.intensity] ?? COLORS.textSecondary;

  return (
    <TouchableOpacity style={logStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={logStyles.dateCol}>
        <Text style={logStyles.dateDay}>{dateStr}</Text>
        <Text style={logStyles.dateDayName}>{dayName}</Text>
        {timeStr ? <Text style={logStyles.dateTime}>{timeStr}</Text> : null}
      </View>
      <View style={logStyles.divider} />
      <View style={logStyles.info}>
        <Text style={logStyles.exercises} numberOfLines={1}>
          {log.exercises.map((e) => e.name).join(' · ')}
        </Text>
        <View style={logStyles.meta}>
          <Text style={logStyles.metaText}>{log.totalDurationMinutes} phút</Text>
          <View style={[logStyles.intensityDot, { backgroundColor: intensityColor }]} />
          <Text style={logStyles.metaText}>{log.caloriesEstimate} kcal</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const logStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  dateCol: { alignItems: 'center', minWidth: 44 },
  dateDay: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  dateDayName: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  dateTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: COLORS.border },
  info: { flex: 1 },
  exercises: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  intensityDot: { width: 8, height: 8, borderRadius: 4 },
});

// --- Main screen ---
export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useUserStore();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);

  const uid = profile?.uid;

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      setLoading(true);
      getRecentLogs(uid, 20)
        .then(setLogs)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [uid])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Lịch sử tập luyện</Text>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={uid ? <HeatmapCalendar uid={uid} /> : null}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.emptyText}>Chưa có buổi tập nào. Bắt đầu ngay! 💪</Text>
          )
        }
        renderItem={({ item }) => (
          <LogCard
            log={item}
            onPress={() => navigation.navigate('LogDetail', { logId: item.id, date: item.date })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 15, marginTop: 40 },
});
