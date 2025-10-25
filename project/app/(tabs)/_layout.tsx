import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="bag"
        options={{
          title: 'My Bag',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="quick-add"
        options={{
          title: 'Add Shot',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
