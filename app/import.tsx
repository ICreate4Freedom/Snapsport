import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { unzip } from 'react-native-zip-archive';
import { parseMemoriesJson } from '../src/core/parser';
import { useStore } from '../src/store/useStore';

type ImportPhase = 'idle' | 'extracting' | 'parsing';

const STATUS: Record<ImportPhase, string> = {
  idle: '',
  extracting: 'Extracting ZIP…',
  parsing: 'Reading memories…',
};

export default function ImportScreen() {
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const { setMemories, setError, pendingFileUri, setPendingFileUri } = useStore();
  const [mediaPermission, requestPermission] = MediaLibrary.usePermissions();

  // Auto-import if a file was opened via Share/Open-in
  useEffect(() => {
    if (pendingFileUri) {
      const uri = pendingFileUri;
      setPendingFileUri(null);
      handleImportFromUri(uri);
    }
  }, []);

  async function ensurePermission(): Promise<boolean> {
    if (mediaPermission?.granted) return true;
    const { granted } = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission required',
        'SnapsPort needs access to your photo library to save memories. Please allow it in Settings.',
        [{ text: 'OK' }]
      );
    }
    return granted;
  }

  async function handlePickFile() {
    if (!(await ensurePermission())) return;

    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'public.zip-archive'],
        copyToCacheDirectory: true,
      });
    } catch {
      return;
    }

    if (result.canceled || !result.assets?.[0]) return;
    await handleImportFromUri(result.assets[0].uri);
  }

  async function handleImportFromUri(zipUri: string) {
    if (!(await ensurePermission())) return;

    const extractDir = `${FileSystem.cacheDirectory}snapsport_extract/`;

    try {
      setPhase('extracting');
      await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });

      // Some URIs from Share Extension are content:// or file:// — normalize
      const localZip = zipUri.startsWith('file://') ? zipUri : zipUri;
      await unzip(localZip, extractDir);

      setPhase('parsing');
      const jsonPath = await findMemoriesJson(extractDir);
      const raw = await FileSystem.readAsStringAsync(jsonPath);
      const { memories, skipped } = parseMemoriesJson(raw);

      await FileSystem.deleteAsync(extractDir, { idempotent: true });

      if (memories.length === 0) {
        throw new Error(
          'No memories with download links found.\n\nMake sure you selected both "Export your Memories" AND "Export JSON Files" when requesting your data from Snapchat.'
        );
      }

      setMemories(memories);
      router.replace({ pathname: '/processing', params: { skipped: String(skipped) } });
    } catch (err) {
      await FileSystem.deleteAsync(extractDir, { idempotent: true });
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setPhase('idle');
      Alert.alert('Import failed', msg, [{ text: 'OK' }]);
    }
  }

  const isLoading = phase !== 'idle';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFC00" />
            <Text style={styles.loadingTitle}>{STATUS[phase]}</Text>
            <Text style={styles.loadingSubtitle}>Don't close the app</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Select your ZIP file</Text>
            <Text style={styles.subtitle}>
              Snapchat emails you a ZIP file containing your memories. Open that ZIP in SnapsPort — tap the button below or use{' '}
              <Text style={styles.highlight}>Share → SnapsPort</Text> from your Mail app.
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={handlePickFile} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>📂  Choose ZIP file</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.shareCard}>
              <Text style={styles.shareTitle}>Faster: Open In from Mail</Text>
              <Text style={styles.shareSteps}>
                1. Open the Snapchat email on this iPhone{'\n'}
                2. Tap the ZIP attachment{'\n'}
                3. Tap the Share icon → select SnapsPort{'\n'}
                4. Import starts automatically
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>⚠️  Links expire after 7 days</Text>
              <Text style={styles.tipText}>
                The download links inside your ZIP expire. Import as soon as you download your Snapchat data.
              </Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

async function findMemoriesJson(extractDir: string): Promise<string> {
  const candidates = [
    `${extractDir}memories_history.json`,
    `${extractDir}json/memories_history.json`,
  ];

  for (const path of candidates) {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return path;
  }

  const contents = await FileSystem.readDirectoryAsync(extractDir);
  for (const entry of contents) {
    const sub = `${extractDir}${entry}/memories_history.json`;
    const info = await FileSystem.getInfoAsync(sub);
    if (info.exists) return sub;
  }

  throw new Error(
    'Could not find memories_history.json in the ZIP.\n\nMake sure you selected both "Export your Memories" and "Export JSON Files" in Snapchat → My Data.'
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },

  loadingContainer: { alignItems: 'center', gap: 16 },
  loadingTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  loadingSubtitle: { color: '#555', fontSize: 14 },

  title: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  subtitle: { color: '#777', fontSize: 15, lineHeight: 22, marginBottom: 28 },
  highlight: { color: '#FFFC00', fontWeight: '600' },

  primaryBtn: {
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 17 },

  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#222' },
  orText: { color: '#444', fontSize: 13 },

  shareCard: {
    backgroundColor: '#0a0a0a',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  shareTitle: { color: '#FFF', fontWeight: '700', fontSize: 15, marginBottom: 10 },
  shareSteps: { color: '#777', fontSize: 13, lineHeight: 22 },

  tipCard: {
    backgroundColor: '#120900',
    borderColor: '#3a2200',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  tipTitle: { color: '#e09000', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  tipText: { color: '#7a5500', fontSize: 12, lineHeight: 17 },
});
