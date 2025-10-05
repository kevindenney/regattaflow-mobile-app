import React from 'react';
import { View, Text } from 'react-native';

interface EditScreenInfoProps {
  path: string;
}

export default function EditScreenInfo({ path }: EditScreenInfoProps) {
  return (
    <View>
      <Text style={{ color: '#666', fontSize: 12 }}>Path: {path}</Text>
    </View>
  );
}
