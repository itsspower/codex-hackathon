import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function AdminDashboardPlaceholder() {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard - Coming Soon</Text>
      <Pressable style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
        {loggingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.logoutText}>Log Out</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  logoutButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#1F3F7A' },
  logoutText: { color: '#fff', fontWeight: '700' },
});
