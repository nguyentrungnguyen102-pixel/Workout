import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useBodyStore } from '../../stores/bodyStore';
import { useUserStore } from '../../stores/userStore';
import { BodyMetric } from '../../types/body';
import { COLORS } from '../../constants/colors';

function MetricCard({ label, value, unit, delta }: {
  label: string;
  value?: number;
  unit: string;
  delta?: number;
}) {
  const hasData = value !== undefined && value !== null;
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {hasData ? `${value}` : '--'}
        {hasData && <Text style={styles.metricUnit}> {unit}</Text>}
      </Text>
      {delta !== undefined && (
        <Text style={[styles.metricDelta, { color: delta < 0 ? COLORS.primary : COLORS.danger }]}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)} {unit}
        </Text>
      )}
    </View>
  );
}

function BodyLogItem({ metric }: { metric: BodyMetric }) {
  const dateObj = new Date(metric.date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <View style={styles.logItem}>
      <Text style={styles.logDate}>{dateStr}</Text>
      <View style={styles.logValues}>
        {metric.weight && <Text style={styles.logValue}>{metric.weight} kg</Text>}
        {metric.bodyFatPercent && <Text style={styles.logValue}>{metric.bodyFatPercent}% fat</Text>}
        {metric.waistCm && <Text style={styles.logValue}>{metric.waistCm} cm vòng bụng</Text>}
      </View>
    </View>
  );
}

export default function BodyTrackingScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useUserStore();
  const { metrics, latestMetric, loading, loadMetrics } = useBodyStore();

  const uid = profile?.uid;

  useEffect(() => {
    if (uid) loadMetrics(uid);
  }, [uid]);

  // Calculate delta from previous entry
  const prevMetric = metrics[1];
  const weightDelta =
    latestMetric?.weight && prevMetric?.weight
      ? latestMetric.weight - prevMetric.weight
      : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Cơ thể</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddMetric')}
        >
          <Ionicons name="add" size={22} color={COLORS.background} />
          <Text style={styles.addBtnText}>Cập nhật</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={metrics}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Current metrics summary */}
            <View style={styles.summaryRow}>
              <MetricCard
                label="Cân nặng"
                value={latestMetric?.weight}
                unit="kg"
                delta={weightDelta}
              />
              <MetricCard
                label="Body fat"
                value={latestMetric?.bodyFatPercent}
                unit="%"
              />
              <MetricCard
                label="Vòng bụng"
                value={latestMetric?.waistCm}
                unit="cm"
              />
            </View>

            {metrics.length === 0 && !loading && (
              <TouchableOpacity
                style={styles.emptyState}
                onPress={() => navigation.navigate('AddMetric')}
              >
                <Text style={styles.emptyIcon}>📏</Text>
                <Text style={styles.emptyTitle}>Bắt đầu theo dõi cơ thể</Text>
                <Text style={styles.emptySubtitle}>Tap để nhập số liệu đầu tiên</Text>
              </TouchableOpacity>
            )}

            {loading && <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} />}

            {metrics.length > 0 && (
              <Text style={styles.historyLabel}>Lịch sử</Text>
            )}
          </View>
        }
        renderItem={({ item }) => <BodyLogItem metric={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.background },

  list: { paddingHorizontal: 20, paddingBottom: 32 },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  metricLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  metricValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  metricUnit: { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },
  metricDelta: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6 },

  historyLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  logItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDate: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  logValues: { flexDirection: 'row', gap: 10 },
  logValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
});
