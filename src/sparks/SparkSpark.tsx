import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { HapticFeedback } from '../utils/haptics';
import { ServiceFactory } from '../services/ServiceFactory';
import { getFirestore, collection, doc, setDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  SettingsContainer,
  SettingsScrollView,
  SettingsHeader,
  SettingsSection,
  SettingsFeedbackSection,
  SettingsText,
  SettingsButton,
} from '../components/SettingsComponents';

// Dropdown Component (copied from other sparks for standalone use)
const Dropdown: React.FC<{
  options: readonly string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  style?: any;
  textStyle?: any;
}> = ({ options, selectedValue, onSelect, placeholder, style, textStyle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={{ position: 'relative' }}>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={[style, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 50 }]}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{selectedValue || placeholder}</Text>
        <Text style={[textStyle, { fontSize: 12 }]}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {isOpen ? (
        <View style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 6,
          zIndex: 1000,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          maxHeight: 200,
          marginTop: 2,
        }}>
          <ScrollView 
            style={{ maxHeight: 200 }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
          >
            {options?.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                  minHeight: 44,
                }}
                activeOpacity={0.7}
              >
                <Text style={[textStyle, { color: '#333' }]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

interface SparkSubmission {
  id: string;
  userId: string;
  timestamp: number;
  sparkName: string;
  description: string;
  customer: string;
  customerPayment: string;
  creationPayment: string;
  email: string;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'built';
}

const PAYMENT_OPTIONS = [
  'Nothing',
  'About $100',
  'Maybe $500-$1000',
  'Over $1000'
];

interface SparkSparkProps {
  showSettings?: boolean;
  onCloseSettings?: () => void;
  onStateChange?: (data: any) => void;
  onComplete?: (result: any) => void;
}

export default function SparkSpark({ showSettings = false, onCloseSettings }: SparkSparkProps) {
  const { colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(0); // 0 = intro, 1-6 = form pages, 7 = review, 8 = success
  const [fadeAnim] = useState(new Animated.Value(1));
  const [pastSubmissions, setPastSubmissions] = useState<SparkSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [formData, setFormData] = useState({
    sparkName: '',
    description: '',
    customer: '',
    customerPayment: '',
    creationPayment: 'Nothing',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pageCount = 9;
  const totalSteps = 7;

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation functions
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canProceedToNext = () => {
    switch (currentPage) {
      case 1: // Spark Name
        return formData.sparkName.trim().length >= 3;
      case 2: // Description
        return formData.description.trim().length >= 50;
      case 3: // Customer
        return formData.customer.trim().length >= 20;
      case 4: // Customer Payment
        return formData.customerPayment.trim().length >= 10;
      case 5: // Creation Payment (always has a value)
        return formData.creationPayment !== '';
      case 6: // Email
        return isValidEmail(formData.email.trim());
      default:
        return true;
    }
  };

  const animatePageTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 150);
  };

  const handleNext = () => {
    if (currentPage < pageCount - 1 && canProceedToNext()) {
      HapticFeedback.medium();
      animatePageTransition(() => {
        setCurrentPage(currentPage + 1);
      });
    }
  };

  const handleBack = () => {
    if (currentPage > 0 && !submitted) {
      HapticFeedback.medium();
      animatePageTransition(() => {
        setCurrentPage(currentPage - 1);
      });
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNext() || submitting) return;

    setSubmitting(true);
    HapticFeedback.success();

    try {
      const AnalyticsService = await ServiceFactory.getAnalyticsService();
      const sessionInfo = AnalyticsService.getSessionInfo();

      const submission: SparkSubmission = {
        id: `spark_${Date.now()}_${Math.random()}`,
        userId: sessionInfo.userId || sessionInfo.sessionId || 'anonymous',
        timestamp: Date.now(),
        sparkName: formData.sparkName,
        description: formData.description,
        customer: formData.customer,
        customerPayment: formData.customerPayment,
        creationPayment: formData.creationPayment,
        email: formData.email,
        status: 'submitted',
      };

      // Save to Firestore
      const db = getFirestore();
      await setDoc(doc(collection(db, 'sparkSubmissions'), submission.id), submission);
      
      setSubmitted(true);
      setCurrentPage(8); // Success page
    } catch (error) {
      console.error('Error submitting Spark:', error);
      Alert.alert(
        'Submission Failed',
        'Unable to submit your Spark idea. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderIntro = () => (
    <View style={styles.centerContainer}>
      <Animated.View style={[styles.card, { backgroundColor: colors.surface, opacity: fadeAnim }]}>
        <Text style={[styles.cardIcon, { color: colors.primary }]}>✨</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Spark Spark</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Create your own Spark
        </Text>
        <Text style={[styles.cardDescription, { color: colors.text }]}>
          Do you want to be the Product Manager for your own spark? Where you define the product
          roadmap for your spark, and your engineering + AI team implements your vision and makes
          it available to users overnight?
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              HapticFeedback.medium();
              setCurrentPage(1);
            }}
          >
            <Text style={styles.primaryButtonText}>Let's Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => {
              HapticFeedback.light();
              // Navigate back to spark selection
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Close Spark Spark</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  const renderFormPage = () => {
    const pages = [
      {
        title: 'What do you want to call your Spark?',
        field: 'sparkName',
        placeholder: 'e.g., Restaurant Finder, Study Timer, Habit Tracker',
        multiline: false,
      },
      {
        title: 'Describe what your Spark will do, what problem it solves, and why it should exist.',
        field: 'description',
        placeholder: 'Describe your Spark idea...',
        multiline: true,
      },
      {
        title: 'Describe who this spark is for -- who would use this spark?',
        field: 'customer',
        placeholder: 'e.g., College students, Busy parents, Athletes',
        multiline: true,
      },
      {
        title: 'Would the Spark Customer pay to get this Spark? If so, how much?',
        field: 'customerPayment',
        placeholder: 'e.g., Yes, $2.99 for the full version, or No, it should be free',
        multiline: true,
      },
      {
        title: 'How much would you pay to create this Spark?',
        field: 'creationPayment',
        placeholder: '',
        multiline: false,
        dropdown: true,
      },
      {
        title: 'What is your email?',
        field: 'email',
        placeholder: 'your.email@example.com',
        multiline: false,
      },
    ];

    const page = pages[currentPage - 1];
    const value = formData[page.field as keyof typeof formData];

    return (
      <Animated.View style={[styles.centerContainer, { opacity: fadeAnim }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.pageIndicator, { color: colors.textSecondary }]}>
            Step {currentPage} of {totalSteps}
          </Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{page.title}</Text>
          
          {page.dropdown ? (
            <Dropdown
              options={PAYMENT_OPTIONS}
              selectedValue={value}
              onSelect={(val) => updateFormData(page.field, val)}
              style={styles.dropdown}
              textStyle={[styles.dropdownText, { color: colors.text }]}
            />
          ) : (
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: page.multiline ? 100 : 50,
                }
              ]}
              placeholder={page.placeholder}
              placeholderTextColor={colors.textSecondary}
              value={value}
              onChangeText={(text) => updateFormData(page.field, text)}
              multiline={page.multiline}
              returnKeyType="next"
              onSubmitEditing={() => canProceedToNext() && handleNext()}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderReview = () => (
    <Animated.View style={[styles.centerContainer, { opacity: fadeAnim }]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.pageIndicator, { color: colors.textSecondary }]}>
          Step {totalSteps} of {totalSteps} - Review Your Spark
        </Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Review Your Spark</Text>
        
        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Spark Name:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.sparkName}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Description:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.description}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Customer:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.customer}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Payment Model:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.customerPayment}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Creation Payment:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.creationPayment}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Email:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.email}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderSuccess = () => (
    <Animated.View style={[styles.centerContainer, { opacity: fadeAnim }]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.successIcon]}>✓</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Thank You!</Text>
        <Text style={[styles.cardDescription, { color: colors.text }]}>
          Your Spark idea has been submitted. We'll review it and get back to you at {formData.email}.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            HapticFeedback.medium();
            setCurrentPage(0);
            setFormData({
              sparkName: '',
              description: '',
              customer: '',
              customerPayment: '',
              creationPayment: 'Nothing',
              email: '',
            });
          }}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const loadPastSubmissions = async () => {
    if (!showSettings) return;
    
    setLoadingSubmissions(true);
    try {
      const db = getFirestore();
      const AnalyticsService = await ServiceFactory.getAnalyticsService();
      const sessionInfo = AnalyticsService.getSessionInfo();
      const userId = sessionInfo.userId || sessionInfo.sessionId || 'anonymous';
      
      const submissionsQuery = query(
        collection(db, 'sparkSubmissions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(submissionsQuery);
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SparkSubmission));
      
      setPastSubmissions(submissions);
    } catch (error) {
      console.error('Error loading past submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Load past submissions when settings opens
  useEffect(() => {
    if (showSettings) {
      loadPastSubmissions();
    }
  }, [showSettings]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#FFA500'; // Orange
      case 'reviewed':
        return '#2196F3'; // Blue
      case 'approved':
        return '#4CAF50'; // Green
      case 'rejected':
        return '#F44336'; // Red
      case 'built':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Gray
    }
  };

  const renderSettings = () => (
    <SettingsContainer>
      <SettingsScrollView>
        <SettingsHeader
          title="Spark Spark Settings"
          subtitle="Manage your Spark ideas and submissions"
          icon="✨"
        />

        <SettingsFeedbackSection sparkName="Spark Spark" sparkId="spark-spark" />

        <SettingsSection title="Your Spark Submissions">
          <View style={{ padding: 16, backgroundColor: 'transparent' }}>
            {loadingSubmissions ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Loading...
              </Text>
            ) : pastSubmissions.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                No submissions yet. Submit a Spark idea to get started!
              </Text>
            ) : (
              pastSubmissions.map((submission) => (
                <TouchableOpacity
                  key={submission.id}
                  style={[
                    styles.submissionCard,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <View style={styles.submissionHeader}>
                    <Text style={[styles.submissionTitle, { color: colors.text }]}>
                      {submission.sparkName}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(submission.status) }
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {submission.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.submissionDescription, { color: colors.textSecondary }]}>
                    {submission.description.substring(0, 100)}...
                  </Text>
                  
                  <View style={styles.submissionMeta}>
                    <Text style={[styles.submissionDate, { color: colors.textSecondary }]}>
                      {formatDate(submission.timestamp)}
                    </Text>
                    <Text style={[styles.submissionEmail, { color: colors.textSecondary }]}>
                      {submission.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </SettingsSection>

        <SettingsSection title="About">
          <View style={{ padding: 16, backgroundColor: 'transparent' }}>
            <SettingsText variant="body">
              Spark Spark allows you to submit ideas for new Sparks to be built. Define your vision,
              target customers, and potential pricing. Your ideas will be reviewed and may be implemented
              by our engineering team.
            </SettingsText>
          </View>
        </SettingsSection>

        <View style={styles.settingsButtonContainer}>
          <TouchableOpacity
            style={[
              styles.settingsCloseButton,
              { borderColor: colors.border }
            ]}
            onPress={onCloseSettings}
          >
            <Text style={[styles.settingsCloseButtonText, { color: colors.text }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </SettingsScrollView>
    </SettingsContainer>
  );

  const renderNavigation = () => {
    if (currentPage === 0 || currentPage === 8) return null;

    return (
      <View style={[styles.navigationBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentPage === 1 && styles.navButtonDisabled,
          ]}
          onPress={handleBack}
          disabled={currentPage === 1}
        >
          <Text
            style={[
              styles.navButtonText,
              { color: currentPage === 1 ? colors.textSecondary : colors.primary },
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={[styles.pageNumber, { color: colors.textSecondary }]}>
          {currentPage} of {totalSteps}
        </Text>

        {currentPage === totalSteps ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: colors.primary },
              submitting && styles.navButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || !canProceedToNext()}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>Submit</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: colors.primary },
              !canProceedToNext() && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceedToNext()}
          >
            <Text
              style={[
                styles.navButtonText,
                {
                  color: canProceedToNext() ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (showSettings) {
    return renderSettings();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {currentPage === 0 && renderIntro()}
      {currentPage >= 1 && currentPage <= totalSteps - 1 && renderFormPage()}
      {currentPage === totalSteps && renderReview()}
      {currentPage === 8 && renderSuccess()}
      {renderNavigation()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pageIndicator: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginTop: 16,
  },
  dropdown: {
    marginTop: 16,
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 16,
  },
  reviewSection: {
    marginTop: 16,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  successIcon: {
    fontSize: 64,
    textAlign: 'center',
    color: '#4CAF50',
    marginBottom: 16,
  },
  submissionCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  submissionDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  submissionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submissionDate: {
    fontSize: 12,
  },
  submissionEmail: {
    fontSize: 12,
  },
  settingsButtonContainer: {
    padding: 20,
  },
  settingsCloseButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

