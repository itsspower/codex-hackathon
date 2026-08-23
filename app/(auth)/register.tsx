import { Href, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Role = 'student' | 'business' | 'alumni';

export default function RegisterScreen() {
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !name) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    if (error) {
      setLoading(false);
      Alert.alert('Registration failed', error.message);
      return;
    }
    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      Alert.alert('Registration failed', 'No user returned - please try again.');
      return;
    }
    const table = role === 'student' ? 'student_profiles'
      : role === 'business' ? 'business_profiles'
      : 'alumni_profiles';
    const nameField = role === 'student' ? { name }
      : role === 'business' ? { business_name: name }
      : { first_name: name };
    const { error: profileError } = await supabase
      .from(table)
      .insert({ user_id: userId, ...nameField });
    setLoading(false);
    if (profileError) {
      Alert.alert('Profile setup failed', profileError.message);
      return;
    }
    Alert.alert('Success', 'Account created!');
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your CodeX account</Text>
      <View style={styles.roleRow}>
        {(['student', 'business', 'alumni'] as Role[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={[styles.roleButton, role === r && styles.roleButtonActive]}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder={role === 'business' ? 'Company name' : 'Full name'}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable style={styles.submitButton} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Register</Text>}
      </Pressable>
      <Pressable onPress={() => router.push('/(auth)/login' as Href)}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  roleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1F3F7A', alignItems: 'center' },
  roleButtonActive: { backgroundColor: '#1F3F7A' },
  roleText: { color: '#1F3F7A', fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 16 },
  submitButton: { backgroundColor: '#1F3F7A', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 16, color: '#1F3F7A' },
});