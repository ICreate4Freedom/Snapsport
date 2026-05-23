import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const STEPS = [
  {
    n: '1',
    emoji: '👻',
    title: 'Request your data from Snapchat',
    bullets: [
      'Tap your Profile icon (top-left)',
      'Tap ⚙️ Settings → Privacy → My Data',
      'Toggle ON both: Export your Memories + Export JSON Files',
      'Select All Time → Submit',
    ],
    cta: { label: 'Open Snapchat →', url: 'snapchat://' },
  },
  {
    n: '2',
    emoji: '📧',
    title: 'Download from the email Snapchat sends',
    bullets: [
      'Check your email (arrives in minutes, sometimes up to 1h)',
      'Look for: "Your Snapchat data is ready" from no-reply@snapchat.com',
      'Tap the download link → ZIP saves to your phone',
    ],
    cta: null,
  },
  {
    n: '3',
    emoji: '⚡',
    title: 'Open the ZIP in SnapsPort',
    bullets: [
      'From Mail: long-press the ZIP → Share → SnapsPort',
      'From Files app: tap the ZIP → Share → SnapsPort',
      'SnapsPort imports everything automatically',
    ],
    cta: { label: 'I already have my ZIP →', url: null },
  },
];

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: index * 120,
      useNativeDriver: true,
    }).start();
  }, []);

  const style = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  async function handleCta() {
    if (!step.cta) return;
    if (step.cta.url) {
      const supported = await Linking.canOpenURL(step.cta.url);
      if (supported) Linking.openURL(step.cta.url);
    } else {
      router.push('/import');
    }
  }

  return (
    <Animated.View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{step.n}</Text>
        </View>
        <Text style={styles.emoji}>{step.emoji}</Text>
        <Text style={styles.cardTitle}>{step.title}</Text>
      </View>
      <View style={styles.bullets}>
        {step.bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>
      {step.cta && (
        <TouchableOpacity style={styles.cardCta} onPress={handleCta} activeOpacity={0.8}>
          <Text style={styles.cardCtaText}>{step.cta.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
          }}
        >
          <Text style={styles.logo}>⚡ SnapsPort</Text>
          <Text style={styles.tagline}>
            Move your Snapchat memories to iCloud Photos in 3 steps.
          </Text>
          <View style={styles.urgencyBadge}>
            <Text style={styles.urgencyText}>
              ⏰  Snapchat now charges for storage past 5GB — your memories expire soon
            </Text>
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {/* Steps */}
        {STEPS.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}

        {/* Privacy */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>🔒  Your data stays on your phone</Text>
          <Text style={styles.privacyText}>
            SnapsPort downloads your memories directly from Snapchat to your device — no account, no server, no data shared with us.
          </Text>
        </View>

        {/* Bottom CTA */}
        <TouchableOpacity
          style={styles.mainCta}
          onPress={() => router.push('/import')}
          activeOpacity={0.85}
        >
          <Text style={styles.mainCtaText}>Select ZIP file manually →</Text>
        </TouchableOpacity>
        <Text style={styles.fine}>First 50 memories free · Unlock all for $0.99</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },
  content: { padding: 22, paddingBottom: 52 },

  logo: { color: '#FFFC00', fontSize: 30, fontWeight: '900', marginBottom: 10 },
  tagline: { color: '#FFF', fontSize: 17, fontWeight: '600', lineHeight: 24, marginBottom: 14 },

  urgencyBadge: {
    backgroundColor: '#120e00',
    borderColor: '#FFFC00',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  urgencyText: { color: '#FFFC00', fontSize: 13, lineHeight: 18 },

  divider: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 24 },

  card: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFC00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#000', fontWeight: '900', fontSize: 14 },
  emoji: { fontSize: 20 },
  cardTitle: { color: '#FFF', fontWeight: '700', fontSize: 15, flex: 1 },

  bullets: { gap: 8, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { color: '#FFFC00', fontSize: 18, lineHeight: 20 },
  bulletText: { color: '#999', fontSize: 13, lineHeight: 19, flex: 1 },

  cardCta: {
    marginTop: 14,
    backgroundColor: '#FFFC00',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardCtaText: { color: '#000', fontWeight: '800', fontSize: 15 },

  privacyBox: {
    backgroundColor: '#060e06',
    borderColor: '#1a3d1a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 22,
  },
  privacyTitle: { color: '#4caf50', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  privacyText: { color: '#4a7a4a', fontSize: 12, lineHeight: 17 },

  mainCta: {
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  mainCtaText: { color: '#666', fontWeight: '600', fontSize: 15 },

  fine: { color: '#444', fontSize: 12, textAlign: 'center' },
});
