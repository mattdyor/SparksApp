import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useSparkStore } from '../store';
import { HapticFeedback } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';

interface FoodPhoto {
  id: string;
  uri: string;
  timestamp: number;
  date: string; // YYYY-MM-DD format
}

interface FoodCamData {
  photos: FoodPhoto[];
}

interface FoodCamSparkProps {
  showSettings?: boolean;
  onCloseSettings?: () => void;
  onStateChange?: (state: any) => void;
  onComplete?: (result: any) => void;
}

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3; // 3 columns with padding

export const FoodCamSpark: React.FC<FoodCamSparkProps> = ({
  onStateChange,
}) => {
  const { getSparkData, setSparkData } = useSparkStore();
  const { colors } = useTheme();

  const [photos, setPhotos] = useState<FoodPhoto[]>([]);
  const [hasPermissions, setHasPermissions] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const savedData = getSparkData('food-cam') as FoodCamData;
    if (savedData?.photos) {
      setPhotos(savedData.photos);
    }
    requestPermissions();
  }, [getSparkData]);

  // Save data whenever photos change
  useEffect(() => {
    setSparkData('food-cam', { photos });
    onStateChange?.({ photoCount: photos.length });
  }, [photos]); // Removed setSparkData and onStateChange from dependencies

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();

      setHasPermissions(
        cameraStatus === 'granted' &&
        mediaStatus === 'granted' &&
        mediaLibraryStatus === 'granted'
      );
    } catch (error) {
      console.warn('Permission request failed:', error);
      setHasPermissions(false);
    }
  };

  const generatePhotoId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateString === todayStr) return 'Today';
    if (dateString === yesterdayStr) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePhotoResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets?.[0]) {
      HapticFeedback.light();

      const asset = result.assets[0];
      const now = new Date();
      const timestamp = now.getTime();
      const date = now.toISOString().split('T')[0];

      const newPhoto: FoodPhoto = {
        id: generatePhotoId(),
        uri: asset.uri,
        timestamp,
        date,
      };

      setPhotos(prev => [newPhoto, ...prev]);
    }
  };

  const takePhoto = async () => {
    if (!hasPermissions) {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to use FoodCam.',
        [{ text: 'OK', onPress: requestPermissions }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      await handlePhotoResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const addFromGallery = async () => {
    if (!hasPermissions) {
      Alert.alert(
        'Permissions Required',
        'Please grant photo library permissions to add photos.',
        [{ text: 'OK', onPress: requestPermissions }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      await handlePhotoResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    }
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            HapticFeedback.light();
            setPhotos(prev => prev.filter(photo => photo.id !== photoId));
          },
        },
      ]
    );
  };

  // Group photos by date
  const photosByDate = photos.reduce((groups, photo) => {
    if (!groups[photo.date]) {
      groups[photo.date] = [];
    }
    groups[photo.date].push(photo);
    return groups;
  }, {} as Record<string, FoodPhoto[]>);

  const sortedDates = Object.keys(photosByDate).sort((a, b) => b.localeCompare(a));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 10,
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
    },
    buttonContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    buttonText: {
      color: colors.background,
      fontSize: 18,
      fontWeight: '600',
    },
    addButtonText: {
      color: colors.primary,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    dateSection: {
      marginBottom: 24,
    },
    dateHeader: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    photoContainer: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    permissionText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
      marginTop: 20,
    },
  });

  if (!hasPermissions) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>FoodCam</Text>
          <Text style={styles.subtitle}>Visual food diary</Text>
        </View>
        <Text style={styles.permissionText}>
          Camera and photo library permissions are required to use FoodCam. Please grant permissions to continue.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FoodCam</Text>
        <Text style={styles.subtitle}>
          {photos.length > 0 ? `${photos.length} photos captured` : 'Start capturing your meals'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>📸 Snap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.addButton]} onPress={addFromGallery}>
          <Text style={[styles.buttonText, styles.addButtonText]}>📷 Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>
              Take a photo of your food to get started!
            </Text>
          </View>
        ) : (
          sortedDates.map(date => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{formatDate(date)}</Text>
              <View style={styles.photoGrid}>
                {photosByDate[date].map(photo => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoContainer}
                    onLongPress={() => deletePhoto(photo.id)}
                    delayLongPress={500}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photo} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};