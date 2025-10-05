import React from 'react';
import { View, Text, Animated } from 'react-native';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';

export const NetworkStatusBanner = () => {
  const { isOnline, isConnecting } = useNetworkStatus();
  const [slideAnim] = React.useState(new Animated.Value(-60));

  React.useEffect(() => {
    if (!isOnline) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: -60,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  if (isOnline && !isConnecting) {
    return null;
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
      }}
      className="absolute top-0 left-0 right-0 z-50"
    >
      <View className={`py-2 px-4 ${isConnecting ? 'bg-yellow-500' : 'bg-red-500'}`}>
        <View className="flex-row items-center justify-center">
          {isConnecting ? (
            <Wifi color="white" size={16} />
          ) : (
            <WifiOff color="white" size={16} />
          )}
          <Text className="text-white font-semibold ml-2">
            {isConnecting ? 'Connecting...' : 'No internet connection'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};
