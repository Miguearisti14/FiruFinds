// utils/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configura el handler de notificaciones (para que se muestren en foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Registra el dispositivo para recibir push notifications
 * y almacena el token en Supabase.
 */
export async function registerForPushNotificationsAsync(userId: string) {
    // Sólo en dispositivo físico
    if (!Device.isDevice) {
        console.log('❌ Debes usar un dispositivo físico para Push Notifications');
        return;
    }

    // 1. Pedir permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log('❌ No se concedieron permisos de notificación');
        return;
    }

    // 2. Obtener token Expo
    const projectId = 'b38419db-50eb-4f7e-8e73-eace47a9e011';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('✅ Push Token:', token);

    // 3. Configurar canal Android
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // 4. Guardar el token en Supabase
    if (token && userId) {
        const { data, error } = await supabase
            .from('user_push_tokens')
            .upsert(
                [{ user_id: userId, push_token: token }],  // <- array
                { onConflict: 'user_id' }
            );

        if (error) {
            console.error('Error guardando push token:', error);
        } else {
            console.log('Push token guardado exitosamente:', data);
        }
    }

    return token;
}

/**
 * Registra listeners para notificaciones recibidas y respuestas
 */
export function setupNotificationListeners() {
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notificación recibida en foreground:', notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Respuesta a notificación:', response);
    });

    return () => {
        foregroundSub.remove();
        responseSub.remove();
    };
}
