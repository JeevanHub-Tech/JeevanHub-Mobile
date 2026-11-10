// src/components/orders/OrderTrackingModal.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  MapPin,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Truck,
  X,
} from 'lucide-react-native';
import { patientApi } from '../../api/patient';
import { Colors } from '../../constants/theme';
import type { TrackingResponse, TrackingTimelineEntry } from '../../types/patient';
import { openExternalUrl } from '../blog/BlogRichContent';

const CARRIER_URLS: Record<string, (awb: string) => string> = {
  delhivery: (awb) => `https://www.delhivery.com/track/package/${encodeURIComponent(awb || '')}`,
  bluedart: () => 'https://www.bluedart.com/tracking',
  dtdc: () => 'https://www.dtdc.in/',
};

const CARRIER_LABELS: Record<string, string> = {
  delhivery: 'Delhivery',
  bluedart: 'Blue Dart',
  dtdc: 'DTDC',
};

function formatScanTime(val?: string): string {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getScanIcon(code?: string) {
  switch (code) {
    case 'DL':
      return PackageCheck;
    case 'RT':
      return RotateCcw;
    case 'OT':
    case 'IT':
    case 'OP':
    case 'PP':
      return Truck;
    case 'M':
      return Circle;
    default:
      return CheckCircle2;
  }
}

function TimelineBlock({ timeline }: { timeline: TrackingTimelineEntry[] }) {
  if (!timeline.length) {
    return (
      <Text style={styles.emptyTimelineText}>
        No courier scans yet. The first update appears once the parcel is picked up.
      </Text>
    );
  }

  return (
    <View style={styles.timelineList}>
      {timeline.map((entry, idx) => {
        const Icon = getScanIcon(entry.statusCode);
        const isLatest = idx === 0;
        const isLast = idx === timeline.length - 1;
        return (
          <View key={`${entry.statusCode || 'scan'}-${idx}`} style={styles.timelineRow}>
            <View style={styles.railCol}>
              <View style={[styles.railDot, isLatest && styles.railDotLatest]}>
                <Icon size={13} color={isLatest ? '#ffffff' : Colors.inkMuted} />
              </View>
              {!isLast ? <View style={styles.railLine} /> : null}
            </View>
            <View style={[styles.scanBody, !isLast && { paddingBottom: 14 }]}>
              <Text style={[styles.scanStatus, isLatest && { fontWeight: '800' }]}>
                {entry.status || 'Update'}
              </Text>
              <View style={styles.scanMetaRow}>
                {entry.timestamp ? (
                  <Text style={styles.scanMeta}>{formatScanTime(entry.timestamp)}</Text>
                ) : null}
                {entry.location ? (
                  <View style={styles.locRow}>
                    <MapPin size={11} color={Colors.inkMuted} />
                    <Text style={styles.scanMeta}>{entry.location}</Text>
                  </View>
                ) : null}
              </View>
              {entry.remarks ? (
                <Text style={styles.scanRemarks}>{entry.remarks}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

interface OrderTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  orderId?: string | null;
  retailerId?: string | null;
}

export function OrderTrackingModal({
  visible,
  onClose,
  orderId,
  retailerId,
}: OrderTrackingModalProps) {
  const [data, setData] = useState<TrackingResponse | TrackingResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await patientApi.getOrderTracking(orderId, retailerId || undefined);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Could not load shipment tracking.');
    } finally {
      setLoading(false);
    }
  }, [orderId, retailerId]);

  useEffect(() => {
    if (!visible) return;
    setData(null);
    fetchTracking();
  }, [visible, fetchTracking]);

  const handleShareAwb = async (awb: string) => {
    try {
      await Share.share({ message: `Delhivery AWB Tracking Number: ${awb}` });
    } catch {
      // Dismissed
    }
  };

  const renderSingleShipment = (tracking: TrackingResponse, idx: number) => {
    const awb = tracking.trackingId || tracking.shipment?.trackingId || '';
    const status =
      tracking.currentStatus ||
      tracking.lastPolledStatus ||
      tracking.shipment?.lastPolledStatus ||
      tracking.orderStatus ||
      'shipped';
    const location =
      tracking.currentLocation ||
      tracking.lastPolledLocation ||
      tracking.shipment?.lastPolledLocation;
    const timeline =
      tracking.timeline ||
      tracking.trackingTimeline ||
      tracking.shipment?.trackingTimeline ||
      [];
    const platform = (
      tracking.platform ||
      tracking.shipment?.platform ||
      'delhivery'
    ).toLowerCase();
    const platformLabel = CARRIER_LABELS[platform] || 'Courier';
    const carrierUrl = (CARRIER_URLS[platform] || CARRIER_URLS.delhivery)(awb);
    const isSandbox = Boolean(awb && (awb.startsWith('SBX') || awb.includes('SANDBOX')));
    const lastUpdated = tracking.lastUpdated || tracking.shipment?.lastPolledAt;

    return (
      <View key={idx} style={styles.shipmentBlock}>
        <View style={styles.summaryBox}>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{status}</Text>
            </View>
            {isSandbox ? (
              <View style={styles.sandboxBadge}>
                <Text style={styles.sandboxBadgeText}>Sandbox Simulated</Text>
              </View>
            ) : null}
          </View>

          {location ? (
            <View style={styles.locRow}>
              <MapPin size={12} color={Colors.inkMuted} />
              <Text style={styles.locText}>{location}</Text>
            </View>
          ) : null}

          {awb ? (
            <View style={styles.awbRow}>
              <Text style={styles.awbText}>
                AWB: <Text style={styles.awbMono}>{awb}</Text>
              </Text>
              <TouchableOpacity
                style={styles.awbActionBtn}
                onPress={() => handleShareAwb(awb)}
              >
                <Copy size={12} color={Colors.oliveDeep} />
                <Text style={styles.awbActionText}>Share</Text>
              </TouchableOpacity>
              {!isSandbox ? (
                <TouchableOpacity
                  style={styles.awbActionBtn}
                  onPress={() => openExternalUrl(carrierUrl)}
                >
                  <Text style={styles.awbActionText}>{platformLabel}</Text>
                  <ExternalLink size={11} color={Colors.oliveDeep} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={styles.refreshRow}>
            <Text style={styles.updatedText}>
              {lastUpdated
                ? `Updated ${formatScanTime(lastUpdated)}${tracking.source === 'cached' ? ' (cached)' : ''}`
                : 'Not polled yet'}
            </Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={fetchTracking}
              disabled={loading}
            >
              <RefreshCw size={12} color={Colors.oliveDeep} />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tracking.error ? (
          <View style={styles.warnBox}>
            <AlertCircle size={14} color={Colors.error} />
            <Text style={styles.warnText}>{tracking.error}</Text>
          </View>
        ) : null}

        <TimelineBlock timeline={timeline} />
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Truck size={20} color={Colors.oliveAction} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Track Shipment</Text>
              <Text style={styles.headerSub}>Live Delhivery & courier updates</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Colors.inkStrong} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {loading && !data ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={Colors.olive} />
                <Text style={styles.centerText}>Fetching latest courier scans...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerBox}>
                <AlertCircle size={30} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchTracking}>
                  <RefreshCw size={14} color="#ffffff" />
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : data ? (
              Array.isArray(data) ? (
                data.map((item, idx) => renderSingleShipment(item, idx))
              ) : (
                renderSingleShipment(data, 0)
              )
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    maxHeight: 540,
  },
  bodyContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 28,
  },
  shipmentBlock: {
    gap: 14,
  },
  summaryBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  sandboxBadge: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sandboxBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locText: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  awbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  awbText: {
    fontSize: 12,
    color: Colors.inkMuted,
  },
  awbMono: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  awbActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  awbActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  updatedText: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.creamTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.oliveDeep,
  },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorBg,
    borderRadius: 12,
    padding: 10,
  },
  warnText: {
    flex: 1,
    fontSize: 12,
    color: Colors.error,
  },
  timelineList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTimelineText: {
    fontSize: 13,
    color: Colors.inkMuted,
    textAlign: 'center',
    paddingVertical: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  railCol: {
    alignItems: 'center',
  },
  railDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railDotLatest: {
    backgroundColor: Colors.oliveAction,
  },
  railLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: Colors.borderStrong,
    marginVertical: 2,
  },
  scanBody: {
    flex: 1,
    gap: 3,
  },
  scanStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkStrong,
  },
  scanMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scanMeta: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  scanRemarks: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontStyle: 'italic',
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 34,
    gap: 10,
  },
  centerText: {
    fontSize: 13,
    color: Colors.inkMuted,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

