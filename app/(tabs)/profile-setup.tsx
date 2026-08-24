@'
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SKILL_CATEGORIES } from '@/constants/skills';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [campus, setCampus] = useState('');
  const [course, setCourse] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [otherInterest, setOtherInterest] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleInterest(tag: string) {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    if (!name || !surname || !campus || !course) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      Alert.alert('Not logged in', 'Please log in again.');
      return;
    }

    const { error } = await supabase
      .from('student_profiles')
      .update({
        name,
        surname,
        campus,
        course,
        interests: selectedInterests,
        interests_other: otherInterest || null,
      })
      .eq('user_id', user.id);

    setLoading(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }

    Alert.alert('Success', 'Profile updated!');
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.title}>Set Up Your Profile</Text>

      <TextInput style={styles.input} placeholder="First name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Surname" value={surname} onChangeText={setSurname} />
      <TextInput style={styles.input} placeholder="Campus" value={campus} onChangeText={setCampus} />
      <TextInput style={styles.input} placeholder="Course" value={course} onChangeText={setCourse} />

      <Text style={styles.sectionTitle}>Interests</Text>
      {Object.entries(SKILL_CATEGORIES).map(([category, tags]) => (
        <View key={category} style={{ marginBottom: 16 }}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={styles.tagWrap}>
            {tags.map((tag) => {
              const selected = selectedInterests.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleInterest(tag)}
                  style={[styles.tag, selected && styles.tagSelected]}
                >
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Other (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Type a custom skill or interest"
        value={otherInterest}
        onChangeText={setOtherInterest}
      />

      <Pressable style={styles.submitButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save Profile</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 8, color: '#1F3F7A' },
  categoryTitle: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 16 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#1F3F7A' },
  tagSelected: { backgroundColor: '#1F3F7A' },
  tagText: { color: '#1F3F7A', fontSize: 13 },
  tagTextSelected: { color: '#fff' },
  submitButton: { backgroundColor: '#1F3F7A', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
'@ | Set-Content -Path "app/(tabs)/profile-setup.tsx" -NoNewline