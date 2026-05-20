import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useBodyStore } from '../../stores/bodyStore';
import { useUserStore } from '../../stores/userStore';
import { BodyMetric } from '../../types/body';
import { COLORS } from '../../constants/colors';

const SCREEN_W = Dimensions.get('window').width;
const CHART_H = 100;
const CHART_W = SCREEN_W - 80; // padding for y-axis labels

function WeightChart({ metrics }: { metrics: BodyMetric[] }) {
  const withWeight = metrics
    .filter((m) => m.weight != null && m.weight! > 0)
    .slice(0, 14)
    .reverse();

  if (withWeight.length < 2) {
    return (
      <View style={chartStyles.empty}>
        <Text style={chartStyles.emptyText}>Cần ít nhất 2 lần cân để hiện đồ thị</Text>
      </View>
    );
  }

  const weights = withWeight.map((m) => m.weight!);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const range = maxW - minW || 1;

  const pts = withWeight.map((m, i) => {
    const x = withWeight.length === 1 ? 0.5 : i / (withWeight.length - 1);
    const y = 1 - (m.weight! - minW) / range;
    return { x, y, weight: m.weight!, date: m.date };
  });

  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.title}>📈 Cân nặng ({withWeight.length} lần gần nhất)</Text>

      <View style={chartStyles.chartArea}>
        {/* Y-axis labels */}
        <View style={chartStyles.yAxis}>
          <Text style={chartStyles.yLabel}>{maxW.toFixed(1)}</Text>
          <Text style={chartStyles.yLabel}>{((maxW + minW) / 2).toFixed(1)}</Text>
          <Text style={chartStyles.yLabel}>{minW.toFixed(1)}</Text>
        </View>

        {/* Plot area */}
        <View style={[chartStyles.plot, { height: CHART_H, width: CHART_W }]}>
          {/* Horizontal gridlines */}
          <View style={[chartStyles.gridLine, { top: 0 }]} />
          <View style={[chartStyles.gridLine, { top: CHART_H / 2 }]} />
          <View style={[chartStyles.gridLine, { top: CHART_H - 1 }]} />

          {/* Connecting lines between dots */}
          {pts.slice(0, -1).map((pt, i) => {
            const next = pts[i + 1];
            const x1 = pt.x * CHART_W;
            const y1 = pt.y * CHART_H;
            const x2 = next.x * CHART_W;
            const y2 = next.y * CHART_H;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={`line-${i}`}
                style={[
                  chartStyles.line,
                  {
                    width: length,
                    left: x1,
                    top: y1,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}

          {/* Dots */}
          {pts.map((pt, i) => (
            <View
              key={`dot-${i}`}
              style={[
                chartStyles.dot,
                {
                  left: pt.x * CHART_W - 5,
                  top: pt.y * CHART_H - 5,
                },
              ]}
            />
          ))}

          {/* Latest weight label */}
          {pts.length > 0 && (
            <View
              style={[
                chartStyles.weightLabel,
                {
                  left: pts[pts.length - 1].x * CHART_W - 24,
                  top: pts[pts.length - 1].y * CHART_H - 26,
                },
              ]}
            >
              <Text style={chartStyles.weightLabelText}>
                {pts[pts.length - 1].weight} kg
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* X-axis: first and last date */}
      <View style={chartStyles.xAxis}>
        <Text style={chartStyles.xLabel}>
          {new Date(withWeight[0].date + 'T00:00:00').toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          })}
        </Text>
        <Text style={chartStyles.xLabel}>
          {new Date(withWeight[withWeight.length - 1].date + 'T00:00:00').toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  chartArea: { flexDirection: 'row', alignItems: 'stretch' },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
    height: CHART_H,
  },
  yLabel: { fontSize: 10, color: COLORS.textSecondary },
  plot: { position: 'relative', overflow: 'hidden' },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
    transformOrigin: 'left center',
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  weightLabel: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 48,
    alignItems: 'center',
  },
  weightLabelText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 40,
    marginTop: 6,
  },
  xLabel: { fontSize: 10, color: COLORS.textSecondary },
  empty: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});

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
        {metric.weight != null && <Text style={styles.logValue}>{metric.weight} kg</Text>}
        {metric.chestCm != null && <Text style={styles.logValue}>Ngực {metric.chestCm} cm</Text>}
        {metric.hipCm != null && <Text style={styles.logValue}>Mông {metric.hipCm} cm</Text>}
      </View>
    </View>
  );
}

export default function BodyTrackingScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useUserStore();
  const { metrics, latestMetric, loading, loadMetrics } = useBodyStore();

  const uid = profile?.uid;

  useFocusEffect(
    useCallback(() => {
      if (uid) loadMetrics(uid);
    }, [uid])
  );

  // Calculate delta from previous entry
  const prevMetric = metrics[1];
  const weightDelta =
    latestMetric?.weight && prevMetric?.weight
      ? +(latestMetric.weight - prevMetric.weight).toFixed(1)
      : undefined;

  const hasMetrics = metrics.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Cơ thể</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddMetric')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#fff" />
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
                label="Vòng ngực"
                value={latestMetric?.chestCm}
                unit="cm"
              />
              <MetricCard
                label="Vòng mông"
                value={latestMetric?.hipCm}
                unit="cm"
              />
            </View>

            {/* Weight chart */}
            {hasMetrics && <WeightChart metrics={metrics} />}

            {!hasMetrics && !loading && (
              <TouchableOpacity
                style={styles.emptyState}
                onPress={() => navigation.navigate('AddMetric')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyIcon}>📏</Text>
                <Text style={styles.emptyTitle}>Bắt đầu theo dõi cơ thể</Text>
                <Text style={styles.emptySubtitle}>Tap để nhập số liệu đầu tiên</Text>
              </TouchableOpacity>
            )}

            {loading && <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} />}

            {hasMetrics && (
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
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

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
