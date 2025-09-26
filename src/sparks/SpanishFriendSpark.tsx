import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { HapticFeedback } from '../utils/haptics';

interface SpanishFriendSparkProps {
  showSettings?: boolean;
  onCloseSettings?: () => void;
  onStateChange?: (state: any) => void;
  onComplete?: (result: any) => void;
}

export const SpanishFriendSpark: React.FC<SpanishFriendSparkProps> = ({
  onStateChange,
}) => {
  const { colors } = useTheme();
  const [audioSessionSet, setAudioSessionSet] = useState(false);
  const [currentVoice, setCurrentVoice] = useState('es-ES'); // Default to Spain Spanish
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [conversationMode, setConversationMode] = useState<'1-friend' | '2-friends'>('1-friend');
  const [showSettings, setShowSettings] = useState(false);

  // Beach planning conversation
  const conversation = [
    { spanish: "¡Hola Miguel! ¿Qué tal tu día?", english: "Hi Miguel! How's your day?", speaker: 'friend1' },
    { spanish: "¡Muy bien! Hace mucho calor hoy.", english: "Very good! It's so hot today.", speaker: 'friend2' },
    { spanish: "¡Exacto! ¿Te apetece ir a la playa?", english: "Exactly! Do you feel like going to the beach?", speaker: 'friend1' },
    { spanish: "¡Me encanta la idea! ¿A qué hora vamos?", english: "I love the idea! What time should we go?", speaker: 'friend2' },
    { spanish: "¿Qué tal a las dos? Así evitamos las multitudes.", english: "How about at two? That way we avoid the crowds.", speaker: 'friend1' },
    { spanish: "Perfecto. ¿Traigo algo de comer?", english: "Perfect. Should I bring something to eat?", speaker: 'friend2' },
    { spanish: "Sí, yo llevo las bebidas y el protector solar.", english: "Yes, I'll bring the drinks and sunscreen.", speaker: 'friend1' },
    { spanish: "Genial. ¿Vamos a nadar o solo a relajarnos?", english: "Great. Are we going to swim or just relax?", speaker: 'friend2' },
    { spanish: "¡Las dos cosas! El agua está perfecta.", english: "Both! The water is perfect.", speaker: 'friend1' },
    { spanish: "¡Perfecto! Nos vemos en la playa entonces.", english: "Perfect! See you at the beach then.", speaker: 'friend2' }
  ];

  const getCurrentPhrase = () => conversation[currentPhraseIndex];

  const setupAudioSession = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true, // This is key for iOS silent mode
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      setAudioSessionSet(true);
    } catch (error) {
      console.error('Audio session setup failed:', error);
    }
  };

  const speakSpanish = async (text: string, speaker: 'friend1' | 'friend2' = 'friend1') => {
    try {
      // Ensure audio session is set up
      if (!audioSessionSet) {
        await setupAudioSession();
      }

      // Stop any current speech first
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        Speech.stop();
      }

      // Ana (friend1) uses female voice (Spain Spanish), Miguel (friend2) uses male voice (Mexico Spanish)
      const voiceSettings = speaker === 'friend1'
        ? { language: 'es-ES', pitch: 1.1, rate: 0.7 } // Female - Spain Spanish, higher pitch
        : { language: 'es-MX', pitch: 0.8, rate: 0.7 }; // Male - Mexico Spanish, lower pitch

      Speech.speak(text, {
        language: voiceSettings.language,
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        volume: 1.0,
        onStart: () => {
          HapticFeedback.light();
        },
        onDone: () => {
          HapticFeedback.light();
        },
        onError: (error) => {
          console.error('Speech error:', error);
        },
      });
    } catch (error) {
      console.error('Error in speakSpanish:', error);
    }
  };

  // Set up audio session when component loads
  useEffect(() => {
    setupAudioSession();
  }, []);

  const handleContinue = () => {
    const nextIndex = (currentPhraseIndex + 1) % conversation.length;
    setCurrentPhraseIndex(nextIndex);
    const nextPhrase = conversation[nextIndex];

    if (conversationMode === '2-friends') {
      // In 2-friends mode, phone speaks with different voices for each character
      speakSpanish(nextPhrase.spanish, nextPhrase.speaker);
    }
    // In 1-friend mode, only phone speaks for friend1 (Ana), user speaks for friend2 (Miguel)
    else if (nextPhrase.speaker === 'friend1') {
      speakSpanish(nextPhrase.spanish, 'friend1');
    }

    HapticFeedback.light();
  };

  const handleRepeat = () => {
    const currentPhrase = getCurrentPhrase();
    if (conversationMode === '2-friends') {
      speakSpanish(currentPhrase.spanish, currentPhrase.speaker);
    } else if (currentPhrase.speaker === 'friend1') {
      speakSpanish(currentPhrase.spanish, 'friend1');
    }
  };

  const voices = [
    { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
    { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
    { code: 'es-AR', name: 'Spanish (Argentina)', flag: '🇦🇷' },
    { code: 'es-CO', name: 'Spanish (Colombia)', flag: '🇨🇴' },
    { code: 'es-US', name: 'Spanish (United States)', flag: '🇺🇸' },
  ];


  const getCurrentSpeakerInfo = () => {
    const currentPhrase = getCurrentPhrase();
    if (conversationMode === '1-friend') {
      return currentPhrase.speaker === 'friend1' ? 'Ana (Phone)' : 'Miguel (Tú)';
    } else {
      return currentPhrase.speaker === 'friend1' ? 'Ana' : 'Miguel';
    }
  };

  const shouldShowRepeatButton = () => {
    if (conversationMode === '2-friends') return true;
    const currentPhrase = getCurrentPhrase();
    return currentPhrase.speaker === 'friend1'; // Only show repeat for phone's phrases in 1-friend mode
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    greetingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 40,
      marginBottom: 40,
    },
    spanishText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 16,
      textAlign: 'center',
    },
    englishText: {
      fontSize: 24,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    buttonContainer: {
      paddingBottom: 20,
    },
    repeatButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
    },
    repeatButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    settingsContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingsTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    settingSection: {
      marginBottom: 24,
    },
    settingLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    modeButton: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 2,
    },
    modeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    modeButtonInactive: {
      borderColor: colors.border,
    },
    modeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    voiceInfo: {
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: 'center',
    },
    speakerInfo: {
      textAlign: 'center',
      marginTop: 8,
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    statusText: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressText: {
      textAlign: 'center',
      marginTop: 16,
      fontSize: 14,
      color: colors.textSecondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    continueButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    continueButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    voiceSection: {
      marginTop: 20,
      alignItems: 'center',
    },
    currentVoice: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    switchVoiceButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    switchVoiceButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>Spanish Friend</Text>
        <Text style={styles.subtitle}>Ana y Miguel planean ir a la playa</Text>
      </View>

      <View style={styles.greetingContainer}>
        <Text style={styles.spanishText}>{getCurrentPhrase().spanish}</Text>
        <Text style={styles.englishText}>{getCurrentPhrase().english}</Text>
        <Text style={styles.speakerInfo}>{getCurrentSpeakerInfo()}</Text>
      </View>

      <Text style={styles.progressText}>
        Phrase {currentPhraseIndex + 1} of {conversation.length}
      </Text>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
          {shouldShowRepeatButton() && (
            <TouchableOpacity style={styles.repeatButton} onPress={handleRepeat}>
              <Text style={styles.repeatButtonText}>Repetir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSettings && (
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>Configuración</Text>

          <View style={styles.settingSection}>
            <Text style={styles.settingLabel}>Modo de Conversación</Text>
            <TouchableOpacity
              style={[
                styles.modeButton,
                conversationMode === '1-friend' ? styles.modeButtonActive : styles.modeButtonInactive
              ]}
              onPress={() => setConversationMode('1-friend')}
            >
              <Text style={[styles.modeButtonText, { color: conversationMode === '1-friend' ? colors.primary : colors.text }]}>
                1 Amigo - Tú hablas como Miguel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                conversationMode === '2-friends' ? styles.modeButtonActive : styles.modeButtonInactive
              ]}
              onPress={() => setConversationMode('2-friends')}
            >
              <Text style={[styles.modeButtonText, { color: conversationMode === '2-friends' ? colors.primary : colors.text }]}>
                2 Amigos - Ana y Miguel hablan
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingSection}>
            <Text style={styles.settingLabel}>Configuración de Voces</Text>
            <Text style={styles.voiceInfo}>
              Ana: 🇪🇸 España (Femenina){"\n"}
              Miguel: 🇲🇽 México (Masculina)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};