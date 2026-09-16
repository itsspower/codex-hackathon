import { SKILL_CATEGORIES } from '@/constants/skills';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  CV_MIME_TYPES,
  deleteStudentCv,
  StudentCvAsset,
  StudentProfile,
  saveStudentProfile,
  uploadStudentCv,
} from '@/lib/studentProfile';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [campus, setCampus] = useState('');
  const [course, setCourse] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [otherInterest, setOtherInterest] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [certifications, setCertifications] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [cvUploadedAt, setCvUploadedAt] = useState('');
  const [pendingCvAsset, setPendingCvAsset] = useState<StudentCvAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('student_profiles').select('name, surname, campus, course, interests, interests_other, qualifications, experience, certifications, cv_url, cv_file_name, cv_uploaded_at').eq('user_id', user.id).maybeSingle();
      const profile = data as StudentProfile | null;
      if (!profile) return;
      setName(profile.name ?? '');
      setSurname(profile.surname ?? '');
      setCampus(profile.campus ?? '');
      setCourse(profile.course ?? '');
      setSelectedInterests(profile.interests ?? []);
      setOtherInterest(profile.interests_other ?? '');
      setQualifications(profile.qualifications ?? '');
      setExperience(profile.experience ?? '');
      setCertifications(profile.certifications ?? '');
      setCvUrl(profile.cv_url ?? '');
      setCvFileName(profile.cv_file_name ?? '');
      setCvUploadedAt(profile.cv_uploaded_at ?? '');
    })();
  }, []);

  function toggleInterest(tag: string) {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    if (!campus.trim() || !course.trim()) {
      Alert.alert('Missing info', 'Please provide your campus and course.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      Alert.alert('Not logged in', 'Please log in again.');
      return;
    }

    let nextCvUrl = cvUrl || null;
    let nextCvFileName = cvFileName || null;
    let nextCvUploadedAt = cvUploadedAt || null;
    let uploadedCvPath: string | null = null;

    if (pendingCvAsset) {
      const uploadResult = await uploadStudentCv(user.id, pendingCvAsset);
      if (uploadResult.error || !uploadResult.path) {
        setLoading(false);
        Alert.alert('CV upload unavailable', uploadResult.error ?? 'The CV could not be uploaded.');
        return;
      }
      uploadedCvPath = uploadResult.path;
      nextCvUrl = uploadResult.path;
      nextCvFileName = pendingCvAsset.name;
      nextCvUploadedAt = new Date().toISOString();
    }

    const errorMessage = await saveStudentProfile(user.id, {
        name: name.trim(),
        surname: surname.trim(),
        campus: campus.trim(),
        course: course.trim(),
        interests: selectedInterests,
        interests_other: otherInterest.trim() || null,
        qualifications: qualifications.trim() || null,
        experience: experience.trim() || null,
        certifications: certifications.trim() || null,
        cv_url: nextCvUrl,
        cv_file_name: nextCvFileName,
        cv_uploaded_at: nextCvUploadedAt,
      }, 'update');

    setLoading(false);

    if (errorMessage) {
      if (uploadedCvPath) {
        const cleanupError = await deleteStudentCv(uploadedCvPath);
        if (cleanupError) console.warn('New CV cleanup failed after profile save failure:', cleanupError);
      }
      Alert.alert('Save failed', errorMessage);
      return;
    }

    if (uploadedCvPath && cvUrl && cvUrl !== uploadedCvPath) {
      const cleanupError = await deleteStudentCv(cvUrl);
      if (cleanupError) console.warn('Previous CV cleanup failed:', cleanupError);
    }
    setCvUrl(nextCvUrl ?? '');
    setCvFileName(nextCvFileName ?? '');
    setCvUploadedAt(nextCvUploadedAt ?? '');
    setPendingCvAsset(null);
    Alert.alert('Success', 'Profile updated!');
    router.back();
  }

  async function selectCv() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [...CV_MIME_TYPES],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('CV upload unavailable', 'Please log in again.');
      return;
    }
    const asset: StudentCvAsset = result.assets[0];
    setPendingCvAsset(asset);
    setCvFileName(asset.name);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.title}>Set Up Your Profile</Text>

      <TextInput style={styles.input} placeholder="First name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Surname" value={surname} onChangeText={setSurname} />
      <TextInput style={styles.input} placeholder="Campus" value={campus} onChangeText={setCampus} />
      <TextInput style={styles.input} placeholder="Course" value={course} onChangeText={setCourse} />
      <TextInput style={styles.input} placeholder="Qualifications (optional)" value={qualifications} onChangeText={setQualifications} />
      <TextInput style={[styles.input, styles.multiline]} placeholder="Experience (optional)" value={experience} onChangeText={setExperience} multiline />
      <TextInput style={[styles.input, styles.multiline]} placeholder="Certifications (optional)" value={certifications} onChangeText={setCertifications} multiline />
      <Text style={styles.cvStatus}>
        {cvFileName ? `${pendingCvAsset ? 'CV selected' : 'CV uploaded'}: ${cvFileName}` : 'No CV uploaded yet.'}
      </Text>
      <Pressable style={styles.secondaryButton} onPress={() => void selectCv()}>
        <Text style={styles.secondaryButtonText}>{cvFileName ? 'Replace CV' : 'Upload CV'}</Text>
      </Pressable>

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
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  cvStatus: { fontSize: 16, color: '#555', marginBottom: 8 },
  secondaryButton: { borderWidth: 1, borderColor: '#1F3F7A', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 14 },
  secondaryButtonText: { color: '#1F3F7A', fontWeight: '700', fontSize: 16 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#1F3F7A' },
  tagSelected: { backgroundColor: '#1F3F7A' },
  tagText: { color: '#1F3F7A', fontSize: 13 },
  tagTextSelected: { color: '#fff' },
  submitButton: { backgroundColor: '#1F3F7A', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
