import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfirmDialog from '@/components/ConfirmDialog';

const golfBrands = [
  "Titleist",
  "TaylorMade",
  "Callaway",
  "PING",
  "Cobra",
  "Mizuno",
  "PXG",
  "Srixon",
  "Wilson Staff",
  "Honma",
  "Miura",
  "Sub 70 Golf",
  "Tour Edge",
  "Scotty Cameron",
  "Edel Golf",
  "Bettinardi",
  "LA Golf",
  "Kirkland",
  "Top Flight"
];

export default function SelectBrand() {
  const { clubId } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBrands, setFilteredBrands] = useState(golfBrands);
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [addingCustomBrand, setAddingCustomBrand] = useState(false);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [modelInput, setModelInput] = useState('');
  const [degreesInput, setDegreesInput] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingClubs, setPendingClubs] = useState<any[] | null>(null);
  const [ironIds] = useState(['4iron', '5iron', '6iron', '7iron', '8iron', '9iron']);
  const [wedgeIds] = useState(['pw', 'gw', 'sw', 'lw']);

  useEffect(() => {
    loadCustomBrands();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBrands([...golfBrands, ...customBrands].sort());
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = [...golfBrands, ...customBrands].filter(brand =>
        brand.toLowerCase().includes(query)
      ).sort();
      setFilteredBrands(filtered);
    }
  }, [searchQuery, customBrands]);

  const loadCustomBrands = async () => {
    try {
      let savedCustomBrands;
      
      if (Platform.OS === 'web') {
        savedCustomBrands = localStorage.getItem("yardage-tracker-custom-brands");
      } else {
        savedCustomBrands = await AsyncStorage.getItem("yardage-tracker-custom-brands");
      }
      
      if (savedCustomBrands) {
        setCustomBrands(JSON.parse(savedCustomBrands));
      }
    } catch (error) {
      console.error('Error loading custom brands:', error);
    }
  };

  const saveCustomBrands = async (brands: string[]) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem("yardage-tracker-custom-brands", JSON.stringify(brands));
      } else {
        await AsyncStorage.setItem("yardage-tracker-custom-brands", JSON.stringify(brands));
      }
    } catch (error) {
      console.error('Error saving custom brands:', error);
    }
  };

  const selectBrand = (brand: string) => {
    setSelectedBrand(brand);
  };

  const saveBrandAndModel = async () => {
    if (!selectedBrand) return;

    try {
      let savedClubs;

      if (Platform.OS === 'web') {
        savedClubs = localStorage.getItem("yardage-tracker-clubs");
      } else {
        savedClubs = await AsyncStorage.getItem("yardage-tracker-clubs");
      }

      if (savedClubs && clubId) {
        const clubs = JSON.parse(savedClubs);
        const isIron = ironIds.includes(clubId as string);

        if (isIron) {
          setPendingClubs(clubs);
          setShowConfirmDialog(true);
        } else {
          updateClubs(clubs, [clubId as string]);
        }
      }
    } catch (error) {
      console.error('Error updating brand and model:', error);
    }
  };

  const updateClubs = async (clubs: any[], clubIdsToUpdate: string[]) => {
    try {
      const updatedClubs = clubs.map((club: any) => {
        if (clubIdsToUpdate.includes(club.id)) {
          const updatedClub: any = { ...club, brand: selectedBrand, model: modelInput.trim() };

          if (wedgeIds.includes(club.id) && degreesInput.trim()) {
            updatedClub.degrees = parseInt(degreesInput.trim());
            const wedgeName = club.name.split(' - ')[0];
            updatedClub.name = `${wedgeName} - ${degreesInput.trim()}`;
          }

          return updatedClub;
        }
        return club;
      });

      if (Platform.OS === 'web') {
        localStorage.setItem("yardage-tracker-clubs", JSON.stringify(updatedClubs));
      } else {
        await AsyncStorage.setItem("yardage-tracker-clubs", JSON.stringify(updatedClubs));
      }

      router.back();
    } catch (error) {
      console.error('Error updating clubs:', error);
    }
  };

  const addCustomBrand = () => {
    const trimmedBrand = customBrandInput.trim();
    if (trimmedBrand && !golfBrands.includes(trimmedBrand) && !customBrands.includes(trimmedBrand)) {
      const newCustomBrands = [...customBrands, trimmedBrand];
      setCustomBrands(newCustomBrands);
      saveCustomBrands(newCustomBrands);
      setCustomBrandInput('');
      setAddingCustomBrand(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ConfirmDialog
        visible={showConfirmDialog}
        title="Update All Irons?"
        message="Would you like to apply this brand and model to all irons (4i - 9i)?"
        confirmText="All Irons"
        cancelText="Just This Club"
        onConfirm={() => {
          if (pendingClubs) {
            updateClubs(pendingClubs, ironIds);
          }
          setShowConfirmDialog(false);
          setPendingClubs(null);
        }}
        onCancel={() => {
          if (pendingClubs) {
            updateClubs(pendingClubs, [clubId as string]);
          }
          setShowConfirmDialog(false);
          setPendingClubs(null);
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Brand</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search brands..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            returnKeyType="search"
          />
        </View>

        {/* Add Custom Brand */}
        <View style={styles.addCustomContainer}>
          {addingCustomBrand ? (
            <View style={styles.customBrandInput}>
              <TextInput
                style={styles.customBrandTextInput}
                placeholder="Enter brand name"
                value={customBrandInput}
                onChangeText={setCustomBrandInput}
                autoFocus
                onSubmitEditing={addCustomBrand}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={addCustomBrand}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setAddingCustomBrand(false);
                  setCustomBrandInput('');
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addCustomButton}
              onPress={() => setAddingCustomBrand(true)}
            >
              <Text style={styles.addCustomButtonText}>+ Add Custom Brand</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Brand List */}
        {!selectedBrand ? (
          <ScrollView style={styles.brandList} showsVerticalScrollIndicator={false}>
            {filteredBrands.map((brand) => (
              <TouchableOpacity
                key={brand}
                style={styles.brandOption}
                onPress={() => selectBrand(brand)}
              >
                <Text style={styles.brandOptionText}>{brand}</Text>
                {customBrands.includes(brand) && (
                  <Text style={styles.customLabel}>Custom</Text>
                )}
              </TouchableOpacity>
            ))}

            {filteredBrands.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No brands found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.modelContainer}>
            <View style={styles.selectedBrandCard}>
              <Text style={styles.selectedBrandLabel}>Selected Brand</Text>
              <Text style={styles.selectedBrandText}>{selectedBrand}</Text>
            </View>

            <View style={styles.modelInputSection}>
              <Text style={styles.modelLabel}>Model (Optional)</Text>
              <TextInput
                style={styles.modelInput}
                placeholder="Enter club model"
                value={modelInput}
                onChangeText={setModelInput}
                returnKeyType={wedgeIds.includes(clubId as string) ? "next" : "done"}
                onSubmitEditing={wedgeIds.includes(clubId as string) ? undefined : saveBrandAndModel}
                autoFocus
              />
            </View>

            {wedgeIds.includes(clubId as string) && (
              <View style={styles.modelInputSection}>
                <Text style={styles.modelLabel}>Degrees (Optional)</Text>
                <TextInput
                  style={styles.modelInput}
                  placeholder="Enter degrees (e.g., 48, 52, 56, 60)"
                  value={degreesInput}
                  onChangeText={setDegreesInput}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={saveBrandAndModel}
                />
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveBrandAndModel}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backToListButton}
                onPress={() => setSelectedBrand(null)}
              >
                <Text style={styles.backToListButtonText}>Change Brand</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchInput: {
    height: 50,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addCustomContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  addCustomButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addCustomButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  customBrandInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customBrandTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  brandList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  brandOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  brandOptionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  customLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  modelContainer: {
    flex: 1,
    padding: 20,
  },
  selectedBrandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  selectedBrandLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  selectedBrandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  modelInputSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  modelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  modelInput: {
    height: 50,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  backToListButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backToListButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
