import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Role = 'student' | 'alumni' | 'business' | 'admin';

const roleOptions: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'business', label: 'Business' },
  { value: 'admin', label: 'Administrator' },
];

export default function LoginScreen() {
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert('Login failed', error.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      await supabase.auth.signOut();
      setLoading(false);
      Alert.alert('Login failed', 'No authenticated account was returned. Please try again.');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || profile?.role !== role) {
      await supabase.auth.signOut();
      setLoading(false);
      if (profileError) {
        Alert.alert('Login failed', `Unable to verify your account role: ${profileError.message}`);
      } else {
        const selectedRole = roleOptions.find((option) => option.value === role)?.label ?? role;
        const article = /^[AEIOU]/.test(selectedRole) ? 'an' : 'a';
        Alert.alert('Login failed', `This account is not registered as ${article} ${selectedRole}.`);
      }
      return;
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in to CodeX</Text>

      <View style={styles.roleRow}>
        {roleOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setRole(option.value)}
            style={[styles.roleButton, role === option.value && styles.roleButtonActive]}
          >
            <Text style={[styles.roleText, role === option.value && styles.roleTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

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

      <Pressable style={styles.submitButton} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Log In</Text>}
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
});