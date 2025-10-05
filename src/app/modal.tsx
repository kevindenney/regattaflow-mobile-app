import { StatusBar } from "expo-status-bar";
import { Platform, View, Text } from "react-native";

export default function ModalScreen() {
  return (
    <View className="flex flex-1 items-center justify-center">
      <Text className="text-xl font-bold">Modal</Text>
      <View className="my-7 h-px w-4/5 bg-gray-200" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}
