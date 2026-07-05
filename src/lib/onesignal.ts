import OneSignal from 'react-onesignal';

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

let initialized = false;

/** True only when a real App ID has been configured (not the placeholder). */
function isConfigured(): boolean {
  return !!APP_ID && APP_ID !== 'REPLACE_WITH_YOUR_APP_ID';
}

/**
 * Initialize OneSignal, auto-prompt for push permission, and tag the user as
 * role="public". Safe to call when no App ID is set — it simply no-ops so the
 * app keeps working before OneSignal is configured.
 */
export async function initOneSignal(): Promise<void> {
  if (initialized || !isConfigured()) return;
  try {
    // Typed loosely: react-onesignal's IInitObject over-constrains notifyButton.
    const options: Record<string, unknown> = {
      appId: APP_ID!,
      autoRegister: true,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    };
    await OneSignal.init(options as Parameters<typeof OneSignal.init>[0]);
    initialized = true;

    // Every user starts tagged as public.
    OneSignal.User.addTag('role', 'public');

    // Auto-prompt for push permission on load.
    await OneSignal.Notifications.requestPermission().catch(() => {});
  } catch (err) {
    console.warn('OneSignal init failed', err);
  }
}

/**
 * Update the user's role tag. Called with "staff" after a successful staff
 * login. Intentionally never reverts to "public" on logout.
 */
export async function setOneSignalRole(role: 'public' | 'staff'): Promise<void> {
  if (!initialized || !isConfigured()) return;
  try {
    OneSignal.User.addTag('role', role);
  } catch (err) {
    console.warn('OneSignal addTag failed', err);
  }
}
