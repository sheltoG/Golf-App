import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WheelPicker from '@/components/WheelPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SwingDistances {
  full: number[];
  '9oclock': number[];
  '7oclock': number[];
}

interface SwingAverages {
  full: number;
  '9oclock': number;
  '7oclock': number;
}

type SwingType = 'full' | '9oclock' | '7oclock';

interface Club {
  id: string;
  name: string;
  brand: string;
  model?: string;
  degrees?: number;
  distances: number[];
  averageDistance: number;
  swingDistances?: SwingDistances;
  swingAverages?: SwingAverages;
}

export default function QuickAdd() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedSwingType, setSelectedSwingType] = useState<SwingType>('full');
  const [distance, setDistance] = useState(100);
  const wedgeIds = ['pw', 'gw', 'sw', 'lw'];

  useFocusEffect(
    React.useCallback(() => {
      loadClubs();
    }, [])
  );

  const loadClubs = async () => {
    try {
      let savedClubs;

      if (Platform.OS === 'web') {
        savedClubs = localStorage.getItem('yardage-tracker-clubs');
      } else {
        savedClubs = await AsyncStorage.getItem('yardage-tracker-clubs');
      }

      if (savedClubs) {
        const parsedClubs: Club[] = JSON.parse(savedClubs);
        setClubs(parsedClubs);
      }
    } catch (error) {
      console.error('Error loading clubs:', error);
    }
  };

  useEffect(() => {
    if (selectedClub) {
      const average = getCurrentAverage();
      if (average > 0) {
        setDistance(average);
      }
    }
  }, [selectedClub, selectedSwingType]);

  const calculateAverage = (distances: number[]): number => {
    if (distances.length === 0) return 0;
    return Math.round(distances.reduce((sum, distance) => sum + distance, 0) / distances.length);
  };

  const saveClub = async (updatedClub: Club) => {
    try {
      let savedClubs;

      if (Platform.OS === 'web') {
        savedClubs = localStorage.getItem('yardage-tracker-clubs');
      } else {
        savedClubs = await AsyncStorage.getItem('yardage-tracker-clubs');
      }

      if (savedClubs) {
        const clubs: Club[] = JSON.parse(savedClubs);
        const updatedClubs = clubs.map(c => c.id === updatedClub.id ? updatedClub : c);

        if (Platform.OS === 'web') {
          localStorage.setItem('yardage-tracker-clubs', JSON.stringify(updatedClubs));
        } else {
          await AsyncStorage.setItem('yardage-tracker-clubs', JSON.stringify(updatedClubs));
        }

        setClubs(updatedClubs);
      }
    } catch (error) {
      console.error('Error saving club:', error);
    }
  };

  const handleAddDistance = async () => {
    if (!selectedClub) {
      Alert.alert('No Club Selected', 'Please select a club first.');
      return;
    }

    if (!distance || distance <= 0) {
      Alert.alert('Invalid Distance', 'Please enter a valid distance greater than 0.');
      return;
    }

    const distanceValue = distance;

    const isWedge = wedgeIds.includes(selectedClub.id);

    if (isWedge) {
      if (!selectedClub.swingDistances) {
        selectedClub.swingDistances = { full: [], '9oclock': [], '7oclock': [] };
      }
      if (!selectedClub.swingAverages) {
        selectedClub.swingAverages = { full: 0, '9oclock': 0, '7oclock': 0 };
      }

      const newSwingDistances = { ...selectedClub.swingDistances };
      newSwingDistances[selectedSwingType] = [...newSwingDistances[selectedSwingType], distanceValue];

      const newSwingAverages = { ...selectedClub.swingAverages };
      newSwingAverages[selectedSwingType] = calculateAverage(newSwingDistances[selectedSwingType]);

      const updatedClub = {
        ...selectedClub,
        swingDistances: newSwingDistances,
        swingAverages: newSwingAverages,
      };

      await saveClub(updatedClub);
      setSelectedClub(updatedClub);
    } else {
      const newDistances = [...selectedClub.distances, distanceValue];
      const updatedClub = {
        ...selectedClub,
        distances: newDistances,
        averageDistance: calculateAverage(newDistances),
      };

      await saveClub(updatedClub);
      setSelectedClub(updatedClub);
    }

    setDistance(100);
    Alert.alert('Success', `Added ${distanceValue} yards to ${selectedClub.name}`);
  };

  const getSwingTypeLabel = (type: SwingType): string => {
    switch (type) {
      case 'full': return 'Full Swing';
      case '9oclock': return '9 O\'clock';
      case '7oclock': return '7 O\'clock';
    }
  };

  const getCurrentAverage = (): number => {
    if (!selectedClub) return 0;

    const isWedge = wedgeIds.includes(selectedClub.id);
    if (isWedge && selectedClub.swingAverages) {
      return selectedClub.swingAverages[selectedSwingType];
    }

    return selectedClub.averageDistance;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Shot</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Club</Text>
          <View style={styles.clubGrid}>
            {clubs.map((club) => (
              <TouchableOpacity
                key={club.id}
                style={[
                  styles.clubButton,
                  selectedClub?.id === club.id && styles.clubButtonSelected
                ]}
                onPress={() => setSelectedClub(club)}
              >
                <Text style={[
                  styles.clubButtonText,
                  selectedClub?.id === club.id && styles.clubButtonTextSelected
                ]}>
                  {club.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedClub && wedgeIds.includes(selectedClub.id) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Swing Type</Text>
            <View style={styles.swingTypeContainer}>
              {(['full', '9oclock', '7oclock'] as SwingType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.swingTypeButton,
                    selectedSwingType === type && styles.swingTypeButtonActive
                  ]}
                  onPress={() => setSelectedSwingType(type)}
                >
                  <Text style={[
                    styles.swingTypeButtonText,
                    selectedSwingType === type && styles.swingTypeButtonTextActive
                  ]}>
                    {getSwingTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.distanceHeader}>
            <Text style={styles.sectionTitle}>Distance (Yards)</Text>
            {selectedClub && getCurrentAverage() > 0 && (
              <Text style={styles.averageHint}>Avg: {getCurrentAverage()}</Text>
            )}
          </View>
          <WheelPicker
            values={Array.from({ length: 400 }, (_, i) => i + 1)}
            selectedValue={distance}
            onValueChange={setDistance}
          />

          <TouchableOpacity
            style={[
              styles.addButton,
              !selectedClub && styles.addButtonDisabled
            ]}
            onPress={handleAddDistance}
            disabled={!selectedClub}
          >
            <Text style={styles.addButtonText}>Add Distance</Text>
          </TouchableOpacity>
        </View>

        {selectedClub && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Average</Text>
            <View style={styles.averageCard}>
              <Text style={styles.averageValue}>{getCurrentAverage()}</Text>
              <Text style={styles.averageUnit}>Yards</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  clubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clubButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    minWidth: 70,
    alignItems: 'center',
  },
  clubButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  clubButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  clubButtonTextSelected: {
    color: '#ffffff',
  },
  swingTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  swingTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  swingTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  swingTypeButtonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  swingTypeButtonTextActive: {
    color: '#ffffff',
  },
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  averageHint: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  averageCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  averageUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#007AFF',
    marginTop: 16,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
