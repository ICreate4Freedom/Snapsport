import { router, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useStore } from '../src/store/useStore';

function isZipUri(url: string) {
  return url.endsWith('.zip') || url.includes('.zip?') || url.startsWith('file://');
}

export default function RootLayout() {
  const setPendingFileUri = useStore((s) => s.setPendingFileUri);

  function handleIncomingUrl(url: string) {
    if (!url) return;
    // Accept file:// URIs (opened via Open In… from Mail/Files)
    if (isZipUri(url)) {
      setPendingFileUri(url);
      router.replace('/import');
    }
  }

  useEffect(() => {
    // App opened via document association
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    });

    // App already open, receives a new file
    const sub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#FFFC00',
          headerTitleStyle: { color: '#FFF', fontWeight: '700' },
          contentStyle: { backgroundColor: '#000' },
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}
