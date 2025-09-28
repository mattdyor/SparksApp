import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useSparkStore } from '../store';
import { HapticFeedback } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';
import {
  SettingsContainer,
  SettingsScrollView,
  SettingsHeader,
  SettingsSection,
  SettingsFeedbackSection,
  SettingsButton,
  SettingsInput,
  SaveCancelButtons,
  SettingsItem,
  SettingsText,
  SettingsRemoveButton
} from '../components/SettingsComponents';

const { width: screenWidth } = Dimensions.get('window');
const CHIP_SIZE = (screenWidth - 80) / 3; // 3 columns with proper padding and gaps

interface SoundChip {
  id: string;
  name: string;
  displayName: string;
  category: string;
  duration: number;
  filePath: string;
  createdDate: string;
  lastPlayed?: string;
  playCount: number;
}

interface SoundboardData {
  soundChips: SoundChip[];
  categories: string[];
  lastUsed: string;
}

type RecordingState = 'ready' | 'countdown' | 'recording' | 'recorded';

const parseTaskText = (text: string): { category: string; displayText: string } => {
  const colonIndex = text.indexOf(':');
  if (colonIndex !== -1 && colonIndex < text.length - 1) {
    const category = text.substring(0, colonIndex).trim();
    const displayText = text.substring(colonIndex + 1).trim();
    return { category, displayText };
  }
  return { category: 'General', displayText: text.trim() };
};

