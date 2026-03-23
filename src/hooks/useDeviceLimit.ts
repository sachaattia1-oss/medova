import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX_DEVICES = 2;
const DEVICE_ID_KEY = "medova_device_id";

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iPhone / iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Appareil inconnu";
}

export function useDeviceLimit(userId: string | undefined) {
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const registerDevice = useCallback(async (uid: string) => {
    const deviceId = getOrCreateDeviceId();
    const deviceName = getDeviceName();

    // Upsert current device (updates last_active_at if exists)
    await supabase
      .from("user_devices")
      .upsert(
        { user_id: uid, device_id: deviceId, device_name: deviceName, last_active_at: new Date().toISOString() },
        { onConflict: "user_id,device_id" }
      );

    // Fetch all devices for user
    const { data: devices } = await supabase
      .from("user_devices")
      .select("*")
      .eq("user_id", uid)
      .order("last_active_at", { ascending: false });

    if (!devices) {
      setChecking(false);
      return;
    }

    // If this device is in the top 2 most recent, allow
    const isAllowed = devices.slice(0, MAX_DEVICES).some((d) => d.device_id === deviceId);

    if (!isAllowed) {
      // Too many devices - block this one
      setBlocked(true);
      await supabase.auth.signOut();
    } else {
      setBlocked(false);
      // Clean up devices beyond the limit (keep only 2 most recent)
      const toRemove = devices.slice(MAX_DEVICES);
      if (toRemove.length > 0) {
        await supabase
          .from("user_devices")
          .delete()
          .in("id", toRemove.map((d) => d.id));
      }
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (userId) {
      registerDevice(userId);
    } else {
      setChecking(false);
      setBlocked(false);
    }
  }, [userId, registerDevice]);

  // Heartbeat: update last_active_at every 5 min
  useEffect(() => {
    if (!userId || blocked) return;
    const interval = setInterval(async () => {
      const deviceId = getOrCreateDeviceId();
      await supabase
        .from("user_devices")
        .update({ last_active_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("device_id", deviceId);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, blocked]);

  return { blocked, checking };
}
