import { Href, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Role = 'student' | 'business' | 'alumni';

const roleOptions: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'business', label: 'Business' },
  { value: 'alumni', label: 'Alumni' },
];

export default function RegisterScreen() {
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !name) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }

    const strongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);
    if (!strongPassword) {
      setPasswordError(
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
      );
      return;
    }

    setPasswordError('');
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
    if (!data.session) {
      setLoading(false);
      Alert.alert('Account created', 'Please confirm your email, then log in to continue.');
      return;
    }
    const table = role === 'student' ? 'student_profiles'
      : role === 'business' ? 'business_profiles'
      : 'alumni_profiles';
    const nameField = role === 'student' ? { name }
      : role === 'business'
        ? {
            business_name: name,
            location: address.trim() || null,
            business_phone: phone.trim() || null,
            business_website: website.trim() || null,
            industry_category: industry.trim() || null,
            company_description: description.trim() || null,
            contact_person_name: contactPerson.trim() || null,
          }
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
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your CodeX account</Text>
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
      <>
        <TextInput
          style={styles.input}
          placeholder={role === 'business' ? 'Company name' : 'Full name'}
          value={name}
          onChangeText={setName}
        />
        {role === 'business' ? (
          <>
            <TextInput style={styles.input} placeholder="Company address" value={address} onChangeText={setAddress} />
            <TextInput style={styles.input} placeholder="Phone number" value={phone} onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Industry" value={industry} onChangeText={setIndustry} />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Company description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput style={styles.input} placeholder="Contact person" value={contactPerson} onChangeText={setContactPerson} />
          </>
        ) : null}
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
          {passwordError ? <Text style={styles.passwordError}>{passwordError}</Text> : null}
          <Pressable style={styles.submitButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Register</Text>}
          </Pressable>
          <Pressable onPress={() => router.push('/(auth)/login' as Href)}>
            <Text style={styles.link}>Already have an account? Log in</Text>
          </Pressable>
      </>
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
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  passwordError: { color: '#B00020', marginTop: -6, marginBottom: 14, lineHeight: 20 },
  submitButton: { backgroundColor: '#1F3F7A', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 16, color: '#1F3F7A' },
});