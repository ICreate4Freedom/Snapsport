import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../src/store/useStore';

// Replace with your App Store app ID once published
const APP_STORE_URL = 'https://apps.apple.com/app/idREPLACE_WITH_APP_ID?action=write-review';

export default function CompleteScreen() {
  const { progress, reset, exportDestination, debugMode } = useStore();

  // Debug-only: override which state variant is shown
  const [debugSimulateFailed, setDebugSimulateFailed] = useState(
    debugMode ? progress.failed > 0 : false
  );

  const hasFailures = debugMode ? debugSimulateFailed : progress.failed > 0;

  const displaySaved  = debugMode ? (debugSimulateFailed ? 68 : 75) : progress.saved;
  const displayFailed = debugMode ? (debugSimulateFailed ? 7  : 0)  : progress.failed;

  async function handleShare() {
    try {
      await Share.share({
        message:
          'Just moved all my Snapchat memories to iCloud Photos in minutes with SnapsPort! Download it here: https://apps.apple.com/app/snapsport',
      });
    } catch {}
  }

  async function handleReview() {
    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
      } else {
        await Linking.openURL(APP_STORE_URL);
      }
    } catch {
      await Linking.openURL(APP_STORE_URL);
    }
  }

  function handleDone() {
    reset();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Debug toggle panel */}
        {debugMode && (
          <View style={styles.debugPanel}>
            <Text style={styles.debugLabel}>⚙️  Debug — toggle complete state</Text>
            <View style={styles.debugRow}>
              <TouchableOpacity
                style={[styles.debugBtn, !debugSimulateFailed && styles.debugBtnActive]}
                onPress={() => setDebugSimulateFailed(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.debugBtnText, !debugSimulateFailed && styles.debugBtnTextActive]}>
                  🎉 All done
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.debugBtn, debugSimulateFailed && styles.debugBtnActive]}
                onPress={() => setDebugSimulateFailed(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.debugBtnText, debugSimulateFailed && styles.debugBtnTextActive]}>
                  ⚠️ With failures
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.emoji}>{hasFailures ? '⚠️' : '🎉'}</Text>
        <Text style={styles.title}>{hasFailures ? 'Mostly done!' : 'All done!'}</Text>
        <Text style={styles.subtitle}>
          Your Snapchat memories are now in{' '}
          <Text style={styles.highlight}>iCloud Photos</Text>
          {exportDestination === 'album' ? (
            <> — in the <Text style={styles.mono}>SnapsPort</Text> album.</>
          ) : (
            <> in your Camera Roll.</>
          )}
        </Text>

        <View style={styles.statsRow}>
          <Stat label="Saved" value={displaySaved} color="#4caf50" />
          {hasFailures && <Stat label="Failed" value={displayFailed} color="#e53935" />}
        </View>

        {hasFailures && (
          <View style={styles.failureBox}>
            <Text style={styles.failureTitle}>Some memories failed</Text>
            <Text style={styles.failureText}>
              This usually means those download links expired (Snapchat links last ~7 days). Request a new data export from Snapchat and try again to capture the rest.
            </Text>
          </View>
        )}

        <View style={styles.nextSteps}>
          <Text style={styles.nextTitle}>What's next</Text>
          {exportDestination === 'album' ? (
            <Text style={styles.nextItem}>📱  Open the Photos app → Albums → SnapsPort</Text>
          ) : (
            <Text style={styles.nextItem}>📱  Open the Photos app → Camera Roll to see your memories</Text>
          )}
          <Text style={styles.nextItem}>☁️  iCloud will sync to all your Apple devices automatically</Text>
          <Text style={styles.nextItem}>🗑️  You can now cancel your Snapchat storage subscription</Text>
        </View>

        <TouchableOpacity style={styles.reviewBtn} onPress={handleReview} activeOpacity={0.85}>
          <Text style={styles.reviewBtnText}>⭐  Rate SnapsPort</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareBtnText}>Share SnapsPort with friends</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={statStyles.stat}>
      <Text style={[statStyles.number, { color }]}>{value.toLocaleString()}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  stat: { alignItems: 'center', flex: 1 },
  number: { fontSize: 40, fontWeight: '900' },
  label: { color: '#666', fontSize: 13, marginTop: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { padding: 24, paddingBottom: 52, alignItems: 'center' },

  debugPanel: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  debugLabel: { color: '#444', fontSize: 11, fontWeight: '600', marginBottom: 8 },
  debugRow: { flexDirection: 'row', gap: 8 },
  debugBtn: {
    flex: 1,
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  debugBtnActive: { borderColor: '#FFFC00', backgroundColor: '#1a1800' },
  debugBtnText: { color: '#555', fontSize: 12 },
  debugBtnTextActive: { color: '#FFFC00', fontWeight: '700' },

  emoji: { fontSize: 64, marginTop: 16, marginBottom: 16 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  subtitle: {
    color: '#888',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  highlight: { color: '#FFFC00', fontWeight: '700' },
  mono: { color: '#FFFC00', fontFamily: 'monospace' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 20,
  },

  failureBox: {
    backgroundColor: '#1a0505',
    borderColor: '#5a1515',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  failureTitle: { color: '#e57373', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  failureText: { color: '#8a4a4a', fontSize: 13, lineHeight: 18 },

  nextSteps: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    gap: 10,
    marginBottom: 28,
  },
  nextTitle: { color: '#FFF', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  nextItem: { color: '#888', fontSize: 13, lineHeight: 20 },

  reviewBtn: {
    backgroundColor: '#111',
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  reviewBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  shareBtn: {
    backgroundColor: '#111',
    borderColor: '#FFFC00',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  shareBtnText: { color: '#FFFC00', fontWeight: '700', fontSize: 16 },

  doneBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  doneBtnText: { color: '#555', fontSize: 16 },
});
