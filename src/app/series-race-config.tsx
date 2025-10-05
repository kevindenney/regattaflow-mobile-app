import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { 
  ChevronLeft, Calendar, Clock, Users, MapPin, DollarSign, 
  FileText, Send, Save, Upload, CheckCircle
} from 'lucide-react-native';

const SeriesRaceConfigScreen = () => {
  // Basic Information
  const [eventName, setEventName] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedRaceNumber, setSelectedRaceNumber] = useState('');

  // Date & Time
  const [selectedDate, setSelectedDate] = useState('');
  const [firstWarning, setFirstWarning] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');

  // Classes & Divisions
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [customClass, setCustomClass] = useState('');

  // Course
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [laps, setLaps] = useState('');
  const [marksAssignment, setMarksAssignment] = useState('auto');
  const [timeLimit, setTimeLimit] = useState('');

  // Entry Management
  const [onlineRegistration, setOnlineRegistration] = useState(true);
  const [entryFee, setEntryFee] = useState('');
  const [entryLimit, setEntryLimit] = useState('');
  const [lateEntrySurcharge, setLateEntrySurcharge] = useState('');
  const [entryDeadline, setEntryDeadline] = useState('');

  // Scoring
  const [scoringSystem, setScoringSystem] = useState('');
  const [tiesResolution, setTiesResolution] = useState('');
  const [protestsHandling, setProtestsHandling] = useState('');

  // Officials
  const [pro, setPro] = useState('');
  const [assistantPro, setAssistantPro] = useState('');
  const [markBoat, setMarkBoat] = useState('');

  // Documents
  const [useSeriesNOR, setUseSeriesNOR] = useState(true);
  const [generateStandardSIs, setGenerateStandardSIs] = useState(true);
  const [customCourseDiagram, setCustomCourseDiagram] = useState(false);

  // Communications
  const [sendEntryConfirmation, setSendEntryConfirmation] = useState(true);
  const [sendRaceDayReminders, setSendRaceDayReminders] = useState(true);
  const [publishResults, setPublishResults] = useState(true);
  const [sendResultsEmail, setSendResultsEmail] = useState(true);

  // Available options
  const seriesOptions = [
    'Spring Series 2023',
    'Summer Championship',
    'Fall Fleet Racing',
    'Winter Series'
  ];

  const raceNumbers = Array.from({ length: 20 }, (_, i) => (i + 1).toString());

  const boatClasses = [
    { id: 'dragon', name: 'Dragon (Fleet Racing)' },
    { id: 'j70', name: 'J/70 (Fleet Racing)' },
    { id: 'etchells', name: 'Etchells (Fleet Racing)' }
  ];

  const courseTypes = [
    'Windward-Leeward',
    'Triangle',
    'Trapezoid',
    'Bearing',
    'Custom'
  ];

  const durations = ['1 hour', '2 hours', '3 hours', '4 hours'];

  const scoringSystems = [
    'Low Point',
    'High Point',
    'Modified Low Point',
    'Custom'
  ];

  const tiesResolutions = [
    'Standard Ties',
    'Countback',
    'Coin Toss',
    'Race Committee Discretion'
  ];

  const protestsOptions = [
    'Standard Protest Rules',
    'Digital Protest Submission',
    'In-Person Only',
    'Committee Review Required'
  ];

  const entryDeadlines = [
    'Day before race',
    '2 days before race',
    '1 week before race',
    'Custom'
  ];

  const toggleClassSelection = (classId: string) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const addCustomClass = () => {
    if (customClass.trim() !== '') {
      setSelectedClasses([...selectedClasses, customClass]);
      setCustomClass('');
    }
  };

  const handleSaveAsDraft = () => {
    Alert.alert('Draft Saved', 'Your race configuration has been saved as a draft.');
  };

  const handleCreateAndPublish = () => {
    Alert.alert('Race Published', 'Your race has been created and published successfully.');
  };

  const handleSaveAsTemplate = () => {
    Alert.alert('Template Saved', 'Your race configuration has been saved as a template.');
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity className="p-2">
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1 text-center">
            Series Race Configuration
          </Text>
        </View>
        <Text className="text-blue-100 text-center">
          Template: Spring Series Race
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Basic Information Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Basic Information
          </Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Event Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Enter event name"
              value={eventName}
              onChangeText={setEventName}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Series</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TouchableOpacity className="px-4 py-3">
                <Text className={selectedSeries ? "text-gray-800" : "text-gray-400"}>
                  {selectedSeries || "Select series"}
                </Text>
              </TouchableOpacity>
              {/* Dropdown options would be implemented here */}
            </View>
          </View>
          
          <View>
            <Text className="text-gray-700 font-medium mb-1">Race Number</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TouchableOpacity className="px-4 py-3">
                <Text className={selectedRaceNumber ? "text-gray-800" : "text-gray-400"}>
                  {selectedRaceNumber || "Select race number"}
                </Text>
              </TouchableOpacity>
              {/* Dropdown options would be implemented here */}
            </View>
          </View>
        </View>

        {/* Date & Time Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Date & Time
          </Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Date</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-4 py-3">
              <Calendar size={20} color="#6B7280" className="mr-2" />
              <Text className="text-gray-400">Select date</Text>
            </View>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">First Warning Time</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-4 py-3">
              <Clock size={20} color="#6B7280" className="mr-2" />
              <Text className="text-gray-400">Select time (Local Time: EST)</Text>
            </View>
          </View>
          
          <View>
            <Text className="text-gray-700 font-medium mb-1">Estimated Duration</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TouchableOpacity className="px-4 py-3">
                <Text className={selectedDuration ? "text-gray-800" : "text-gray-400"}>
                  {selectedDuration || "Select duration"}
                </Text>
              </TouchableOpacity>
              {/* Dropdown options would be implemented here */}
            </View>
          </View>
        </View>

        {/* Classes & Divisions */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Classes & Divisions
          </Text>
          
          {boatClasses.map((boatClass) => (
            <TouchableOpacity
              key={boatClass.id}
              className="flex-row items-center py-3 border-b border-gray-100"
              onPress={() => toggleClassSelection(boatClass.id)}
            >
              <View className="mr-3">
                {selectedClasses.includes(boatClass.id) ? (
                  <CheckCircle size={24} color="#10B981" />
                ) : (
                  <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
              </View>
              <Text className="text-gray-800">{boatClass.name}</Text>
            </TouchableOpacity>
          ))}
          
          <View className="flex-row mt-3">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Add custom class"
              value={customClass}
              onChangeText={setCustomClass}
            />
            <TouchableOpacity 
              className="bg-blue-600 rounded-lg ml-2 px-4 justify-center"
              onPress={addCustomClass}
            >
              <Text className="text-white font-medium">Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Course Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Course
          </Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Course Type</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TouchableOpacity className="px-4 py-3">
                <Text className={selectedCourseType ? "text-gray-800" : "text-gray-400"}>
                  {selectedCourseType || "Select course type"}
                </Text>
              </TouchableOpacity>
              {/* Dropdown options would be implemented here */}
            </View>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Laps</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Number of laps"
              value={laps}
              onChangeText={setLaps}
              keyboardType="numeric"
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Marks Assignment</Text>
            <View className="flex-row">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-l-lg border ${marksAssignment === 'auto' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                onPress={() => setMarksAssignment('auto')}
              >
                <Text className={`text-center ${marksAssignment === 'auto' ? 'text-white' : 'text-gray-700'}`}>
                  Auto-assign
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-r-lg border ${marksAssignment === 'manual' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                onPress={() => setMarksAssignment('manual')}
              >
                <Text className={`text-center ${marksAssignment === 'manual' ? 'text-white' : 'text-gray-700'}`}>
                  Manual
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View>
            <Text className="text-gray-700 font-medium mb-1">Time Limit (minutes)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Enter time limit"
              value={timeLimit}
              onChangeText={setTimeLimit}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Entry Management */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Entry Management
          </Text>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-gray-800">Online Registration Enabled</Text>
            <TouchableOpacity 
              className={`w-12 h-6 rounded-full ${onlineRegistration ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}
              onPress={() => setOnlineRegistration(!onlineRegistration)}
            >
              <View className={`w-5 h-5 rounded-full bg-white ${onlineRegistration ? 'ml-6' : 'ml-0.5'}`} />
            </TouchableOpacity>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Entry Fee ($)</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-4 py-3">
              <DollarSign size={20} color="#6B7280" className="mr-2" />
              <TextInput
                className="flex-1"
                placeholder="0.00"
                value={entryFee}
                onChangeText={setEntryFee}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Entry Limit</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Number of boats"
              value={entryLimit}
              onChangeText={setEntryLimit}
              keyboardType="numeric"
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Late Entry Surcharge ($)</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-4 py-3">
              <DollarSign size={20} color="#6B7280" className="mr-2" />
              <TextInput
                className="flex-1"
                placeholder="0.00"
                value={lateEntrySurcharge}
                onChangeText={setLateEntrySurcharge}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View>
            <Text className="text-gray-700 font-medium mb-1">Entry Deadline</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TouchableOpacity className="px-4 py-3">
                <Text className={entryDeadline ? "text-gray-800" : "text-gray-400"}>
                  {entryDeadline || "Select deadline"}
                </Text>
              </TouchableOpacity>
              {/* Dropdown options would be implemented here */}
            </View>
          </View>
        </View>

        {/* Scoring Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Scoring
          </Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Scoring System</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TouchableOpacity className="px-4 py-3">
                <Text className={scoringSystem ? "text-gray-800" : "text-gray-400"}>
                  {scoringSystem || "Select scoring system"}
                </Text>
              </TouchableOpacity>
              {/* Dropdown options would be implemented here */}
            </View>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Ties Resolution</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TouchableOpacity className="px-4 py-3">
                <Text className={tiesResolution ? "text-gray-800" : "text-gray-400"}>
                  {tiesResolution || "Select resolution method"}
                </Text>
              </TouchableOpacity>
              {/* Dropdown options would be implemented here */}
            </View>
          </View>
          
          <View>
            <Text className="text-gray-700 font-medium mb-1">Protests Handling</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TouchableOpacity className="px-4 py-3">
                <Text className={protestsHandling ? "text-gray-800" : "text-gray-400"}>
                  {protestsHandling || "Select handling method"}
                </Text>
              </TouchableOpacity>
              {/* Dropdown options would be implemented here */}
            </View>
          </View>
        </View>

        {/* Officials Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Officials
          </Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">PRO</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Auto-filled from defaults"
              value={pro}
              onChangeText={setPro}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">Assistant PRO</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Select assistant PRO"
              value={assistantPro}
              onChangeText={setAssistantPro}
            />
          </View>
          
          <View>
            <Text className="text-gray-700 font-medium mb-1">Mark Boat</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Select mark boat"
              value={markBoat}
              onChangeText={setMarkBoat}
            />
          </View>
        </View>

        {/* Documents */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Documents
          </Text>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-gray-800">Use series NOR</Text>
            <TouchableOpacity 
              className={`w-12 h-6 rounded-full ${useSeriesNOR ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}
              onPress={() => setUseSeriesNOR(!useSeriesNOR)}
            >
              <View className={`w-5 h-5 rounded-full bg-white ${useSeriesNOR ? 'ml-6' : 'ml-0.5'}`} />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-gray-800">Generate standard SIs</Text>
            <TouchableOpacity 
              className={`w-12 h-6 rounded-full ${generateStandardSIs ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}
              onPress={() => setGenerateStandardSIs(!generateStandardSIs)}
            >
              <View className={`w-5 h-5 rounded-full bg-white ${generateStandardSIs ? 'ml-6' : 'ml-0.5'}`} />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center justify-between py-3">
            <Text className="text-gray-800">Custom course diagram needed</Text>
            <TouchableOpacity 
              className={`w-12 h-6 rounded-full ${customCourseDiagram ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}
              onPress={() => setCustomCourseDiagram(!customCourseDiagram)}
            >
              <View className={`w-5 h-5 rounded-full bg-white ${customCourseDiagram ? 'ml-6' : 'ml-0.5'}`} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Communications */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            Communications
          </Text>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-gray-800">Send entry confirmation emails</Text>
            <TouchableOpacity 
              className={`w-12 h-6 rounded-full ${sendEntryConfirmation ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}
              onPress={() => setSendEntryConfirmation(!sendEntryConfirmation)}
            >
              <View className={`w-5 h-5 rounded-full bg-white ${sendEntryConfirmation ? 'ml-6' : 'ml-0.5'}`} />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-gray-800">Send race day reminders</Text>
            <TouchableOpacity 
              className={`w-12 h-6 rounded-full ${sendRaceDayReminders ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}
              onPress={() => setSendRaceDayReminders(!sendRaceDayReminders)}
            >
              <View className={`w-5 h-5 rounded-full bg-white ${sendRaceDayReminders ? 'ml-6' : 'ml-0.5'}`} />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-gray-800">Publish results to website</Text>
            <TouchableOpacity 
              className={`w-12 h-6 rounded-full ${publishResults ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}
              onPress={() => setPublishResults(!publishResults)}
            >
              <View className={`w-5 h-5 rounded-full bg-white ${publishResults ? 'ml-6' : 'ml-0.5'}`} />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center justify-between py-3">
            <Text className="text-gray-800">Send results email to fleet</Text>
            <TouchableOpacity 
              className={`w-12 h-6 rounded-full ${sendResultsEmail ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}
              onPress={() => setSendResultsEmail(!sendResultsEmail)}
            >
              <View className={`w-5 h-5 rounded-full bg-white ${sendResultsEmail ? 'ml-6' : 'ml-0.5'}`} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white flex-row">
        <TouchableOpacity 
          className="flex-1 border border-gray-300 rounded-xl py-3 mr-2 flex-row items-center justify-center"
          onPress={handleSaveAsDraft}
        >
          <Save size={20} color="#6B7280" className="mr-2" />
          <Text className="text-gray-700 font-medium">Save as Draft</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-1 bg-blue-600 rounded-xl py-3 flex-row items-center justify-center"
          onPress={handleCreateAndPublish}
        >
          <Upload size={20} color="white" className="mr-2" />
          <Text className="text-white font-medium">Create & Publish</Text>
        </TouchableOpacity>
      </View>
      
      <View className="px-4 pb-4">
        <TouchableOpacity 
          className="py-3 items-center"
          onPress={handleSaveAsTemplate}
        >
          <Text className="text-blue-600 font-medium">Save as Template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SeriesRaceConfigScreen;