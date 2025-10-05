import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { ChevronRight, Plus, Wrench, Anchor, Search } from 'lucide-react-native';

export default function BoatSetupScreen() {
  const [hullMaker, setHullMaker] = useState('');
  const [sailMaker, setSailMaker] = useState('');
  const [mastMaker, setMastMaker] = useState('');
  const [rigMaker, setRigMaker] = useState('');
  const [electronicsMaker, setElectronicsMaker] = useState('');
  const [additionalEquipment, setAdditionalEquipment] = useState('');
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  
  // Auto-suggest states
  const [hullSuggestions, setHullSuggestions] = useState<string[]>([]);
  const [sailSuggestions, setSailSuggestions] = useState<{name: string, localOffice?: string}[]>([]);
  const [mastSuggestions, setMastSuggestions] = useState<string[]>([]);
  const [rigSuggestions, setRigSuggestions] = useState<string[]>([]);
  const [electronicsSuggestions, setElectronicsSuggestions] = useState<string[]>([]);
  
  const [showHullSuggestions, setShowHullSuggestions] = useState(false);
  const [showSailSuggestions, setShowSailSuggestions] = useState(false);
  const [showMastSuggestions, setShowMastSuggestions] = useState(false);
  const [showRigSuggestions, setShowRigSuggestions] = useState(false);
  const [showElectronicsSuggestions, setShowElectronicsSuggestions] = useState(false);

  // Mock data for suggestions based on boat types
  const hullMakers = [
    "Beneteau", "Jeanneau", "Dufour", "Jeanneau Yachts", "Bavaria", 
    "Hanse", "Dehler", "Elan", "Nexus", "Sealine"
  ];
  
  const sailMakers = [
    { name: "North Sails", localOffice: "Hong Kong Service Center" },
    { name: "Quantum Sails", localOffice: "Shenzhen Loft" },
    { name: "Doyle Sails", localOffice: "Singapore Workshop" },
    { name: "B&G Sails" },
    { name: "Hood Sails" },
    { name: "Masthead Sails" }
  ];
  
  const mastMakers = [
    "Fusion Masts", "Hall Spars", "Southern Spars", "ZSpars", 
    "Proctor Masts", "Carbon Spars", "MastTech"
  ];
  
  const rigMakers = [
    "Harken", "Ronstan", "Lewmar", "Seldén", "Forespar", 
    "Bartels Rigg", "ProSail", "Rigging Solutions"
  ];
  
  const electronicsMakers = [
    "Garmin", "Raymarine", "Lowrance", "Simrad", "B&G", 
    "Vesper Marine", "AIS Live", "Navionics"
  ];

  // Filter suggestions based on input
  useEffect(() => {
    if (hullMaker.length > 1) {
      const filtered = hullMakers.filter(maker => 
        maker.toLowerCase().includes(hullMaker.toLowerCase())
      );
      setHullSuggestions(filtered);
      setShowHullSuggestions(true);
    } else {
      setHullSuggestions([]);
      setShowHullSuggestions(false);
    }
  }, [hullMaker]);

  useEffect(() => {
    if (sailMaker.length > 1) {
      const filtered = sailMakers.filter(maker => 
        maker.name.toLowerCase().includes(sailMaker.toLowerCase())
      );
      setSailSuggestions(filtered);
      setShowSailSuggestions(true);
    } else {
      setSailSuggestions([]);
      setShowSailSuggestions(false);
    }
  }, [sailMaker]);

  useEffect(() => {
    if (mastMaker.length > 1) {
      const filtered = mastMakers.filter(maker => 
        maker.toLowerCase().includes(mastMaker.toLowerCase())
      );
      setMastSuggestions(filtered);
      setShowMastSuggestions(true);
    } else {
      setMastSuggestions([]);
      setShowMastSuggestions(false);
    }
  }, [mastMaker]);

  useEffect(() => {
    if (rigMaker.length > 1) {
      const filtered = rigMakers.filter(maker => 
        maker.toLowerCase().includes(rigMaker.toLowerCase())
      );
      setRigSuggestions(filtered);
      setShowRigSuggestions(true);
    } else {
      setRigSuggestions([]);
      setShowRigSuggestions(false);
    }
  }, [rigMaker]);

  useEffect(() => {
    if (electronicsMaker.length > 1) {
      const filtered = electronicsMakers.filter(maker => 
        maker.toLowerCase().includes(electronicsMaker.toLowerCase())
      );
      setElectronicsSuggestions(filtered);
      setShowElectronicsSuggestions(true);
    } else {
      setElectronicsSuggestions([]);
      setShowElectronicsSuggestions(false);
    }
  }, [electronicsMaker]);

  const handleAddEquipment = () => {
    if (additionalEquipment.trim()) {
      setEquipmentList([...equipmentList, additionalEquipment.trim()]);
      setAdditionalEquipment('');
    }
  };

  const removeEquipment = (index: number) => {
    setEquipmentList(equipmentList.filter((_, i) => i !== index));
  };

  const selectHullMaker = (maker: string) => {
    setHullMaker(maker);
    setShowHullSuggestions(false);
  };

  const selectSailMaker = (maker: {name: string, localOffice?: string}) => {
    setSailMaker(maker.name);
    setShowSailSuggestions(false);
  };

  const selectMastMaker = (maker: string) => {
    setMastMaker(maker);
    setShowMastSuggestions(false);
  };

  const selectRigMaker = (maker: string) => {
    setRigMaker(maker);
    setShowRigSuggestions(false);
  };

  const selectElectronicsMaker = (maker: string) => {
    setElectronicsMaker(maker);
    setShowElectronicsSuggestions(false);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Progress Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">Step 3 of 5</Text>
          <Text className="text-white text-sm">1:30 remaining</Text>
        </View>
        
        {/* Progress Bar */}
        <View className="h-2 bg-blue-400 rounded-full">
          <View className="w-[60%] h-2 bg-white rounded-full" />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4">
        <View className="mt-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Tailor Your Boat Setup
          </Text>
          <Text className="text-gray-500 mb-6">
            Add your boat details to receive personalized tuning guides
          </Text>

          {/* Maker Inputs with Auto-Suggest */}
          <View className="mb-6">
            {/* Hull Maker */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Hull Maker</Text>
              <View className="relative">
                <TextInput
                  value={hullMaker}
                  onChangeText={setHullMaker}
                  onFocus={() => hullMaker.length > 0 && setShowHullSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowHullSuggestions(false), 150)}
                  placeholder="Enter hull manufacturer"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base"
                />
                {showHullSuggestions && hullSuggestions.length > 0 && (
                  <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 z-10 shadow-lg">
                    <FlatList
                      data={hullSuggestions}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          className="p-3 border-b border-gray-100"
                          onPress={() => selectHullMaker(item)}
                        >
                          <Text className="text-gray-800">{item}</Text>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={hullSuggestions.length > 4}
                      style={{ maxHeight: 200 }}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Sail Maker */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Sail Maker</Text>
              <View className="relative">
                <TextInput
                  value={sailMaker}
                  onChangeText={setSailMaker}
                  onFocus={() => sailMaker.length > 0 && setShowSailSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSailSuggestions(false), 150)}
                  placeholder="Enter sail manufacturer"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base"
                />
                {showSailSuggestions && sailSuggestions.length > 0 && (
                  <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 z-10 shadow-lg">
                    <FlatList
                      data={sailSuggestions}
                      keyExtractor={(item) => item.name}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          className="p-3 border-b border-gray-100"
                          onPress={() => selectSailMaker(item)}
                        >
                          <Text className="text-gray-800 font-medium">{item.name}</Text>
                          {item.localOffice && (
                            <Text className="text-blue-600 text-sm mt-1">{item.localOffice}</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      scrollEnabled={sailSuggestions.length > 4}
                      style={{ maxHeight: 200 }}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Mast Maker */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Mast Maker</Text>
              <View className="relative">
                <TextInput
                  value={mastMaker}
                  onChangeText={setMastMaker}
                  onFocus={() => mastMaker.length > 0 && setShowMastSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowMastSuggestions(false), 150)}
                  placeholder="Enter mast manufacturer"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base"
                />
                {showMastSuggestions && mastSuggestions.length > 0 && (
                  <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 z-10 shadow-lg">
                    <FlatList
                      data={mastSuggestions}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          className="p-3 border-b border-gray-100"
                          onPress={() => selectMastMaker(item)}
                        >
                          <Text className="text-gray-800">{item}</Text>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={mastSuggestions.length > 4}
                      style={{ maxHeight: 200 }}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Rig Maker */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Rig Maker</Text>
              <View className="relative">
                <TextInput
                  value={rigMaker}
                  onChangeText={setRigMaker}
                  onFocus={() => rigMaker.length > 0 && setShowRigSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowRigSuggestions(false), 150)}
                  placeholder="Enter rig manufacturer"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base"
                />
                {showRigSuggestions && rigSuggestions.length > 0 && (
                  <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 z-10 shadow-lg">
                    <FlatList
                      data={rigSuggestions}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          className="p-3 border-b border-gray-100"
                          onPress={() => selectRigMaker(item)}
                        >
                          <Text className="text-gray-800">{item}</Text>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={rigSuggestions.length > 4}
                      style={{ maxHeight: 200 }}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Electronics Maker */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Electronics Maker</Text>
              <View className="relative">
                <TextInput
                  value={electronicsMaker}
                  onChangeText={setElectronicsMaker}
                  onFocus={() => electronicsMaker.length > 0 && setShowElectronicsSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowElectronicsSuggestions(false), 150)}
                  placeholder="Enter electronics manufacturer"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base"
                />
                {showElectronicsSuggestions && electronicsSuggestions.length > 0 && (
                  <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 z-10 shadow-lg">
                    <FlatList
                      data={electronicsSuggestions}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          className="p-3 border-b border-gray-100"
                          onPress={() => selectElectronicsMaker(item)}
                        >
                          <Text className="text-gray-800">{item}</Text>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={electronicsSuggestions.length > 4}
                      style={{ maxHeight: 200 }}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Additional Equipment */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Additional Equipment
            </Text>
            
            {/* Equipment Input */}
            <View className="flex-row mb-4">
              <TextInput
                value={additionalEquipment}
                onChangeText={setAdditionalEquipment}
                placeholder="Add equipment (e.g., GPS, Instruments)"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-l-xl p-4 text-base"
              />
              <TouchableOpacity 
                onPress={handleAddEquipment}
                className="bg-blue-600 rounded-r-xl items-center justify-center px-4"
              >
                <Plus size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Equipment List */}
            {equipmentList.length > 0 && (
              <View className="mt-4">
                {equipmentList.map((item, index) => (
                  <View 
                    key={index} 
                    className="flex-row items-center bg-blue-50 rounded-xl p-4 mb-3"
                  >
                    <Wrench size={20} className="text-blue-600 mr-3" />
                    <Text className="text-gray-800 flex-1">{item}</Text>
                    <TouchableOpacity onPress={() => removeEquipment(index)}>
                      <Text className="text-blue-600 font-medium">Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-4 py-4 border-t border-gray-200">
        <TouchableOpacity 
          className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center"
          onPress={() => {
            // Navigation would go here
            Alert.alert('Success', 'Boat setup saved!');
          }}
        >
          <Text className="text-white font-semibold text-lg">
            Continue to Clubs
          </Text>
          <ChevronRight size={20} color="white" className="ml-2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}