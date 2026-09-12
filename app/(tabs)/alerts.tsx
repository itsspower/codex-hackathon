import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
} from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Notification = {
  id: string;
  message: string;
  type: string | null;
  read_status: boolean;
  created_at: string;
};

export default function AlertsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(userError?.message ?? 'Your session could not be loaded.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, message, type, read_status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) setErrorMessage(error.message);
    else setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  async function markAsRead(notification: Notification) {
    if (notification.read_status) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('id', notification.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) => item.id === notification.id ? { ...item, read_status: true } : item)
    );
  }

  if (loading && notifications.length === 0) return <LoadingState message="Loading alerts..." />;
  if (errorMessage && notifications.length === 0) return <ErrorState message={errorMessage} />;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Alerts" subtitle="Stay up to date" />
      {notifications.length === 0 ? (
        <EmptyState title="No alerts yet" message="Your latest activity will appear here." />
      ) : (
        notifications.map((notification) => (
          <Pressable key={notification.id} onPress={() => void markAsRead(notification)}>
            <Card style={[styles.card, !notification.read_status && styles.unreadCard]}>
              <View style={styles.header}>
                <Text style={styles.message}>{notification.message}</Text>
                {!notification.read_status ? <Badge tone="primary">New</Badge> : null}
              </View>
              <Text style={styles.meta}>
                {notification.type ? `${notification.type} · ` : ''}
                {new Date(notification.created_at).toLocaleDateString()}
              </Text>
            </Card>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  unreadCard: { borderColor: RelinkColors.primary },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  message: { flex: 1, color: RelinkColors.text, ...Typography.bodyStrong },
  meta: { color: RelinkColors.muted, ...Typography.caption, marginTop: Spacing.sm },
});
