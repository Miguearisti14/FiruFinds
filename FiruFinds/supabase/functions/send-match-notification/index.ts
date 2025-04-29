import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to send push notification via Expo
async function sendPushNotification(pushToken: string, title: string, body: string) {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

serve(async (req) => {
  try {
    const payload = await req.json();
    const { record } = payload; // The new record inserted into coincidencias_notificadas

    // Extract the coincidence details
    const { coincidencia_id } = record;

    // Fetch the match details from vista_coincidencias_potenciales
    const { data: match, error: matchError } = await supabase
      .from('vista_coincidencias_potenciales')
      .select('*')
      .eq('coincidencia_id', coincidencia_id)
      .single();

    if (matchError || !match) {
      throw new Error('Match not found or error: ' + matchError?.message);
    }

    const { usuario_perdida_id, porcentaje_coincidencia, raza, especie } = match;

    // Fetch the push token of the user who reported the lost pet
    const { data: userToken, error: tokenError } = await supabase
      .from('user_push_tokens')
      .select('push_token')
      .eq('user_id', usuario_perdida_id)
      .single();

    if (tokenError || !userToken) {
      throw new Error('User push token not found or error: ' + tokenError?.message);
    }

    const pushToken = userToken.push_token;

    // Send the push notification
    const title = '¡Posible coincidencia encontrada!';
    const body = `Se encontró una mascota (${especie} - ${raza}) que coincide en un ${porcentaje_coincidencia}% con tu reporte.`;
    await sendPushNotification(pushToken, title, body);

    return new Response(JSON.stringify({ message: 'Notification sent successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in send-match-notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});