// Supabase Edge Function to send scheduled teaching reminders using Deno and npm:web-push
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "BGE25JujCMx_cliddjOArNL459tKtWIKw3zQzvs4wFBFr-ZrvVEFwxvEBRQ4zrFT3BDCOyVCOiLAxboPo9z-SlI";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "9RZqijFFkxVY_ltZ2WogfYBizPrzLOoYAWr8QItvQbA";
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") || "mailto:admin@tqa-madiun.sch.id";

// Configure web-push details
webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Define teaching schedules
const JADWAL_MENGAJAR: Record<string, Array<{ class: string; start: string; end: string }>> = {
  'Senin': [
    { class: 'Kelas 5C', start: '07:30', end: '08:40' },
    { class: 'Kelas 6D', start: '08:40', end: '09:50' },
    { class: 'Kelas 6C', start: '10:05', end: '11:15' },
    { class: 'Kelas 5D', start: '11:15', end: '12:25' },
    { class: 'Kelas 5B', start: '13:10', end: '13:45' }
  ],
  'Selasa': [
    { class: 'Kelas 6C', start: '07:30', end: '08:40' },
    { class: 'Kelas 5B', start: '08:40', end: '09:50' },
    { class: 'Kelas 5C', start: '10:05', end: '11:15' },
    { class: 'Kelas 6D', start: '13:10', end: '13:45' },
    { class: 'Kelas 5D', start: '13:45', end: '14:55' }
  ],
  'Rabu': [
    { class: 'Kelas 5B', start: '07:30', end: '08:40' },
    { class: 'Kelas 5C', start: '10:05', end: '11:15' },
    { class: 'Kelas 6D', start: '11:15', end: '12:25' },
    { class: 'Kelas 6C', start: '13:10', end: '13:45' },
    { class: 'Kelas 5D', start: '13:45', end: '14:55' }
  ],
  'Kamis': [
    { class: 'Kelas 5B', start: '08:40', end: '09:50' },
    { class: 'Kelas 6C', start: '10:05', end: '11:15' },
    { class: 'Kelas 6D', start: '11:15', end: '12:25' },
    { class: 'Kelas 5C', start: '13:10', end: '13:45' },
    { class: 'Kelas 5D', start: '14:20', end: '14:55' }
  ]
};

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

serve(async (req) => {
  // Allow OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current date/time in Jakarta timezone (UTC +7)
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const jakartaTime = new Date(utcTime + 3600000 * 7);

    const dayName = INDO_DAYS[jakartaTime.getDay()];
    const currentHours = jakartaTime.getHours();
    const currentMinutes = jakartaTime.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    console.log(`[Reminders] Checking schedule for day: ${dayName}, Time: ${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`);

    const todaysClasses = JADWAL_MENGAJAR[dayName] || [];
    const upcomingClass = todaysClasses.find(c => {
      const [startH, startM] = c.start.split(':').map(Number);
      const startTotalMinutes = startH * 60 + startM;
      
      // Trigger notification exactly when the class hours begin.
      // Since the cron runs every 5 minutes and class starts are multiples of 5 minutes,
      // a range of -2 to 2 minutes matches the start time perfectly.
      const diff = startTotalMinutes - currentTotalMinutes;
      return diff >= -2 && diff <= 2;
    });

    if (!upcomingClass) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Tidak ada jadwal kelas yang dimulai saat ini." 
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`[Reminders] Class starting now: ${upcomingClass.class} starting at ${upcomingClass.start}`);

    // Fetch all registered push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Tidak ada pelanggan push notification aktif di database." 
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const payload = JSON.stringify({
      title: "Waktu Mengajar Dimulai!",
      body: `Ustadz/Ustadzah, jam pelajaran di ${upcomingClass.class} telah dimulai (${upcomingClass.start} - ${upcomingClass.end}). Silakan masuk kelas. Semangat!`,
      icon: "/logo.png",
      badge: "/logo.png",
      data: {
        action: "open_schedule",
        classId: upcomingClass.class
      }
    });

    let successCount = 0;
    let failCount = 0;

    // Send push notification to all subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription_json,
          payload
        );
        successCount++;
      } catch (sendErr) {
        console.error(`[Reminders] Failed to send push to user ${sub.user_name} (${sub.user_id}):`, sendErr);
        failCount++;
        
        // If the subscription is no longer active (404/410), delete it from db
        if (sendErr.statusCode === 404 || sendErr.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          console.log(`[Reminders] Cleaned up expired subscription for user ${sub.user_name}`);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({
      success: true,
      message: `Berhasil mengirimkan notifikasi jadwal. Berhasil: ${successCount}, Gagal: ${failCount}`,
      upcomingClass
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[Reminders] Error running edge function:", err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
