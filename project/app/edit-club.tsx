import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SwingDistances {
  full: number[];
  '9oclock': number[];
  '7oclock': number[];
}

export interface SwingAverages {
  full: number;
  '9oclock': number;
  '7oclock': number;
}

export type SwingType = 'full' | '9oclock' | '7oclock';

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

export default function EditClub() {
  const { clubId } = useLocalSearchParams();
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [newDistance, setNewDistance] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSwingType, setSelectedSwingType] = useState<SwingType>('full');
  const wedgeIds = ['pw', 'gw', 'sw', 'lw'];
  const isWedge = wedgeIds.includes(clubId as string);

  useEffect(() => {
    loadClub();
  }, [clubId]);

  useFocusEffect(
    React.useCallback(() => {
      loadClub();
    }, [clubId])
  );

  const loadClub = async () => {
    try {
      let savedClubs;

      if (Platform.OS === 'web') {
        savedClubs = localStorage.getItem('yardage-tracker-clubs');
      } else {
        savedClubs = await AsyncStorage.getItem('yardage-tracker-clubs');
      }

      if (savedClubs) {
        const clubs: Club[] = JSON.parse(savedClubs);
        const foundClub = clubs.find(c => c.id === clubId);
        if (foundClub) {
          if (isWedge && !foundClub.swingDistances) {
            foundClub.swingDistances = { full: [], '9oclock': [], '7oclock': [] };
            foundClub.swingAverages = { full: 0, '9oclock': 0, '7oclock': 0 };
          }
          setClub(foundClub);
        }
      }
    } catch (error) {
      console.error('Error loading club:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        const updatedClubs = clubs.map(c => c.id === clubId ? updatedClub : c);

        if (Platform.OS === 'web') {
          localStorage.setItem('yardage-tracker-clubs', JSON.stringify(updatedClubs));
        } else {
          await AsyncStorage.setItem('yardage-tracker-clubs', JSON.stringify(updatedClubs));
        }
      }
    } catch (error) {
      console.error('Error saving club:', error);
    }
  };

  const addDistance = () => {
    const distance = parseInt(newDistance);
    if (distance && distance > 0 && club) {
      if (isWedge && club.swingDistances && club.swingAverages) {
        const newSwingDistances = { ...club.swingDistances };
        newSwingDistances[selectedSwingType] = [...newSwingDistances[selectedSwingType], distance];

        const newSwingAverages = { ...club.swingAverages };
        newSwingAverages[selectedSwingType] = calculateAverage(newSwingDistances[selectedSwingType]);

        const updatedClub = {
          ...club,
          swingDistances: newSwingDistances,
          swingAverages: newSwingAverages,
        };
        setClub(updatedClub);
        saveClub(updatedClub);
      } else {
        const newDistances = [...club.distances, distance];
        const updatedClub = {
          ...club,
          distances: newDistances,
          averageDistance: calculateAverage(newDistances),
        };
        setClub(updatedClub);
        saveClub(updatedClub);
      }
      setNewDistance('');
    } else {
      Alert.alert('Invalid Distance', 'Please enter a valid distance greater than 0.');
    }
  };

  const removeDistance = (index: number, swingType?: SwingType) => {
    if (club) {
      if (isWedge && swingType && club.swingDistances && club.swingAverages) {
        const newSwingDistances = { ...club.swingDistances };
        newSwingDistances[swingType] = newSwingDistances[swingType].filter((_, i) => i !== index);

        const newSwingAverages = { ...club.swingAverages };
        newSwingAverages[swingType] = calculateAverage(newSwingDistances[swingType]);

        const updatedClub = {
          ...club,
          swingDistances: newSwingDistances,
          swingAverages: newSwingAverages,
        };
        setClub(updatedClub);
        saveClub(updatedClub);
      } else {
        const newDistances = club.distances.filter((_, i) => i !== index);
        const updatedClub = {
          ...club,
          distances: newDistances,
          averageDistance: calculateAverage(newDistances),
        };
        setClub(updatedClub);
        saveClub(updatedClub);
      }
    }
  };

  const clearAllDistances = (swingType?: SwingType) => {
    if (club) {
      if (isWedge && swingType && club.swingDistances && club.swingAverages) {
        const newSwingDistances = { ...club.swingDistances };
        newSwingDistances[swingType] = [];

        const newSwingAverages = { ...club.swingAverages };
        newSwingAverages[swingType] = 0;

        const updatedClub = {
          ...club,
          swingDistances: newSwingDistances,
          swingAverages: newSwingAverages,
        };
        setClub(updatedClub);
        saveClub(updatedClub);
      } else {
        const updatedClub = {
          ...club,
          distances: [],
          averageDistance: 0,
        };
        setClub(updatedClub);
        saveClub(updatedClub);
      }
    }
  };

  const handleBrandPress = () => {
    router.push(`/select-brand?clubId=${clubId}`);
  };

  const getSwingTypeLabel = (type: SwingType): string => {
    switch (type) {
      case 'full': return 'Full Swing';
      case '9oclock': return '9 O\'clock';
      case '7oclock': return '7 O\'clock';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!club) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Club Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{club.name}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.clubInfoCard}>
            <Text style={styles.clubName}>{club.name}</Text>
            <View style={styles.brandModelContainer}>
              <TouchableOpacity
                onPress={handleBrandPress}
                style={styles.brandButton}
              >
                <Text style={styles.clubBrand}>{club.brand}</Text>
                {club.model && <Text style={styles.clubModel}> {club.model}</Text>}
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>

            {isWedge && club.swingAverages ? (
              <View style={styles.swingAveragesContainer}>
                <Text style={styles.averageLabel}>Average Distances</Text>
                <View style={styles.swingAveragesList}>
                  <View style={styles.swingAverageItem}>
                    <Text style={styles.swingLabel}>Full</Text>
                    <Text style={styles.swingValue}>{club.swingAverages.full} Yds</Text>
                  </View>
                  <View style={styles.swingAverageItem}>
                    <Text style={styles.swingLabel}>9 O'clock</Text>
                    <Text style={styles.swingValue}>{club.swingAverages['9oclock']} Yds</Text>
                  </View>
                  <View style={styles.swingAverageItem}>
                    <Text style={styles.swingLabel}>7 O'clock</Text>
                    <Text style={styles.swingValue}>{club.swingAverages['7oclock']} Yds</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.averageContainer}>
                <Text style={styles.averageLabel}>Average Distance</Text>
                <Text style={styles.averageValue}>{club.averageDistance} Yds</Text>
              </View>
            )}
          </View>

          <View style={styles.addDistanceCard}>
            <Text style={styles.sectionTitle}>Add Distance</Text>

            {isWedge && (
              <View style={styles.swingTypeSelector}>
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
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.distanceInput}
                placeholder="Enter distance in yards"
                value={newDistance}
                onChangeText={setNewDistance}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={addDistance}
              />
              <TouchableOpacity style={styles.addButton} onPress={addDistance}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isWedge && club.swingDistances ? (
            <View>
              {(['full', '9oclock', '7oclock'] as SwingType[]).map((type) => (
                <View key={type} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.sectionTitle}>{getSwingTypeLabel(type)}</Text>
                    {club.swingDistances![type].length > 0 && (
                      <TouchableOpacity onPress={() => clearAllDistances(type)} style={styles.clearButton}>
                        <Text style={styles.clearButtonText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {club.swingDistances![type].length === 0 ? (
                    <Text style={styles.emptyText}>No distances recorded yet</Text>
                  ) : (
                    <View style={styles.distanceList}>
                      {club.swingDistances![type].map((distance, index) => (
                        <View key={index} style={styles.distanceItem}>
                          <Text style={styles.distanceText}>{distance} Yds</Text>
                          <TouchableOpacity
                            onPress={() => removeDistance(index, type)}
                            style={styles.removeButton}
                          >
                            <Text style={styles.removeButtonText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Distance History</Text>
                {club.distances.length > 0 && (
                  <TouchableOpacity onPress={() => clearAllDistances()} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {club.distances.length === 0 ? (
                <Text style={styles.emptyText}>No distances recorded yet</Text>
              ) : (
                <View style={styles.distanceList}>
                  {club.distances.map((distance, index) => (
                    <View key={index} style={styles.distanceItem}>
                      <Text style={styles.distanceText}>{distance} Yds</Text>
                      <TouchableOpacity
                        onPress={() => removeDistance(index)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  clubInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  clubName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  clubBrand: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  swingAveragesContainer: {
    width: '100%',
    alignItems: 'center',
  },
  swingAveragesList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 12,
  },
  swingAverageItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  swingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  swingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addDistanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  swingTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  swingTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  swingTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  swingTypeButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  swingTypeButtonTextActive: {
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  distanceList: {
    gap: 8,
  },
  distanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  brandModelContainer: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  clubModel: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  changeText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});
