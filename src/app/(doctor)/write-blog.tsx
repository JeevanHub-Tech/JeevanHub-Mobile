// src/app/(doctor)/write-blog.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react-native';
import { doctorApi } from '../../api/doctor';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
  'Ayurvedic Nutrition & Diet',
  'Dinacharya & Daily Routine',
  'Herbal Remedies & Formulations',
  'Panchakarma & Detoxification',
  'Mind, Yoga & Pranayama',
  'Seasonal Wellness (Ritucharya)',
];

export default function WriteBlogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(isEditMode);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      doctorApi
        .getBlogById(id)
        .then((blog) => {
          if (blog) {
            setTitle(blog.title || '');
            setCategory(blog.category || CATEGORIES[0]);
            setDescription(blog.description || '');
            setCoverImage(blog.image || null);
          }
        })
        .catch((err) => {
          console.warn('Error loading blog:', err);
          Alert.alert('Error', 'Failed to load blog for editing.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  // Pick & Upload Cover Image
  const handlePickCoverImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setUploadingImage(true);
        const uploadedUrl = await doctorApi.uploadBlogImage(
          file.uri,
          file.fileName || 'cover.jpg',
          file.mimeType || 'image/jpeg'
        );
        if (uploadedUrl) {
          setCoverImage(uploadedUrl);
        } else {
          setCoverImage(file.uri);
        }
      }
    } catch (err: any) {
      Alert.alert('Image Picker Error', err?.message || 'Could not pick image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // AI Blog Drafter (Generates structured Ayurvedic clinical article)
  const handleGenerateAiDraft = () => {
    if (!title.trim()) {
      Alert.alert(
        'Topic Needed',
        'Please enter a headline or topic in the title field first so the AI can craft the article around it!'
      );
      return;
    }

    setGeneratingAi(true);
    setTimeout(() => {
      const topic = title.trim();
      const generatedArticle = `
# ${topic}
*An Ayurvedic Clinical Perspective by Dr. ${user?.firstName || 'Physician'}*

### 🌿 Classical Context & Dosha Dynamics
In classical Ayurvedic wisdom according to the *Charaka Samhita*, optimal health (*Swastha*) is achieved through the equilibrium of the three biological humors (*Tridoshas* — Vata, Pitta, and Kapha), balanced metabolic fire (*Agni*), and undisturbed mental tranquility (*Prasanna Atma, Indriya, Manas*).

When we examine ${topic.toLowerCase()}, the underlying imbalance typically manifests through disturbances in digestive fire and the accumulation of metabolic toxins (*Ama*).

### 🥗 Dietary Recommendations (Ahara)
1. **Favor (Pathya):** Warm, freshly prepared seasonal meals seasoned with therapeutic digestive spices such as dry ginger (*Shunti*), cumin (*Jeera*), and fennel (*Saunf*).
2. **Avoid (Apathya):** Heavy, excessively oily, deep-fried foods, cold beverages, and incompatible food combinations (*Viruddha Ahara*).

### 🧘 Daily Routine & Lifestyle (Vihara)
- **Brahma Muhurta Wakeup:** Awaken before dawn to synchronize your biological rhythm with nature's sattvic energy.
- **Abhyanga:** Gentle self-massage with warm sesame or coconut oil to pacify aggregated Vata dosha and nourish peripheral tissues.
- **Pranayama:** 10 minutes of alternate nostril breathing (*Nadi Shodhana*) and *Bhramari* to alleviate neuro-endocrine stress.

### 💊 Classical Herbal Allies
Standard traditional formulations frequently recommended under clinical supervision include:
- **Triphala Churna:** Gentle digestive regulator and cellular rejuvenator.
- **Ashwagandha / Brahmi:** Adaptogenic tonics to strengthen the nervous system and immune resilience (*Ojas*).

---
*Disclaimer: This educational article is intended for general Ayurvedic wellness guidance. Patients are advised to consult directly for personalized constitution assessment and treatment plans.*
      `.trim();

      setDescription(generatedArticle);
      setGeneratingAi(false);
      Alert.alert(
        'AI Draft Generated',
        'A comprehensive Ayurvedic article has been drafted! You can review, personalize, and edit the text before publishing.'
      );
    }, 1200);
  };

  // Publish / Update Blog
  const handlePublish = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Both title and article content are required.');
      return;
    }

    if (!user?.id) return;

    setSubmitting(true);
    try {
      if (isEditMode && id) {
        await doctorApi.updateBlog(id, {
          title: title.trim(),
          description: description.trim(),
          category,
          image: coverImage || undefined,
        });
        Alert.alert('Published', 'Your blog post has been successfully updated!');
      } else {
        await doctorApi.createBlog({
          title: title.trim(),
          description: description.trim(),
          category,
          image: coverImage || undefined,
          authorId: user.id,
          authorType: 'doctor',
        });
        Alert.alert('Published', 'Your new Ayurvedic health article has been published to the community!');
      }
      router.replace('/(doctor)/blogs' as any);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save blog post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.oliveDeep} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Article' : 'Write Health Blog'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Publish clinical advice for patients
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.publishHeaderBtn, submitting && styles.btnDisabled]}
          onPress={handlePublish}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.cream} />
          ) : (
            <>
              <Send size={14} color={Colors.cream} />
              <Text style={styles.publishHeaderBtnText}>
                {isEditMode ? 'Update' : 'Publish'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={Colors.olive} />
            </View>
          ) : (
            <>
              {/* Cover Image Picker */}
              <View style={styles.cardBox}>
                <Text style={styles.inputLabel}>Cover Image (Optional)</Text>
                {coverImage ? (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: coverImage }} style={styles.coverImagePreview} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setCoverImage(null)}
                    >
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadImageBtn}
                    onPress={handlePickCoverImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={Colors.oliveDeep} />
                    ) : (
                      <>
                        <ImageIcon size={28} color={Colors.oliveDeep} />
                        <Text style={styles.uploadImageBtnText}>
                          Select Cover Photo (16:9 ratio recommended)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Title & Category */}
              <View style={styles.cardBox}>
                <Text style={styles.inputLabel}>Article Headline / Title *</Text>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Managing Pitta Disorders during Sharad Ritu"
                  placeholderTextColor={Colors.inkMuted}
                />

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                  Clinical Category *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        category === cat && styles.categoryChipActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AI Assistant Callout */}
              <View style={styles.aiAssistBox}>
                <View style={styles.aiAssistHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={18} color="#d97706" />
                    <Text style={styles.aiAssistTitle}>Ayurvedic AI Co-Author</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.aiGenerateBtn, generatingAi && styles.btnDisabled]}
                    onPress={handleGenerateAiDraft}
                    disabled={generatingAi}
                  >
                    {generatingAi ? (
                      <ActivityIndicator size="small" color={Colors.cream} />
                    ) : (
                      <>
                        <Wand2 size={13} color={Colors.cream} />
                        <Text style={styles.aiGenerateBtnText}>Generate Draft</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.aiAssistDesc}>
                  Enter a topic in the title above, then tap "Generate Draft" to generate an authoritative Ayurvedic article covering classical context, diet, lifestyle, and herbology.
                </Text>
              </View>

              {/* Description Content */}
              <View style={styles.cardBox}>
                <Text style={styles.inputLabel}>Article Content (Markdown supported) *</Text>
                <TextInput
                  style={styles.bodyInput}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={16}
                  placeholder="Write your article here, cite classical principles, and share clinical observations..."
                  placeholderTextColor={Colors.inkMuted}
                  textAlignVertical="top"
                />
              </View>

              {/* Bottom Publish Button */}
              <TouchableOpacity
                style={[styles.mainPublishBtn, submitting && styles.btnDisabled]}
                onPress={handlePublish}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.cream} />
                ) : (
                  <>
                    <Send size={16} color={Colors.cream} />
                    <Text style={styles.mainPublishBtnText}>
                      {isEditMode ? 'Update Article' : 'Publish Article'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.oliveDeep,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  publishHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.oliveAction,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  publishHeaderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cream,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  centerBox: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.inkStrong,
  },
  titleInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.oliveAction,
    borderColor: Colors.oliveAction,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted,
  },
  categoryChipTextActive: {
    color: Colors.cream,
  },
  imagePreviewWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffffff',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  uploadImageBtn: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadImageBtnText: {
    fontSize: 12,
    color: Colors.inkMuted,
    fontWeight: '600',
  },
  aiAssistBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 8,
  },
  aiAssistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiAssistTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  aiAssistDesc: {
    fontSize: 11,
    color: '#b45309',
    lineHeight: 15,
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#b45309',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiGenerateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.cream,
  },
  bodyInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: Colors.inkStrong,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 220,
    lineHeight: 20,
  },
  mainPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.oliveAction,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  mainPublishBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.cream,
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
