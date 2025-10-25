import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';

interface WheelPickerProps {
  values: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  itemHeight?: number;
  visibleItems?: number;
}

export default function WheelPicker({
  values,
  selectedValue,
  onValueChange,
  itemHeight = 44,
  visibleItems = 5,
}: WheelPickerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const containerHeight = itemHeight * visibleItems;
  const paddingVertical = itemHeight * Math.floor(visibleItems / 2);

  useEffect(() => {
    const index = values.indexOf(selectedValue);
    if (index !== -1 && scrollViewRef.current && !isScrolling) {
      scrollViewRef.current.scrollTo({
        y: index * itemHeight,
        animated: false,
      });
    }
  }, [selectedValue, itemHeight, values, isScrolling]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    setIsScrolling(true);

    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
      const index = Math.round(yOffset / itemHeight);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, index));

      if (values[clampedIndex] !== selectedValue) {
        onValueChange(values[clampedIndex]);
      }

      scrollViewRef.current?.scrollTo({
        y: clampedIndex * itemHeight,
        animated: true,
      });
    }, 150);
  };

  const getItemOpacity = (index: number) => {
    const selectedIndex = values.indexOf(selectedValue);
    const distance = Math.abs(index - selectedIndex);

    if (distance === 0) return 1;
    if (distance === 1) return 0.4;
    return 0.2;
  };

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      <View style={[styles.highlight, { height: itemHeight }]} />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: paddingVertical,
        }}
      >
        {values.map((value, index) => (
          <View
            key={value}
            style={[styles.item, { height: itemHeight }]}
          >
            <Text
              style={[
                styles.itemText,
                {
                  opacity: getItemOpacity(index),
                  color: value === selectedValue ? '#fff' : '#999',
                },
              ]}
            >
              {value}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    width: '100%',
    top: '50%',
    transform: [{ translateY: -22 }],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 28,
    fontWeight: '400',
  },
});
