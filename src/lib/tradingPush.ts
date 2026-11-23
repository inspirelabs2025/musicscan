// Registers this device for push alerts: Firebase web push in browsers,
// native push in the phone app. Tokens are stored in push_subscriptions.
import { supabase } from '@/integrations/supabase/client';

export type PushResult =
  | { status: 'registered'; platform: string }
  | { status: 'not-configured' | 'unsupported' | 'open-in-new-tab' | 'denied' | 'error'; message?: string };

const env = import.meta.env;
const appId = env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;
const firebaseConfig = {
  apiKey: env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined,
  projectId: env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined,
  appId,
  messagingSenderId: appId?.split(':')[1] ?? '',
};

const isNative = () => (window as any).Capacitor?.isNativePlatform?.() === true;

async function saveToken(token: string, platform: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, token, platform, user_agent: navigator.userAgent.slice(0, 250), last_seen_at: new Date().toISOString() },
    { onConflict: 'token' },
  );
  if (error) throw error;
}

async function enableNativePush(): Promise<PushResult> {
  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return { status: 'denied' };
  const platform = (window as any).Capacitor?.getPlatform?.() ?? 'android';
  const token = await new Promise<string>((resolve, reject) => {
    PushNotifications.addListener('registration', (t) => resolve(t.value));
    PushNotifications.addListener('registrationError', (e) => reject(new Error(e.error)));
    PushNotifications.register();
  });
  await saveToken(token, platform);
  return { status: 'registered', platform };
}

/** Call from a click: browsers only ask for permission after a user action. */
export async function enablePush(): Promise<PushResult> {
  try {
    if (isNative()) return await enableNativePush();
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return { status: 'unsupported' };
    if (window.top !== window.self) return { status: 'open-in-new-tab' };
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') return { status: 'denied' };
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !appId || !vapidKey || !firebaseConfig.messagingSenderId) {
      // Browser alerts still work while MusicScan is open; background push needs Firebase.
      return { status: 'not-configured' };
    }
    const [{ initializeApp, getApps }, { getMessaging, getToken, isSupported }] = await Promise.all([
      import('firebase/app'), import('firebase/messaging'),
    ]);
    if (!(await isSupported())) return { status: 'unsupported' };
    const query = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`, { scope: '/firebase-cloud-messaging-push-scope' });
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return { status: 'denied' };
    await saveToken(token, 'web');
    return { status: 'registered', platform: 'web' };
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }
}

export const pushMessages: Record<PushResult['status'], string> = {
  registered: 'Pushmeldingen staan aan op dit apparaat.',
  'not-configured': 'Meldingen met geluid werken zolang MusicScan open staat. Push als de site dicht is komt beschikbaar zodra pushmeldingen zijn ingesteld.',
  unsupported: 'Deze browser ondersteunt geen pushmeldingen. Je krijgt meldingen binnen de site.',
  'open-in-new-tab': 'Open MusicScan in een eigen tabblad om meldingen toe te staan.',
  denied: 'Meldingen zijn geblokkeerd. Zet ze aan in de site-instellingen van je browser.',
  error: 'Aanzetten lukte niet. Probeer het later opnieuw.',
};
