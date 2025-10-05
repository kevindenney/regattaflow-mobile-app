import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      setIsConnecting(state.isInternetReachable === null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline, isConnecting };
};
