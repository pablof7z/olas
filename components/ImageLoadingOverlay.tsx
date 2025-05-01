import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import useImageStore from "@/stores/imageStore";

const POLL_INTERVAL = 1000;

export default function ImageLoadingOverlay() {
  const store = useImageStore();
  const [now, setNow] = useState(Date.now());

  // Poll every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const queuedCount = store.queues.high.length + store.queues.normal.length + store.queues.low.length;
  const activeCount = Object.keys(store.activeDownloadMeta).length;
  const fetchedCount = Object.keys(store.sessionStats.fetched).length;
  const failedCount =
    Object.keys(store.sessionStats.failedImgProxy).length +
    Object.keys(store.sessionStats.failedSource).length;

  // Only show if there is activity or failures
  if (activeCount === 0 && failedCount === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.container}>
        <Text style={styles.stat}>
          <Text style={styles.label}>Queued: </Text>
          <Text style={queuedCount > 0 ? styles.active : styles.inactive}>
            {queuedCount}
          </Text>
        </Text>
        <Text style={styles.stat}>
          <Text style={styles.label}>Loading: </Text>
          <Text style={activeCount > 0 ? styles.active : styles.inactive}>
            {activeCount}
          </Text>
        </Text>
        <Text style={styles.stat}>
          <Text style={styles.label}>Fetched: </Text>
          <Text style={styles.fetched}>{fetchedCount}</Text>
        </Text>
        <Text style={styles.stat}>
          <Text style={styles.label}>Failed: </Text>
          <Text style={failedCount > 0 ? styles.failed : styles.inactive}>
            {failedCount}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 56,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: "none",
  },
  container: {
    backgroundColor: "rgba(30,30,30,0.92)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  stat: {
    fontSize: 13,
    marginHorizontal: 2,
    fontWeight: "500",
    color: "#fff",
  },
  label: {
    color: "#aaa",
    fontWeight: "400",
  },
  active: {
    color: "#ffb300",
    fontWeight: "700",
  },
  fetched: {
    color: "#4caf50",
    fontWeight: "700",
  },
  failed: {
    color: "#e53935",
    fontWeight: "700",
  },
  inactive: {
    color: "#888",
    fontWeight: "700",
  },
});