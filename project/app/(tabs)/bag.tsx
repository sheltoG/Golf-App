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
import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
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

const availableBrands = [
  "Mizuno",
  "Maltby", 
  "Cleveland",
  "Titleist",
  "Callaway",
  "TaylorMade",
  "Ping",
  "Cobra",
  "Wilson",
  "Srixon",
  "Kirkland"
];

const initialClubs: Club[] = [
  { id: "driver", name: "Driver", brand: "Mizuno", distances: [], averageDistance: 260 },
  { id: "5wood", name: "5w", brand: "Maltby", distances: [], averageDistance: 220 },
  { id: "4iron", name: "4i", brand: "Maltby", distances: [], averageDistance: 190 },
  { id: "5iron", name: "5i", brand: "Maltby", distances: [], averageDistance: 180 },
  { id: "6iron", name: "6i", brand: "Maltby", distances: [], averageDistance: 170 },
  { id: "7iron", name: "7i", brand: "Maltby", distances: [], averageDistance: 160 },
  { id: "8iron", name: "8i", brand: "Maltby", distances: [], averageDistance: 150 },
  { id: "9iron", name: "9i", brand: "Maltby", distances: [], averageDistance: 140 },
  { id: "pw", name: "Pw - 48", brand: "Maltby", degrees: 48, distances: [], averageDistance: 130 },
  { id: "gw", name: "Gw - 52", brand: "Maltby", degrees: 52, distances: [], averageDistance: 120 },
  { id: "sw", name: "Sw - 56", brand: "Maltby", degrees: 56, distances: [], averageDistance: 100 },
  { id: "lw", name: "Lw - 60", brand: "Maltby", degrees: 60, distances: [], averageDistance: 85 },
];

export default function App() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>(initialClubs);
  const [customBrands, setCustomBrands] = useState<string[]>([]);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload clubs when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  // Save to AsyncStorage whenever clubs change
  useEffect(() => {
    saveClubs();
  }, [clubs]);

  // Save custom brands to AsyncStorage whenever they change
  useEffect(() => {
    saveCustomBrands();
  }, [customBrands]);

  const loadData = async () => {
    try {
      let savedClubs, savedCustomBrands;

      if (Platform.OS === 'web') {
        savedClubs = localStorage.getItem("yardage-tracker-clubs");
        savedCustomBrands = localStorage.getItem("yardage-tracker-custom-brands");
      } else {
        savedClubs = await AsyncStorage.getItem("yardage-tracker-clubs");
        savedCustomBrands = await AsyncStorage.getItem("yardage-tracker-custom-brands");
      }

      if (savedClubs) {
        const parsedClubs = JSON.parse(savedClubs);
        const updatedClubs = parsedClubs.map((club: Club) => {
          if (club.id === 'lw' && club.name === 'L - 60') {
            return { ...club, name: 'Lw - 60' };
          }
          return club;
        });
        setClubs(updatedClubs);
      }
      if (savedCustomBrands) {
        setCustomBrands(JSON.parse(savedCustomBrands));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveClubs = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem("yardage-tracker-clubs", JSON.stringify(clubs));
      } else {
        await AsyncStorage.setItem("yardage-tracker-clubs", JSON.stringify(clubs));
      }
    } catch (error) {
      console.error('Error saving clubs:', error);
    }
  };

  const saveCustomBrands = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem("yardage-tracker-custom-brands", JSON.stringify(customBrands));
      } else {
        await AsyncStorage.setItem("yardage-tracker-custom-brands", JSON.stringify(customBrands));
      }
    } catch (error) {
      console.error('Error saving custom brands:', error);
    }
  };

  const calculateAverage = (distances: number[]): number => {
    if (distances.length === 0) return 0;
    return Math.round(distances.reduce((sum, distance) => sum + distance, 0) / distances.length);
  };


  const updateBrand = (clubId: string, newBrand: string) => {
    setClubs((prevClubs) =>
      prevClubs.map((club) => {
        if (club.id === clubId) {
          return { ...club, brand: newBrand };
        }
        return club;
      }),
    );
  };



  const handleBrandPress = (clubId: string) => {
    router.push(`/edit-club?clubId=${clubId}`);
  };

  const handleEditPress = (clubId: string) => {
    router.push(`/edit-club?clubId=${clubId}`);
  };



  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Golf Bag ({clubs.length})</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.clubList}>
          {clubs.map((club, index) => (
            <View key={club.id}>
              <TouchableOpacity
                style={styles.clubItem}
                onPress={() => handleEditPress(club.id)}
                activeOpacity={0.7}
              >
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <View style={styles.brandButton}>
                    <Text style={styles.brandText}>{club.brand}</Text>
                    {club.model && <Text style={styles.modelText}> {club.model}</Text>}
                  </View>
                </View>

                <View style={styles.distanceContainer}>
                  <View style={styles.distanceDisplay}>
                    {club.swingAverages && ['pw', 'gw', 'sw', 'lw'].includes(club.id) ? (
                      <Text style={styles.distanceNumber}>{club.swingAverages.full}</Text>
                    ) : (
                      <Text style={styles.distanceNumber}>{club.averageDistance}</Text>
                    )}
                    <Text style={styles.distanceUnit}>Yds</Text>
                  </View>
                  <View style={styles.editButton}>
                    <Text style={styles.editButtonText}>▶</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {index < clubs.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
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
  clubList: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  clubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modelText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 12,
  },
  distanceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  distanceUnit: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 56,
  },
});