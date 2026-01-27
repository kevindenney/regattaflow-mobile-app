/**
 * SSI Extraction Preview Component
 *
 * Displays extracted data from Sailing Instructions in a compact, actionable format.
 * Optimized for race day quick reference.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { SSIExtraction, SSIVHFChannel, SSIEmergencyContact, SSIMark } from '@/types/ssi';

interface SSIExtractionPreviewProps {
  extraction: SSIExtraction;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Show only specific sections */
  sections?: ('vhf' | 'marks' | 'contacts' | 'procedures')[];
  /** Callback when a VHF channel is tapped */
  onVHFChannelPress?: (channel: SSIVHFChannel) => void;
  /** Callback when an emergency contact is tapped */
  onContactPress?: (contact: SSIEmergencyContact) => void;
}

export function SSIExtractionPreview({
  extraction,
  compact = false,
  sections,
  onVHFChannelPress,
  onContactPress,
}: SSIExtractionPreviewProps) {
  const showSection = (section: string) => !sections || sections.includes(section as any);

  const handleCopyChannel = async (channel: string) => {
    await Clipboard.setStringAsync(channel);
    // Could show a toast here
  };

  const handleCallPhone = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  // Get all VHF channels in a flat list for quick reference
  const getAllVHFChannels = (): { channel: string; purpose: string }[] => {
    const channels: { channel: string; purpose: string }[] = [];
    const vhf = extraction.vhfChannels;

    if (vhf?.raceCommittee) {
      channels.push({
        channel: vhf.raceCommittee.channel,
        purpose: vhf.raceCommittee.name || 'Race Committee',
      });
    }
    if (vhf?.safety) {
      channels.push({
        channel: vhf.safety.channel,
        purpose: vhf.safety.name || 'Safety',
      });
    }
    if (vhf?.startLines) {
      vhf.startLines.forEach((sl) => {
        channels.push({
          channel: sl.channel,
          purpose: sl.lineName,
        });
      });
    }
    if (vhf?.other) {
      channels.forEach((o) => {
        channels.push({
          channel: o.channel,
          purpose: o.purpose,
        });
      });
    }

    return channels;
  };

  const vhfChannels = getAllVHFChannels();
  const hasVHF = vhfChannels.length > 0;
  const hasMarks = extraction.marks && extraction.marks.length > 0;
  const hasContacts = extraction.emergencyContacts && extraction.emergencyContacts.length > 0;
  const hasProcedures = extraction.procedures && Object.values(extraction.procedures).some(Boolean);

  if (compact) {
    // Compact mode: just show VHF quick reference and emergency contact count
    return (
      <View className="flex-row flex-wrap gap-2">
        {hasVHF && vhfChannels.slice(0, 3).map((ch, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleCopyChannel(ch.channel)}
            className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg"
          >
            <Ionicons name="radio" size={14} color="#3b82f6" />
            <Text className="text-blue-700 font-semibold ml-1">Ch {ch.channel}</Text>
            <Text className="text-blue-500 text-xs ml-1">({ch.purpose})</Text>
          </TouchableOpacity>
        ))}
        {hasContacts && (
          <View className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg">
            <Ionicons name="call" size={14} color="#ef4444" />
            <Text className="text-red-700 font-medium ml-1">
              {extraction.emergencyContacts!.length} Emergency Contacts
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Full mode: show all sections
  return (
    <View className="gap-4">
      {/* Confidence indicator */}
      <View className="flex-row items-center gap-2">
        <View
          className={`px-2 py-1 rounded ${
            extraction.confidence >= 0.8
              ? 'bg-green-100'
              : extraction.confidence >= 0.5
              ? 'bg-yellow-100'
              : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              extraction.confidence >= 0.8
                ? 'text-green-700'
                : extraction.confidence >= 0.5
                ? 'text-yellow-700'
                : 'text-gray-600'
            }`}
          >
            {Math.round(extraction.confidence * 100)}% confidence
          </Text>
        </View>
        {extraction.extractedSections.length > 0 && (
          <Text className="text-xs text-gray-500">
            Extracted: {extraction.extractedSections.join(', ')}
          </Text>
        )}
      </View>

      {/* VHF Channels Section */}
      {showSection('vhf') && hasVHF && (
        <View>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="radio" size={18} color="#3b82f6" />
            <Text className="font-semibold text-gray-900">VHF Channels</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {vhfChannels.map((ch, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleCopyChannel(ch.channel)}
                onLongPress={() => onVHFChannelPress?.({ channel: ch.channel, purpose: ch.purpose })}
                className="bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-lg"
              >
                <Text className="text-blue-700 font-bold text-lg">Ch {ch.channel}</Text>
                <Text className="text-blue-500 text-xs">{ch.purpose}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs text-gray-400 mt-1 ml-1">Tap to copy</Text>
        </View>
      )}

      {/* Emergency Contacts Section */}
      {showSection('contacts') && hasContacts && (
        <View>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="call" size={18} color="#ef4444" />
            <Text className="font-semibold text-gray-900">Emergency Contacts</Text>
          </View>
          <View className="gap-2">
            {extraction.emergencyContacts!.map((contact, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => contact.phone && handleCallPhone(contact.phone)}
                className="flex-row items-center justify-between bg-red-50 border border-red-100 px-4 py-3 rounded-lg"
              >
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{contact.name}</Text>
                  <Text className="text-xs text-gray-500">{contact.role}</Text>
                </View>
                <View className="flex-row items-center gap-3">
                  {contact.vhfChannel && (
                    <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded">
                      <Ionicons name="radio" size={12} color="#3b82f6" />
                      <Text className="text-blue-700 text-xs font-medium ml-1">
                        Ch {contact.vhfChannel}
                      </Text>
                    </View>
                  )}
                  {contact.phone && (
                    <View className="flex-row items-center bg-green-100 px-2 py-1 rounded">
                      <Ionicons name="call" size={12} color="#22c55e" />
                      <Text className="text-green-700 text-xs font-medium ml-1">
                        {contact.phone}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Course Marks Section */}
      {showSection('marks') && hasMarks && (
        <View>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="flag" size={18} color="#f97316" />
            <Text className="font-semibold text-gray-900">
              Course Marks ({extraction.marks!.length})
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {extraction.marks!.slice(0, 8).map((mark, i) => (
              <View
                key={i}
                className="bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg"
              >
                <Text className="font-medium text-gray-900">{mark.name}</Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <Text className="text-xs text-orange-600 capitalize">
                    {mark.type}
                  </Text>
                  {mark.rounding && (
                    <Text className="text-xs text-gray-400">
                      - {mark.rounding === 'port' ? 'P' : mark.rounding === 'starboard' ? 'S' : '-'}
                    </Text>
                  )}
                </View>
                {mark.position && (
                  <Text className="text-xs text-gray-400 font-mono mt-1">
                    {mark.position.lat.toFixed(4)}, {mark.position.lng.toFixed(4)}
                  </Text>
                )}
              </View>
            ))}
            {extraction.marks!.length > 8 && (
              <View className="bg-gray-100 px-3 py-2 rounded-lg justify-center">
                <Text className="text-gray-500 text-sm">
                  +{extraction.marks!.length - 8} more
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Procedures Section */}
      {showSection('procedures') && hasProcedures && (
        <View>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="list" size={18} color="#8b5cf6" />
            <Text className="font-semibold text-gray-900">Procedures</Text>
          </View>
          <View className="bg-purple-50 border border-purple-100 rounded-lg p-3 gap-2">
            {extraction.procedures!.startSequence && (
              <View className="flex-row">
                <Text className="text-purple-700 font-medium w-24">Start:</Text>
                <Text className="text-gray-700 flex-1">
                  {extraction.procedures!.startSequence}
                </Text>
              </View>
            )}
            {extraction.procedures!.penaltySystem && (
              <View className="flex-row">
                <Text className="text-purple-700 font-medium w-24">Penalty:</Text>
                <Text className="text-gray-700 flex-1">
                  {extraction.procedures!.penaltySystem}
                </Text>
              </View>
            )}
            {extraction.procedures!.signOnRequirements && (
              <View className="flex-row">
                <Text className="text-purple-700 font-medium w-24">Sign-on:</Text>
                <Text className="text-gray-700 flex-1">
                  {extraction.procedures!.signOnRequirements}
                </Text>
              </View>
            )}
            {extraction.procedures!.timeLimit && (
              <View className="flex-row">
                <Text className="text-purple-700 font-medium w-24">Time limit:</Text>
                <Text className="text-gray-700 flex-1">
                  {extraction.procedures!.timeLimit}
                </Text>
              </View>
            )}
            {extraction.procedures!.protestDeadline && (
              <View className="flex-row">
                <Text className="text-purple-700 font-medium w-24">Protest:</Text>
                <Text className="text-gray-700 flex-1">
                  {extraction.procedures!.protestDeadline}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Racing Area Section */}
      {extraction.racingArea?.name && (
        <View>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="map" size={18} color="#06b6d4" />
            <Text className="font-semibold text-gray-900">Racing Area</Text>
          </View>
          <View className="bg-cyan-50 border border-cyan-100 rounded-lg p-3">
            <Text className="font-medium text-gray-900">
              {extraction.racingArea.name}
            </Text>
            {extraction.racingArea.description && (
              <Text className="text-sm text-gray-600 mt-1">
                {extraction.racingArea.description}
              </Text>
            )}
            {extraction.racingArea.prohibitedZones && extraction.racingArea.prohibitedZones.length > 0 && (
              <View className="mt-2 pt-2 border-t border-cyan-200">
                <Text className="text-xs font-medium text-red-600 uppercase">
                  Prohibited Zones:
                </Text>
                {extraction.racingArea.prohibitedZones.map((zone, i) => (
                  <Text key={i} className="text-sm text-gray-700">
                    - {zone.name}: {zone.reason}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Compact VHF Quick Reference Component
 * For embedding in race cards or headers
 */
export function VHFQuickReference({ extraction }: { extraction: SSIExtraction }) {
  const vhf = extraction.vhfChannels;
  if (!vhf) return null;

  const channels: { ch: string; label: string }[] = [];
  if (vhf.raceCommittee) channels.push({ ch: vhf.raceCommittee.channel, label: 'RC' });
  if (vhf.safety) channels.push({ ch: vhf.safety.channel, label: 'Safety' });
  if (vhf.startLines?.[0]) channels.push({ ch: vhf.startLines[0].channel, label: 'Start' });

  if (channels.length === 0) return null;

  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="radio" size={12} color="#6b7280" />
      {channels.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Text className="text-gray-300">|</Text>}
          <Text className="text-xs text-gray-600">
            <Text className="font-semibold">{c.ch}</Text>{' '}
            <Text className="text-gray-400">({c.label})</Text>
          </Text>
        </React.Fragment>
      ))}
    </View>
  );
}
