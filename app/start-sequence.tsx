import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Check, Flag, X } from 'lucide-react-native';

export default function StartSequenceScreen() {
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sequenceStatus, setSequenceStatus] = useState({
    warning: 'completed',
    preparatory: 'pending',
    oneMinute: 'pending',
    start: 'pending'
  });

  // Countdown timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, countdown]);

  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get next signal text
  const getNextSignal = () => {
    if (countdown > 240) return "Warning Signal Next";
    if (countdown > 60) return "Preparatory Signal Next";
    if (countdown > 0) return "One Minute Signal Next";
    return "Start Signal Active";
  };

  // Toggle sequence item status
  const toggleSequenceItem = (item: keyof typeof sequenceStatus) => {
    setSequenceStatus(prev => ({
      ...prev,
      [item]: prev[item] === 'completed' ? 'pending' : 'completed'
    }));
  };

  // Format countdown for display (with negative sign)
  const displayTime = `-${formatTime(countdown)}`;

  return (
    <ScrollView className="flex-1 bg-blue-900">
      {/* HUGE COUNTDOWN TIMER */}
      <View className="items-center justify-center py-8 bg-blue-800">
        <Text className="text-8xl font-bold text-white">
          {displayTime}
        </Text>
        <Text className="text-2xl font-semibold text-yellow-300 mt-2">
          {getNextSignal()}
        </Text>
      </View>

      <View className="flex-1 p-4 bg-blue-50">
        {/* SEQUENCE CHECKLIST */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-lg">
          <Text className="text-xl font-bold text-blue-900 mb-3">Sequence Checklist</Text>
          <View className="space-y-3">
            <TouchableOpacity 
              className="flex-row items-center p-2 rounded-lg"
              onPress={() => toggleSequenceItem('warning')}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${sequenceStatus.warning === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}>
                {sequenceStatus.warning === 'completed' ? (
                  <Check color="white" size={20} />
                ) : (
                  <Text className="text-gray-500 text-lg font-bold">1</Text>
                )}
              </View>
              <Text className={`text-lg ${sequenceStatus.warning === 'completed' ? 'line-through text-gray-500' : 'text-blue-900'}`}>
                -5:00 Warning (Class flag + sound)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-2 rounded-lg"
              onPress={() => toggleSequenceItem('preparatory')}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${sequenceStatus.preparatory === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}>
                {sequenceStatus.preparatory === 'completed' ? (
                  <Check color="white" size={20} />
                ) : (
                  <Text className="text-gray-500 text-lg font-bold">2</Text>
                )}
              </View>
              <Text className={`text-lg ${sequenceStatus.preparatory === 'completed' ? 'line-through text-gray-500' : 'text-blue-900'}`}>
                -4:00 Preparatory (P flag + sound)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-2 rounded-lg"
              onPress={() => toggleSequenceItem('oneMinute')}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${sequenceStatus.oneMinute === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}>
                {sequenceStatus.oneMinute === 'completed' ? (
                  <Check color="white" size={20} />
                ) : (
                  <Text className="text-gray-500 text-lg font-bold">3</Text>
                )}
              </View>
              <Text className={`text-lg ${sequenceStatus.oneMinute === 'completed' ? 'line-through text-gray-500' : 'text-blue-900'}`}>
                -1:00 One minute (P flag down + long sound)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-2 rounded-lg"
              onPress={() => toggleSequenceItem('start')}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${sequenceStatus.start === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}>
                {sequenceStatus.start === 'completed' ? (
                  <Check color="white" size={20} />
                ) : (
                  <Text className="text-gray-500 text-lg font-bold">4</Text>
                )}
              </View>
              <Text className={`text-lg ${sequenceStatus.start === 'completed' ? 'line-through text-gray-500' : 'text-blue-900'}`}>
                0:00 Start (Class flag down + sound)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FLAGS DISPLAYED */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-lg">
          <Text className="text-xl font-bold text-blue-900 mb-3">Current Flags</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center mb-2">
                <Flag color="white" size={32} />
              </View>
              <Text className="text-blue-900 font-semibold">Class Flag</Text>
              <Text className="text-green-600 text-sm">Active</Text>
            </View>
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center mb-2">
                <Text className="text-3xl text-gray-500">P</Text>
              </View>
              <Text className="text-blue-900 font-semibold">Preparatory</Text>
              <Text className="text-yellow-600 text-sm">Pending</Text>
            </View>
          </View>
        </View>

        {/* RECALLS SECTION */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-lg">
          <Text className="text-xl font-bold text-blue-900 mb-3">Recalls</Text>
          <View className="space-y-3">
            <TouchableOpacity className="flex-row items-center p-3 bg-red-50 rounded-lg">
              <View className="w-6 h-6 rounded border border-gray-300 items-center justify-center mr-3">
                <X color="red" size={16} />
              </View>
              <Text className="text-lg text-blue-900">Individual Recall (X flag + sound)</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center p-3 bg-red-50 rounded-lg">
              <View className="w-6 h-6 rounded border border-gray-300 items-center justify-center mr-3">
                <X color="red" size={16} />
              </View>
              <Text className="text-lg text-blue-900">General Recall (1st Substitute + 2 sounds)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* COURSE BOARD DISPLAY */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-lg">
          <Text className="text-xl font-bold text-blue-900 mb-3">Course Board</Text>
          <View className="items-center py-4">
            <Text className="text-3xl font-bold text-blue-900 mb-2">W-L 2 laps</Text>
            <Text className="text-2xl text-blue-700">1-2-1-2-Finish</Text>
          </View>
        </View>

        {/* PRIMARY CONTROLS */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-white mb-3">Controls</Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity className="flex-1 min-w-[40%] items-center justify-center bg-green-500 py-4 rounded-xl">
              <Text className="text-white text-xl font-bold">▶️ Start Countdown</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 min-w-[40%] items-center justify-center bg-yellow-500 py-4 rounded-xl">
              <Text className="text-white text-xl font-bold">⏸️ Postpone</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 min-w-[40%] items-center justify-center bg-red-500 py-4 rounded-xl">
              <Text className="text-white text-xl font-bold">⏹️ Abandon</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 min-w-[40%] items-center justify-center bg-orange-500 py-4 rounded-xl">
              <Text className="text-white text-xl font-bold">🔄 General Recall</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK FLAGS ROW */}
        <View className="bg-white rounded-xl p-4 shadow-lg">
          <Text className="text-xl font-bold text-blue-900 mb-3">Quick Flags</Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity className="flex-1 min-w-[30%] items-center py-3 bg-blue-100 rounded-lg">
              <Text className="text-blue-900 font-semibold">Black Flag</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 min-w-[30%] items-center py-3 bg-blue-100 rounded-lg">
              <Text className="text-blue-900 font-semibold">U Flag</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 min-w-[30%] items-center py-3 bg-blue-100 rounded-lg">
              <Text className="text-blue-900 font-semibold">Z Flag</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 min-w-[45%] items-center py-3 bg-blue-100 rounded-lg">
              <Text className="text-blue-900 font-semibold">Shorten Course</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 min-w-[45%] items-center py-3 bg-blue-100 rounded-lg">
              <Text className="text-blue-900 font-semibold">Change Course</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}