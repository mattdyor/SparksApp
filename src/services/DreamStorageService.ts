import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DreamEntry {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD format
  audioUri: string;
  transcription: string;
  geminiInterpretation?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = '@dream-catcher/dreams';

class DreamStorageServiceClass {
  /**
   * Save a new dream entry
   */
  async saveDream(entry: Omit<DreamEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DreamEntry> {
    try {
      const now = Date.now();
      const dreamEntry: DreamEntry = {
        ...entry,
        id: `dream_${now}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      const dreams = await this.getAllDreams();
      dreams.push(dreamEntry);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
      return dreamEntry;
    } catch (error) {
      console.error('Failed to save dream:', error);
      throw new Error('Failed to save dream');
    }
  }

  /**
   * Get all dreams
   */
  async getAllDreams(): Promise<DreamEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get dreams:', error);
      return [];
    }
  }

  /**
   * Get dreams by date range
   */
  async getDreamsByDateRange(startDate: string, endDate: string): Promise<DreamEntry[]> {
    try {
      const dreams = await this.getAllDreams();
      return dreams.filter(
        dream => dream.date >= startDate && dream.date <= endDate
      ).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get dreams by date range:', error);
      return [];
    }
  }

  /**
   * Get a specific dream by ID
   */
  async getDreamById(id: string): Promise<DreamEntry | null> {
    try {
      const dreams = await this.getAllDreams();
      return dreams.find(dream => dream.id === id) || null;
    } catch (error) {
      console.error('Failed to get dream by ID:', error);
      return null;
    }
  }

  /**
   * Update a dream entry
   */
  async updateDream(id: string, updates: Partial<DreamEntry>): Promise<DreamEntry | null> {
    try {
      const dreams = await this.getAllDreams();
      const index = dreams.findIndex(dream => dream.id === id);

      if (index === -1) {
        return null;
      }

      dreams[index] = {
        ...dreams[index],
        ...updates,
        updatedAt: Date.now(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
      return dreams[index];
    } catch (error) {
      console.error('Failed to update dream:', error);
      throw new Error('Failed to update dream');
    }
  }

  /**
   * Delete a dream entry
   */
  async deleteDream(id: string): Promise<boolean> {
    try {
      const dreams = await this.getAllDreams();
      const filteredDreams = dreams.filter(dream => dream.id !== id);

      if (filteredDreams.length === dreams.length) {
        return false; // Dream not found
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDreams));
      return true;
    } catch (error) {
      console.error('Failed to delete dream:', error);
      throw new Error('Failed to delete dream');
    }
  }

  /**
   * Get recent dreams (last N days)
   */
  async getRecentDreams(days: number = 7): Promise<DreamEntry[]> {
    try {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];

      return await this.getDreamsByDateRange(startDateStr, endDateStr);
    } catch (error) {
      console.error('Failed to get recent dreams:', error);
      return [];
    }
  }

  /**
   * Get today's dreams
   */
  async getTodaysDreams(): Promise<DreamEntry[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dreams = await this.getAllDreams();
      return dreams
        .filter(dream => dream.date === today)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get today\'s dreams:', error);
      return [];
    }
  }
}

export const DreamStorageService = new DreamStorageServiceClass();