const SoundboardSettings: React.FC<{
  soundChips: SoundChip[];
  onSave: (soundChips: SoundChip[]) => void;
  onClose: () => void;
}> = ({ soundChips, onSave, onClose }) => {
  const { colors } = useTheme();
  const [editingSoundChips, setEditingSoundChips] = useState<SoundChip[]>([...soundChips]);


  const deleteSoundChip = async (id: string) => {
    const chipToDelete = editingSoundChips.find(chip => chip.id === id);
    if (chipToDelete) {
      Alert.alert(
        'Delete Sound',
        `Are you sure you want to delete "${chipToDelete.displayName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete the file
                await FileSystem.deleteAsync(chipToDelete.filePath, { idempotent: true });

                // Remove from array
                setEditingSoundChips(editingSoundChips.filter(chip => chip.id !== id));
                HapticFeedback.medium();
              } catch (error) {
                console.error('Failed to delete sound file:', error);
                // Still remove from array even if file deletion fails
                setEditingSoundChips(editingSoundChips.filter(chip => chip.id !== id));
                HapticFeedback.medium();
              }
            },
          },
        ]
      );
    }
  };

  const handleSave = () => {
    onSave(editingSoundChips);
    onClose();
  };

  return (
    <SettingsContainer>
      <SettingsScrollView>
        <SettingsHeader
          title="Soundboard Settings"
          subtitle="Manage your sound collection"
          icon="🎛️"
        />

        <SettingsSection title={`Your Sounds (${editingSoundChips.length})`}>
          {editingSoundChips.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <SettingsText variant="body">No sounds recorded yet</SettingsText>
            </View>
          ) : (
            editingSoundChips.map((chip) => (
              <SettingsItem key={chip.id}>
                <View style={{ flex: 1 }}>
                  <SettingsText variant="body">{chip.displayName}</SettingsText>
                  <SettingsText variant="caption">
                    {chip.category} • {chip.duration.toFixed(1)}s • {chip.playCount} plays
                  </SettingsText>
                </View>
                <SettingsRemoveButton onPress={() => deleteSoundChip(chip.id)} />
              </SettingsItem>
            ))
          )}
        </SettingsSection>

        <SettingsFeedbackSection sparkName="Soundboard" />

        <SaveCancelButtons onSave={handleSave} onCancel={onClose} />
      </SettingsScrollView>
    </SettingsContainer>
  );
};

interface SoundboardSparkProps {
  showSettings?: boolean;
  onCloseSettings?: () => void;
  onStateChange?: (state: any) => void;
}

export const SoundboardSpark: React.FC<SoundboardSparkProps> = ({
  showSettings = false,
  onCloseSettings,
  onStateChange
}) => {
  const { getSparkData, setSparkData } = useSparkStore();
  const { colors } = useTheme();

  const [soundChips, setSoundChips] = useState<SoundChip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('ready');
  const [countdown, setCountdown] = useState(3);
  const [recordingCountdown, setRecordingCountdown] = useState(10);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [newSoundName, setNewSoundName] = useState('');

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<NodeJS.Timeout | null>(null);
  const recordingObjectRef = useRef<Audio.Recording | null>(null);

  // Cleanup on unmount and when recording changes
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (recordingRef.current) clearInterval(recordingRef.current);
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
      if (recording || recordingObjectRef.current) {
        const currentRecording = recordingObjectRef.current || recording;
        if (currentRecording) {
          currentRecording.stopAndUnloadAsync().catch(console.warn);
        }
      }
    };
  }, []);


  const cleanupAllRecordings = async () => {
    try {
      // Clear any timers
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (recordingRef.current) {
        clearInterval(recordingRef.current);
        recordingRef.current = null;
      }

      // Stop and cleanup current recording
      if (recording || recordingObjectRef.current) {
        try {
          const currentRecording = recordingObjectRef.current || recording;
          if (currentRecording) {
            await currentRecording.stopAndUnloadAsync();
          }
        } catch (error) {
          console.warn('Failed to stop existing recording:', error);
        }
        setRecording(null);
        recordingObjectRef.current = null;
      }

      // Reset all recording state
      setRecordingState('ready');
      setRecordedUri(null);
      setNewSoundName('');
      setRecordedDuration(0);
      setCountdown(3);
      setRecordingCountdown(10);
    } catch (error) {
      console.warn('Failed to cleanup recordings:', error);
    }
  };

  const setupAudioMode = async (forRecording = false) => {
    try {
      await Audio.requestPermissionsAsync();

      if (forRecording) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (error) {
      console.error('Failed to setup audio mode:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Comprehensive cleanup first
      await cleanupAllRecordings();

      // Add a delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      await setupAudioMode(true);
      setRecordingState('countdown');
      setCountdown(3);

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            beginRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const beginRecording = async () => {
    try {
      // Prevent multiple simultaneous calls
      if (recordingState === 'recording') {
        console.log('Recording already in progress, skipping');
        return;
      }

      console.log('Starting beginRecording...');

      // Ensure we're starting from a clean state
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (error) {
          console.warn('Failed to cleanup existing recording:', error);
        }
        setRecording(null);
      }

      // Add a delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      console.log('Attempting to create recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      console.log('Recording created successfully');

      setRecording(newRecording);
      recordingObjectRef.current = newRecording;
      setRecordingState('recording');
      setRecordingCountdown(10);

      console.log('Setting up recording countdown timer...');
      recordingRef.current = setInterval(() => {
        setRecordingCountdown((prev) => {
          console.log(`Recording countdown: ${prev}`);
          if (prev <= 1) {
            console.log('Auto-stopping recording after countdown');
            if (recordingRef.current) {
              clearInterval(recordingRef.current);
              recordingRef.current = null;
            }
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      console.log('Recording countdown timer started');
    } catch (error) {
      console.error('Failed to begin recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
      setRecordingState('ready');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      if (recordingRef.current) {
        clearInterval(recordingRef.current);
        recordingRef.current = null;
      }

      const currentRecording = recordingObjectRef.current || recording;
      if (currentRecording) {
        console.log('Getting recording status...');
        const status = await currentRecording.getStatusAsync();
        const actualDuration = status.durationMillis ? status.durationMillis / 1000 : 0;
        console.log(`Recording duration: ${actualDuration}s`);

        console.log('Stopping and unloading recording...');
        await currentRecording.stopAndUnloadAsync();
        const uri = currentRecording.getURI();

        setRecordedUri(uri);
        setRecordedDuration(actualDuration);
        console.log('Setting recording state to recorded');
        setRecordingState('recorded');
        setRecording(null);
        recordingObjectRef.current = null;
      } else {
        console.log('No recording object found to stop');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
      setRecordingState('ready');
    }
  };

  const playRecordedSound = async () => {
    try {
      if (recordedUri) {
        await setupAudioMode(false);

        if (sound) {
          await sound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
        setSound(newSound);
        await newSound.playAsync();
        HapticFeedback.light();
      }
    } catch (error) {
      console.error('Failed to play recorded sound:', error);
      Alert.alert('Error', 'Failed to play recorded sound.');
    }
  };

  const saveRecording = async () => {
    if (!recordedUri || !newSoundName.trim()) {
      Alert.alert('Error', 'Please enter a name for your sound.');
      return;
    }

    try {
      const { category, displayText } = parseTaskText(newSoundName.trim());
      const id = Date.now().toString();
      const fileName = `sound_${Date.now()}_${id}.m4a`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: recordedUri,
        to: newPath,
      });

      const newSoundChip: SoundChip = {
        id,
        name: newSoundName.trim(),
        displayName: displayText,
        category,
        duration: recordedDuration,
        filePath: newPath,
        createdDate: new Date().toISOString(),
        playCount: 0,
      };

      setSoundChips([...soundChips, newSoundChip]);

      // Reset recording state
      setRecordingState('ready');
      setRecordedUri(null);
      setNewSoundName('');
      setRecordedDuration(0);

      HapticFeedback.success();
    } catch (error) {
      console.error('Failed to save recording:', error);
      Alert.alert('Error', 'Failed to save recording.');
    }
  };

  const discardRecording = () => {
    setRecordingState('ready');
    setRecordedUri(null);
    setNewSoundName('');
    setRecordedDuration(0);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  };

  const reRecord = () => {
    discardRecording();
    startRecording();
  };

  // Load saved data on mount
  useEffect(() => {
    const savedData = getSparkData('soundboard') as SoundboardData;
    if (savedData?.soundChips) {
      setSoundChips(savedData.soundChips);
    }
  }, [getSparkData]);

  // Save data whenever soundChips change
  useEffect(() => {
    const categories = Array.from(new Set(soundChips.map(chip => chip.category)));
    const soundboardData: SoundboardData = {
      soundChips,
      categories,
      lastUsed: new Date().toISOString(),
    };
    setSparkData('soundboard', soundboardData);
    onStateChange?.({ soundCount: soundChips.length, categories: categories.length });
  }, [soundChips]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const setupPlaybackAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, // Critical for proper playback volume
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to setup playback audio mode:', error);
    }
  };

  const playSound = async (chip: SoundChip) => {
    try {
      // Setup audio mode for playback (fixes quiet volume)
      await setupPlaybackAudioMode();

      // Stop any currently playing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(chip.filePath);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Sound file not found. It may have been deleted.');
        return;
      }

      setCurrentlyPlaying(chip.id);

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: chip.filePath });
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setCurrentlyPlaying(null);
        }
      });

      await newSound.playAsync();

      // Update play count
      setSoundChips(prev => prev.map(c =>
        c.id === chip.id
          ? { ...c, playCount: c.playCount + 1, lastPlayed: new Date().toISOString() }
          : c
      ));

      HapticFeedback.light();
    } catch (error) {
      console.error('Failed to play sound:', error);
      setCurrentlyPlaying(null);
      Alert.alert('Error', 'Failed to play sound.');
    }
  };

  const saveSoundChips = (newSoundChips: SoundChip[]) => {
    setSoundChips(newSoundChips);
    HapticFeedback.success();
  };

  const renderRecordingInterface = () => {
    const recordingStyles = StyleSheet.create({
      recordingContainer: {
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
      },
      recordButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginBottom: 20,
      },
      recordButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
      },
      countdownText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 10,
      },
      recordingText: {
        color: '#FF3B30',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
      },
      stopButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 10,
      },
      stopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      previewContainer: {
        alignItems: 'center',
      },
      previewText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 15,
        textAlign: 'center',
      },
      playbackControls: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
      },
      playButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
      },
      playButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
      },
      categoryHelpText: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
        lineHeight: 16,
      },
      actionButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
      },
      actionButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        alignItems: 'center',
      },
      saveButton: {
        backgroundColor: colors.success,
      },
      discardButton: {
        backgroundColor: colors.error,
      },
      reRecordButton: {
        flex: 1,
        backgroundColor: colors.border,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
      },
      actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
      },
      reRecordButtonText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
      },
      nameInput: {
        alignSelf: 'stretch',
        backgroundColor: colors.surface,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
      },
    });

    switch (recordingState) {
      case 'ready':
        return (
          <View style={recordingStyles.recordingContainer}>
            <TouchableOpacity style={recordingStyles.recordButton} onPress={startRecording}>
              <Text style={recordingStyles.recordButtonText}>🎤 Record New Sound</Text>
            </TouchableOpacity>
          </View>
        );

      case 'countdown':
        return (
          <View style={recordingStyles.recordingContainer}>
            <Text style={recordingStyles.countdownText}>{countdown}</Text>
            <Text style={recordingStyles.previewText}>Get ready to record...</Text>
          </View>
        );

      case 'recording':
        return (
          <View style={recordingStyles.recordingContainer}>
            <Text style={recordingStyles.recordingText}>● Recording</Text>
            <Text style={recordingStyles.countdownText}>{recordingCountdown}</Text>
            <TouchableOpacity style={recordingStyles.stopButton} onPress={stopRecording}>
              <Text style={recordingStyles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        );

      case 'recorded':
        return (
          <View style={recordingStyles.recordingContainer}>
            <View style={recordingStyles.previewContainer}>
              <Text style={recordingStyles.previewText}>
                Recording complete! Duration: {recordedDuration.toFixed(1)}s
              </Text>

              <View style={recordingStyles.playbackControls}>
                <TouchableOpacity style={recordingStyles.playButton} onPress={playRecordedSound}>
                  <Text style={recordingStyles.playButtonText}>▶ Play</Text>
                </TouchableOpacity>
                <TouchableOpacity style={recordingStyles.reRecordButton} onPress={reRecord}>
                  <Text style={recordingStyles.reRecordButtonText}>Re-record</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={recordingStyles.nameInput}
                placeholder="Enter Sound Name"
                value={newSoundName}
                onChangeText={setNewSoundName}
              />

              <Text style={recordingStyles.categoryHelpText}>
                {newSoundName.trim() ? (
                  (() => {
                    const { category, displayText } = parseTaskText(newSoundName.trim());
                    return `Category: ${category} • Display: "${displayText}"`;
                  })()
                ) : (
                  "Use format 'Category: Sound Name' to organize sounds into categories"
                )}
              </Text>

              <View style={recordingStyles.actionButtons}>
                <TouchableOpacity style={[recordingStyles.actionButton, recordingStyles.discardButton]} onPress={discardRecording}>
                  <Text style={recordingStyles.actionButtonText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[recordingStyles.actionButton, recordingStyles.saveButton]} onPress={saveRecording}>
                  <Text style={recordingStyles.actionButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getFilteredSoundChips = () => {
    if (!selectedCategory) {
      return soundChips;
    }
    return soundChips.filter(chip => chip.category === selectedCategory);
  };

  const getCategories = () => {
    const categories = Array.from(new Set(soundChips.map(chip => chip.category)));
    return categories.sort();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    categoryTabs: {
      flexDirection: 'row',
      marginBottom: 20,
      maxHeight: 40,
      flexGrow: 0,
      flexShrink: 0,
    },
    categoryTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: colors.border,
      minHeight: 32,
      justifyContent: 'center',
    },
    categoryTabActive: {
      backgroundColor: colors.primary,
    },
    categoryTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    categoryTabTextActive: {
      color: '#fff',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    soundChip: {
      width: CHIP_SIZE,
      height: CHIP_SIZE,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    soundChipPlaying: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    soundChipName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    soundChipDetails: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    emptyStateButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    emptyStateButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyHelpText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  if (showSettings) {
    return (
      <SoundboardSettings
        soundChips={soundChips}
        onSave={saveSoundChips}
        onClose={onCloseSettings || (() => {})}
      />
    );
  }

  const filteredChips = getFilteredSoundChips();
  const categories = getCategories();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>🎛️ Soundboard</Text>
        <Text style={styles.subtitle}>Tap to play your recorded sounds</Text>
      </View>

      {renderRecordingInterface()}

      {categories.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
          <TouchableOpacity
            style={[styles.categoryTab, !selectedCategory && styles.categoryTabActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryTabText, !selectedCategory && styles.categoryTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryTab, selectedCategory === category && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryTabText, selectedCategory === category && styles.categoryTabTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {filteredChips.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {soundChips.length === 0
              ? "No sounds recorded yet.\nTap the button below to record your first sound!"
              : `No sounds in ${selectedCategory} category`
            }
          </Text>
          {soundChips.length === 0 && (
            <Text style={styles.emptyHelpText}>
              Tap "Record New Sound" above to get started!
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredChips.map(chip => (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.soundChip,
                currentlyPlaying === chip.id && styles.soundChipPlaying
              ]}
              onPress={() => playSound(chip)}
            >
              <Text style={styles.soundChipName} numberOfLines={2}>
                {chip.displayName}
              </Text>
              <Text style={styles.soundChipDetails}>
                {chip.duration.toFixed(1)}s
              </Text>
              <Text style={styles.soundChipDetails}>
                {chip.category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};