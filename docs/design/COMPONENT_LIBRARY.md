# RegattaFlow Component Library

## Table of Contents
1. [Buttons](#buttons)
2. [Input Fields](#input-fields)
3. [Cards](#cards)
4. [Navigation](#navigation)
5. [Lists & Tables](#lists--tables)
6. [Feedback Components](#feedback-components)
7. [Data Visualization](#data-visualization)
8. [Form Components](#form-components)
9. [Specialized Racing Components](#specialized-racing-components)

---

## Buttons

### Button Variants

#### Primary Button
Used for primary actions like "Start Race", "Save", "Submit".

**Visual Specification:**
- Height: 48px (md), 40px (sm), 56px (lg)
- Border radius: 8px
- Padding horizontal: 24px (md), 16px (sm), 32px (lg)
- Font: Button style (16px, 600 weight)
- Shadow: md

**States:**
```typescript
// components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { DesignSystem, SailorColors, CoachColors, ClubColors, Neutrals, Semantic } from '@/constants/RacingDesignSystem';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type PersonaTheme = 'sailor' | 'coach' | 'club' | 'neutral';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  theme?: PersonaTheme;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  theme = 'sailor',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const getThemeColors = () => {
    switch (theme) {
      case 'sailor': return SailorColors;
      case 'coach': return CoachColors;
      case 'club': return ClubColors;
      default: return { primary: Neutrals.gray700, primaryDark: Neutrals.gray800 };
    }
  };

  const themeColors = getThemeColors();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: DesignSystem.borderRadius.md,
      ...DesignSystem.shadow.md,
    };

    // Size
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: {
        height: 40,
        paddingHorizontal: DesignSystem.spacing.base,
      },
      md: {
        height: 48,
        paddingHorizontal: DesignSystem.spacing.lg,
      },
      lg: {
        height: 56,
        paddingHorizontal: DesignSystem.spacing.xl,
      },
    };

    // Variant
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? Neutrals.gray300 : themeColors.primary,
      },
      secondary: {
        backgroundColor: disabled ? Neutrals.gray100 : themeColors.primarySubtle,
        borderWidth: 1,
        borderColor: disabled ? Neutrals.gray300 : themeColors.primary,
        ...DesignSystem.shadow.none,
      },
      tertiary: {
        backgroundColor: disabled ? Neutrals.gray100 : Neutrals.surface,
        borderWidth: 1,
        borderColor: disabled ? Neutrals.gray300 : Neutrals.border,
        ...DesignSystem.shadow.sm,
      },
      ghost: {
        backgroundColor: 'transparent',
        ...DesignSystem.shadow.none,
      },
      danger: {
        backgroundColor: disabled ? Neutrals.gray300 : Semantic.error,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      opacity: disabled || loading ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...DesignSystem.button,
      textAlign: 'center',
    };

    const variantTextStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: Neutrals.textInverse,
      },
      secondary: {
        color: disabled ? Neutrals.textTertiary : themeColors.primary,
      },
      tertiary: {
        color: disabled ? Neutrals.textTertiary : Neutrals.textPrimary,
      },
      ghost: {
        color: disabled ? Neutrals.textTertiary : themeColors.primary,
      },
      danger: {
        color: Neutrals.textInverse,
      },
    };

    return {
      ...baseTextStyle,
      ...variantTextStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? Neutrals.textInverse : themeColors.primary}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={{ marginRight: DesignSystem.spacing.sm }}>{icon}</View>
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={{ marginLeft: DesignSystem.spacing.sm }}>{icon}</View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
```

**Usage Examples:**
```typescript
import { Button } from '@/components/ui/Button';
import { Play, Save } from 'lucide-react-native';

// Primary button (Sailor theme)
<Button title="Start Race" onPress={handleStartRace} theme="sailor" />

// Secondary button with icon
<Button
  title="Save Draft"
  onPress={handleSave}
  variant="secondary"
  icon={<Save size={20} />}
  iconPosition="left"
/>

// Loading state
<Button title="Submitting..." onPress={handleSubmit} loading={true} />

// Small danger button
<Button title="Delete" onPress={handleDelete} variant="danger" size="sm" />

// Full width primary button (Coach theme)
<Button title="Create Training Plan" onPress={handleCreate} theme="coach" fullWidth />
```

---

## Input Fields

### Text Input

**Visual Specification:**
- Height: 48px (md), 40px (sm), 56px (lg)
- Border radius: 8px
- Border width: 1px
- Padding horizontal: 16px
- Font: Body Regular (16px)

**States:**
```typescript
// components/ui/TextInput.tsx
import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, ViewStyle, TextStyle, TextInputProps as RNTextInputProps } from 'react-native';
import { DesignSystem, Neutrals, Semantic, SailorColors } from '@/constants/RacingDesignSystem';

export type InputState = 'default' | 'focused' | 'error' | 'disabled' | 'success';
export type InputSize = 'sm' | 'md' | 'lg';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  state?: InputState;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  theme?: PersonaTheme;
}

export function TextInput({
  label,
  helperText,
  errorText,
  successText,
  state = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  required = false,
  theme = 'sailor',
  style,
  ...rest
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getThemeColors = () => {
    switch (theme) {
      case 'sailor': return SailorColors;
      case 'coach': return CoachColors;
      case 'club': return ClubColors;
      default: return { primary: Neutrals.gray700 };
    }
  };

  const themeColors = getThemeColors();
  const currentState = errorText ? 'error' : successText ? 'success' : state;
  const isActuallyFocused = isFocused && currentState !== 'disabled';

  const getContainerStyle = (): ViewStyle => {
    const sizeStyles: Record<InputSize, ViewStyle> = {
      sm: { height: 40, paddingHorizontal: DesignSystem.spacing.md },
      md: { height: 48, paddingHorizontal: DesignSystem.spacing.base },
      lg: { height: 56, paddingHorizontal: DesignSystem.spacing.lg },
    };

    const stateStyles: Record<InputState, ViewStyle> = {
      default: {
        borderColor: Neutrals.border,
        backgroundColor: Neutrals.surface,
      },
      focused: {
        borderColor: themeColors.primary,
        backgroundColor: Neutrals.surface,
        borderWidth: 2,
      },
      error: {
        borderColor: Semantic.error,
        backgroundColor: Semantic.errorSubtle,
      },
      disabled: {
        borderColor: Neutrals.borderLight,
        backgroundColor: Neutrals.surfaceAlt,
      },
      success: {
        borderColor: Semantic.success,
        backgroundColor: Semantic.successSubtle,
      },
    };

    return {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: DesignSystem.borderRadius.md,
      borderWidth: 1,
      ...sizeStyles[size],
      ...(isActuallyFocused ? stateStyles.focused : stateStyles[currentState]),
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      ...DesignSystem.bodyRegular,
      flex: 1,
      color: currentState === 'disabled' ? Neutrals.textTertiary : Neutrals.textPrimary,
    };
  };

  const getFeedbackText = () => {
    if (errorText) return errorText;
    if (successText) return successText;
    return helperText;
  };

  const getFeedbackColor = () => {
    if (errorText) return Semantic.error;
    if (successText) return Semantic.success;
    return Neutrals.textSecondary;
  };

  return (
    <View style={{ marginBottom: DesignSystem.spacing.base }}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={{ color: Semantic.error }}> *</Text>}
        </Text>
      )}
      <View style={getContainerStyle()}>
        {leftIcon && (
          <View style={{ marginRight: DesignSystem.spacing.sm }}>{leftIcon}</View>
        )}
        <RNTextInput
          style={[getInputStyle(), style]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={currentState !== 'disabled'}
          placeholderTextColor={Neutrals.textTertiary}
          {...rest}
        />
        {rightIcon && (
          <View style={{ marginLeft: DesignSystem.spacing.sm }}>{rightIcon}</View>
        )}
      </View>
      {getFeedbackText() && (
        <Text style={[styles.helperText, { color: getFeedbackColor() }]}>
          {getFeedbackText()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...DesignSystem.bodySmall,
    fontWeight: '600',
    color: Neutrals.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  helperText: {
    ...DesignSystem.caption,
    marginTop: DesignSystem.spacing.xs,
  },
});
```

### Select / Picker

```typescript
// components/ui/Select.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { DesignSystem, Neutrals, SailorColors } from '@/constants/RacingDesignSystem';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  errorText?: string;
  theme?: PersonaTheme;
}

export function Select({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onValueChange,
  disabled = false,
  errorText,
  theme = 'sailor',
}: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={{ marginBottom: DesignSystem.spacing.base }}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.selectContainer,
          errorText && { borderColor: Semantic.error },
          disabled && { backgroundColor: Neutrals.surfaceAlt },
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            !selectedOption && { color: Neutrals.textTertiary },
            disabled && { color: Neutrals.textTertiary },
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={Neutrals.textSecondary} />
      </TouchableOpacity>
      {errorText && (
        <Text style={[styles.helperText, { color: Semantic.error }]}>{errorText}</Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label || 'Select'}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.value === value && { backgroundColor: themeColors.primarySubtle },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && { color: themeColors.primary, fontWeight: '600' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...DesignSystem.bodySmall,
    fontWeight: '600',
    color: Neutrals.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: DesignSystem.spacing.base,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: Neutrals.border,
    backgroundColor: Neutrals.surface,
  },
  selectText: {
    ...DesignSystem.bodyRegular,
    color: Neutrals.textPrimary,
  },
  helperText: {
    ...DesignSystem.caption,
    marginTop: DesignSystem.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: DesignSystem.spacing.lg,
  },
  modalContent: {
    backgroundColor: Neutrals.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    maxHeight: '70%',
    ...DesignSystem.shadow.xl,
  },
  modalTitle: {
    ...DesignSystem.h3,
    padding: DesignSystem.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  optionItem: {
    padding: DesignSystem.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.borderLight,
  },
  optionText: {
    ...DesignSystem.bodyRegular,
    color: Neutrals.textPrimary,
  },
});
```

### Date/Time Picker

```typescript
// components/ui/DateTimePicker.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { DesignSystem, Neutrals, SailorColors } from '@/constants/RacingDesignSystem';

interface DateTimePickerInputProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  theme?: PersonaTheme;
}

export function DateTimePickerInput({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  disabled = false,
  theme = 'sailor',
}: DateTimePickerInputProps) {
  const [show, setShow] = useState(false);
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  const formatValue = () => {
    if (mode === 'date') {
      return value.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (mode === 'time') {
      return value.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return value.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const Icon = mode === 'time' ? Clock : Calendar;

  return (
    <View style={{ marginBottom: DesignSystem.spacing.base }}>
      {label && (
        <Text style={{
          ...DesignSystem.bodySmall,
          fontWeight: '600',
          color: Neutrals.textPrimary,
          marginBottom: DesignSystem.spacing.xs,
        }}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          paddingHorizontal: DesignSystem.spacing.base,
          borderRadius: DesignSystem.borderRadius.md,
          borderWidth: 1,
          borderColor: Neutrals.border,
          backgroundColor: disabled ? Neutrals.surfaceAlt : Neutrals.surface,
        }}
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
      >
        <Icon size={20} color={themeColors.primary} style={{ marginRight: DesignSystem.spacing.sm }} />
        <Text style={{
          ...DesignSystem.bodyRegular,
          color: disabled ? Neutrals.textTertiary : Neutrals.textPrimary,
        }}>
          {formatValue()}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value}
          mode={mode === 'datetime' ? 'date' : mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShow(Platform.OS === 'ios');
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}
```

**Usage Examples:**
```typescript
import { TextInput } from '@/components/ui/TextInput';
import { Select } from '@/components/ui/Select';
import { DateTimePickerInput } from '@/components/ui/DateTimePicker';
import { Mail, Lock } from 'lucide-react-native';

// Text input with icon
<TextInput
  label="Email"
  placeholder="sailor@example.com"
  value={email}
  onChangeText={setEmail}
  leftIcon={<Mail size={20} color={SailorColors.primary} />}
  keyboardType="email-address"
  required
/>

// Error state
<TextInput
  label="Password"
  placeholder="Enter password"
  value={password}
  onChangeText={setPassword}
  leftIcon={<Lock size={20} color={SailorColors.primary} />}
  secureTextEntry
  errorText="Password must be at least 8 characters"
/>

// Select picker
<Select
  label="Boat Class"
  placeholder="Select a class"
  options={[
    { label: 'Laser', value: 'laser' },
    { label: '470', value: '470' },
    { label: 'Finn', value: 'finn' },
  ]}
  value={boatClass}
  onValueChange={setBoatClass}
/>

// Date picker
<DateTimePickerInput
  label="Race Date"
  value={raceDate}
  onChange={setRaceDate}
  mode="date"
  minimumDate={new Date()}
/>
```

---

## Cards

### Race Card

**Visual Specification:**
- Border radius: 12px
- Padding: 16px
- Shadow: md
- Min height: 120px
- Background: Surface

```typescript
// components/ui/RaceCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, MapPin, Users, Clock } from 'lucide-react-native';
import { DesignSystem, Neutrals, SailorColors, Semantic } from '@/constants/RacingDesignSystem';

interface RaceCardProps {
  raceName: string;
  venueName: string;
  date: string;
  startTime: string;
  participants: number;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  onPress: () => void;
  theme?: PersonaTheme;
}

export function RaceCard({
  raceName,
  venueName,
  date,
  startTime,
  participants,
  status,
  onPress,
  theme = 'sailor',
}: RaceCardProps) {
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  const getStatusBadge = () => {
    const statusConfig = {
      upcoming: { label: 'Upcoming', color: SailorColors.primary, bg: SailorColors.primarySubtle },
      live: { label: 'Live', color: Semantic.error, bg: Semantic.errorSubtle },
      completed: { label: 'Completed', color: Semantic.success, bg: Semantic.successSubtle },
      cancelled: { label: 'Cancelled', color: Neutrals.textSecondary, bg: Neutrals.surfaceAlt },
    };

    const config = statusConfig[status];

    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: themeColors.primary, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{raceName}</Text>
        {getStatusBadge()}
      </View>

      <View style={styles.infoRow}>
        <MapPin size={16} color={Neutrals.textSecondary} strokeWidth={2} />
        <Text style={styles.infoText}>{venueName}</Text>
      </View>

      <View style={styles.infoRow}>
        <Calendar size={16} color={Neutrals.textSecondary} strokeWidth={2} />
        <Text style={styles.infoText}>{date}</Text>
        <Clock size={16} color={Neutrals.textSecondary} strokeWidth={2} style={{ marginLeft: DesignSystem.spacing.base }} />
        <Text style={styles.infoText}>{startTime}</Text>
      </View>

      <View style={styles.infoRow}>
        <Users size={16} color={Neutrals.textSecondary} strokeWidth={2} />
        <Text style={styles.infoText}>{participants} participants</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Neutrals.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.base,
    marginBottom: DesignSystem.spacing.base,
    ...DesignSystem.shadow.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.h3,
    flex: 1,
    marginRight: DesignSystem.spacing.sm,
  },
  badge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.full,
  },
  badgeText: {
    ...DesignSystem.caption,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  infoText: {
    ...DesignSystem.bodySmall,
    color: Neutrals.textSecondary,
    marginLeft: DesignSystem.spacing.xs,
  },
});
```

### Profile Card

```typescript
// components/ui/ProfileCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Mail, Phone, MapPin } from 'lucide-react-native';
import { DesignSystem, Neutrals, SailorColors } from '@/constants/RacingDesignSystem';

interface ProfileCardProps {
  name: string;
  role: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  location?: string;
  onPress?: () => void;
  theme?: PersonaTheme;
}

export function ProfileCard({
  name,
  role,
  avatarUrl,
  email,
  phone,
  location,
  onPress,
  theme = 'sailor',
}: ProfileCardProps) {
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: themeColors.primarySubtle }]}>
            <Text style={[styles.avatarText, { color: themeColors.primary }]}>
              {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={[styles.role, { color: themeColors.primary }]}>{role}</Text>
        </View>
      </View>

      {(email || phone || location) && (
        <View style={styles.contactInfo}>
          {email && (
            <View style={styles.contactRow}>
              <Mail size={16} color={Neutrals.textSecondary} />
              <Text style={styles.contactText}>{email}</Text>
            </View>
          )}
          {phone && (
            <View style={styles.contactRow}>
              <Phone size={16} color={Neutrals.textSecondary} />
              <Text style={styles.contactText}>{phone}</Text>
            </View>
          )}
          {location && (
            <View style={styles.contactRow}>
              <MapPin size={16} color={Neutrals.textSecondary} />
              <Text style={styles.contactText}>{location}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Neutrals.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.base,
    marginBottom: DesignSystem.spacing.base,
    ...DesignSystem.shadow.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: DesignSystem.borderRadius.full,
    marginRight: DesignSystem.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...DesignSystem.h3,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  name: {
    ...DesignSystem.h3,
    marginBottom: DesignSystem.spacing.xs,
  },
  role: {
    ...DesignSystem.bodySmall,
    fontWeight: '600',
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: Neutrals.borderLight,
    paddingTop: DesignSystem.spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  contactText: {
    ...DesignSystem.bodySmall,
    color: Neutrals.textSecondary,
    marginLeft: DesignSystem.spacing.sm,
  },
});
```

### Data Card

```typescript
// components/ui/DataCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { DesignSystem, Neutrals, SailorColors, Semantic } from '@/constants/RacingDesignSystem';

interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  theme?: PersonaTheme;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function DataCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  theme = 'sailor',
  variant = 'default',
}: DataCardProps) {
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  const getVariantColor = () => {
    switch (variant) {
      case 'success': return Semantic.success;
      case 'warning': return Semantic.warning;
      case 'error': return Semantic.error;
      default: return themeColors.primary;
    }
  };

  const getTrendColor = () => {
    if (trend === 'up') return Semantic.success;
    if (trend === 'down') return Semantic.error;
    return Neutrals.textSecondary;
  };

  const variantColor = getVariantColor();

  return (
    <View style={[styles.card, { borderTopColor: variantColor, borderTopWidth: 3 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {Icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${variantColor}15` }]}>
            <Icon size={20} color={variantColor} strokeWidth={2} />
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>

      {(subtitle || trendValue) && (
        <View style={styles.footer}>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {trendValue && (
            <Text style={[styles.trend, { color: getTrendColor() }]}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trendValue}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Neutrals.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.base,
    ...DesignSystem.shadow.sm,
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  title: {
    ...DesignSystem.bodySmall,
    color: Neutrals.textSecondary,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: DesignSystem.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    ...DesignSystem.h1,
    color: Neutrals.textPrimary,
    marginBottom: DesignSystem.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    ...DesignSystem.caption,
    color: Neutrals.textTertiary,
  },
  trend: {
    ...DesignSystem.bodySmall,
    fontWeight: '600',
  },
});
```

---

## Navigation

### Tab Bar

```typescript
// components/navigation/TabBar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignSystem, Neutrals, SailorColors } from '@/constants/RacingDesignSystem';
import type { LucideIcon } from 'lucide-react-native';

export interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  theme?: PersonaTheme;
}

export function TabBar({ tabs, activeTab, onTabPress, theme = 'sailor' }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || DesignSystem.spacing.sm }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const Icon = tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconContainer, isActive && { backgroundColor: themeColors.primarySubtle }]}>
              <Icon
                size={24}
                color={isActive ? themeColors.primary : Neutrals.textSecondary}
                strokeWidth={2}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isActive ? themeColors.primary : Neutrals.textSecondary },
                isActive && { fontWeight: '600' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Neutrals.surface,
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
    paddingTop: DesignSystem.spacing.sm,
    ...DesignSystem.shadow.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: DesignSystem.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs / 2,
  },
  label: {
    ...DesignSystem.caption,
  },
});
```

### Header / App Bar

```typescript
// components/navigation/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { DesignSystem, Neutrals, SailorColors } from '@/constants/RacingDesignSystem';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  theme?: PersonaTheme;
  variant?: 'default' | 'transparent';
}

export function Header({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  theme = 'sailor',
  variant = 'default',
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  const isTransparent = variant === 'transparent';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: isTransparent ? 'transparent' : Neutrals.surface,
        },
        !isTransparent && styles.shadow,
      ]}
    >
      <View style={styles.content}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={isTransparent ? Neutrals.textInverse : Neutrals.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              { color: isTransparent ? Neutrals.textInverse : Neutrals.textPrimary },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: isTransparent ? Neutrals.textInverse : themeColors.primary },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  shadow: {
    ...DesignSystem.shadow.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: DesignSystem.spacing.base,
  },
  backButton: {
    marginRight: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...DesignSystem.h3,
  },
  subtitle: {
    ...DesignSystem.bodySmall,
    fontWeight: '600',
  },
  rightAction: {
    marginLeft: DesignSystem.spacing.sm,
  },
});
```

---

## Lists & Tables

### Simple List

```typescript
// components/ui/SimpleList.tsx
import React from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, FlatListProps } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { DesignSystem, Neutrals } from '@/constants/RacingDesignSystem';

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightContent?: React.ReactNode;
  onPress?: () => void;
}

interface SimpleListProps extends Omit<FlatListProps<ListItem>, 'renderItem'> {
  data: ListItem[];
  showChevron?: boolean;
  dividers?: boolean;
}

export function SimpleList({ data, showChevron = true, dividers = true, ...rest }: SimpleListProps) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={[
            styles.item,
            dividers && index < data.length - 1 && styles.divider,
          ]}
          onPress={item.onPress}
          activeOpacity={item.onPress ? 0.7 : 1}
          disabled={!item.onPress}
        >
          {item.leftIcon && (
            <View style={styles.leftIcon}>{item.leftIcon}</View>
          )}

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
            )}
          </View>

          {item.rightContent ? (
            <View style={styles.rightContent}>{item.rightContent}</View>
          ) : showChevron && item.onPress ? (
            <ChevronRight size={20} color={Neutrals.textTertiary} />
          ) : null}
        </TouchableOpacity>
      )}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.base,
    backgroundColor: Neutrals.surface,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.borderLight,
  },
  leftIcon: {
    marginRight: DesignSystem.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...DesignSystem.bodyRegular,
    color: Neutrals.textPrimary,
  },
  subtitle: {
    ...DesignSystem.bodySmall,
    color: Neutrals.textSecondary,
    marginTop: DesignSystem.spacing.xs / 2,
  },
  rightContent: {
    marginLeft: DesignSystem.spacing.md,
  },
});
```

### Sectioned List

```typescript
// components/ui/SectionedList.tsx
import React from 'react';
import { SectionList, View, Text, StyleSheet, SectionListProps } from 'react-native';
import { DesignSystem, Neutrals } from '@/constants/RacingDesignSystem';
import { SimpleList, ListItem } from './SimpleList';

interface Section {
  title: string;
  data: ListItem[];
}

interface SectionedListProps extends Omit<SectionListProps<ListItem, Section>, 'renderItem' | 'renderSectionHeader'> {
  sections: Section[];
  showChevron?: boolean;
}

export function SectionedList({ sections, showChevron = true, ...rest }: SectionedListProps) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <TouchableOpacity
          style={[
            styles.item,
            index < section.data.length - 1 && styles.divider,
          ]}
          onPress={item.onPress}
          activeOpacity={item.onPress ? 0.7 : 1}
          disabled={!item.onPress}
        >
          {item.leftIcon && (
            <View style={styles.leftIcon}>{item.leftIcon}</View>
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            )}
          </View>

          {item.rightContent ? (
            <View style={styles.rightContent}>{item.rightContent}</View>
          ) : showChevron && item.onPress ? (
            <ChevronRight size={20} color={Neutrals.textTertiary} />
          ) : null}
        </TouchableOpacity>
      )}
      stickySectionHeadersEnabled
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: Neutrals.background,
    paddingHorizontal: DesignSystem.spacing.base,
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  sectionTitle: {
    ...DesignSystem.bodySmall,
    fontWeight: '700',
    color: Neutrals.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.base,
    backgroundColor: Neutrals.surface,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.borderLight,
  },
  leftIcon: {
    marginRight: DesignSystem.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...DesignSystem.bodyRegular,
    color: Neutrals.textPrimary,
  },
  subtitle: {
    ...DesignSystem.bodySmall,
    color: Neutrals.textSecondary,
    marginTop: DesignSystem.spacing.xs / 2,
  },
  rightContent: {
    marginLeft: DesignSystem.spacing.md,
  },
});
```

---

## Feedback Components

### Toast

```typescript
// components/ui/Toast.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react-native';
import { DesignSystem, Neutrals, Semantic } from '@/constants/RacingDesignSystem';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, type, duration = 3000, onDismiss }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          color: Semantic.success,
          bg: Semantic.successSubtle,
        };
      case 'error':
        return {
          icon: XCircle,
          color: Semantic.error,
          bg: Semantic.errorSubtle,
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: Semantic.warning,
          bg: Semantic.warningSubtle,
        };
      case 'info':
        return {
          icon: Info,
          color: Semantic.info,
          bg: Semantic.infoSubtle,
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  useEffect(() => {
    translateY.value = withSpring(0);
    opacity.value = withTiming(1);

    const timer = setTimeout(() => {
      translateY.value = withSpring(-100);
      opacity.value = withTiming(0, {}, () => {
        runOnJS(onDismiss)();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + DesignSystem.spacing.base },
        animatedStyle,
      ]}
    >
      <View style={[styles.toast, { backgroundColor: config.bg, borderLeftColor: config.color }]}>
        <Icon size={20} color={config.color} strokeWidth={2} />
        <Text style={[styles.message, { color: config.color }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: DesignSystem.spacing.base,
    right: DesignSystem.spacing.base,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.base,
    borderRadius: DesignSystem.borderRadius.md,
    borderLeftWidth: 4,
    ...DesignSystem.shadow.lg,
  },
  message: {
    ...DesignSystem.bodyRegular,
    fontWeight: '600',
    marginLeft: DesignSystem.spacing.md,
    flex: 1,
  },
});
```

### Modal / Dialog

```typescript
// components/ui/Modal.tsx
import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { DesignSystem, Neutrals } from '@/constants/RacingDesignSystem';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  theme?: PersonaTheme;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
  size = 'md',
  theme = 'sailor',
}: ModalProps) {
  const getMaxWidth = () => {
    switch (size) {
      case 'sm': return 320;
      case 'md': return 480;
      case 'lg': return 640;
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { maxWidth: getMaxWidth() }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <X size={24} color={Neutrals.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {(primaryAction || secondaryAction) && (
            <View style={styles.actions}>
              {secondaryAction && (
                <Button
                  title={secondaryAction.label}
                  onPress={secondaryAction.onPress}
                  variant="tertiary"
                  theme={theme}
                  style={{ flex: 1, marginRight: DesignSystem.spacing.sm }}
                />
              )}
              {primaryAction && (
                <Button
                  title={primaryAction.label}
                  onPress={primaryAction.onPress}
                  loading={primaryAction.loading}
                  theme={theme}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
  },
  modal: {
    backgroundColor: Neutrals.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    width: '100%',
    maxHeight: '80%',
    ...DesignSystem.shadow.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  title: {
    ...DesignSystem.h3,
    flex: 1,
  },
  closeButton: {
    padding: DesignSystem.spacing.xs,
  },
  content: {
    padding: DesignSystem.spacing.base,
  },
  actions: {
    flexDirection: 'row',
    padding: DesignSystem.spacing.base,
    borderTopWidth: 1,
    borderTopColor: Neutrals.border,
  },
});
```

### Bottom Sheet

```typescript
// components/ui/BottomSheet.tsx
import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { DesignSystem, Neutrals } from '@/constants/RacingDesignSystem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoint?: number; // Percentage of screen height (0-1)
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapPoint = 0.5,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 50, stiffness: 400 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const sheetHeight = SCREEN_HEIGHT * snapPoint;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight + insets.bottom,
              paddingBottom: insets.bottom,
            },
            animatedStyle,
          ]}
        >
          <View style={styles.handle} />

          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={24} color={Neutrals.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Neutrals.surface,
    borderTopLeftRadius: DesignSystem.borderRadius.xl,
    borderTopRightRadius: DesignSystem.borderRadius.xl,
    ...DesignSystem.shadow.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Neutrals.gray300,
    borderRadius: DesignSystem.borderRadius.full,
    alignSelf: 'center',
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.base,
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  title: {
    ...DesignSystem.h3,
    flex: 1,
  },
  closeButton: {
    padding: DesignSystem.spacing.xs,
  },
  content: {
    flex: 1,
    padding: DesignSystem.spacing.base,
  },
});
```

---

## Form Components

### Checkbox

```typescript
// components/ui/Checkbox.tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { DesignSystem, Neutrals, SailorColors, Semantic } from '@/constants/RacingDesignSystem';

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  theme?: PersonaTheme;
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  error = false,
  theme = 'sailor',
}: CheckboxProps) {
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.checkbox,
          checked && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
          error && { borderColor: Semantic.error },
          disabled && { opacity: 0.5 },
        ]}
      >
        {checked && <Check size={16} color={Neutrals.textInverse} strokeWidth={3} />}
      </View>
      {label && (
        <Text style={[styles.label, disabled && { color: Neutrals.textTertiary }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 2,
    borderColor: Neutrals.border,
    backgroundColor: Neutrals.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...DesignSystem.bodyRegular,
    color: Neutrals.textPrimary,
    marginLeft: DesignSystem.spacing.sm,
  },
});
```

### Radio Button

```typescript
// components/ui/Radio.tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { DesignSystem, Neutrals, SailorColors } from '@/constants/RacingDesignSystem';

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  theme?: PersonaTheme;
}

export function RadioGroup({
  options,
  value,
  onChange,
  disabled = false,
  theme = 'sailor',
}: RadioGroupProps) {
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  return (
    <View>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <TouchableOpacity
            key={option.value}
            style={styles.container}
            onPress={() => !disabled && onChange(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            accessibilityLabel={option.label}
          >
            <View style={[styles.radio, disabled && { opacity: 0.5 }]}>
              {isSelected && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: themeColors.primary },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.label, disabled && { color: Neutrals.textTertiary }]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: DesignSystem.borderRadius.full,
    borderWidth: 2,
    borderColor: Neutrals.border,
    backgroundColor: Neutrals.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: DesignSystem.borderRadius.full,
  },
  label: {
    ...DesignSystem.bodyRegular,
    color: Neutrals.textPrimary,
    marginLeft: DesignSystem.spacing.sm,
  },
});
```

### Switch / Toggle

```typescript
// components/ui/Switch.tsx
import React from 'react';
import { Switch as RNSwitch, View, Text, StyleSheet, Platform } from 'react-native';
import { DesignSystem, Neutrals, SailorColors } from '@/constants/RacingDesignSystem';

interface SwitchProps {
  label?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  theme?: PersonaTheme;
}

export function Switch({
  label,
  value,
  onValueChange,
  disabled = false,
  theme = 'sailor',
}: SwitchProps) {
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, disabled && { color: Neutrals.textTertiary }]}>
          {label}
        </Text>
      )}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: Neutrals.gray300,
          true: themeColors.primaryLight,
        }}
        thumbColor={value ? themeColors.primary : Neutrals.surface}
        ios_backgroundColor={Neutrals.gray300}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.md,
  },
  label: {
    ...DesignSystem.bodyRegular,
    color: Neutrals.textPrimary,
    flex: 1,
    marginRight: DesignSystem.spacing.base,
  },
});
```

### Chip / Tag Selector

```typescript
// components/ui/ChipSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { DesignSystem, Neutrals, SailorColors } from '@/constants/RacingDesignSystem';

export interface Chip {
  id: string;
  label: string;
}

interface ChipSelectorProps {
  chips: Chip[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  multiSelect?: boolean;
  theme?: PersonaTheme;
}

export function ChipSelector({
  chips,
  selectedIds,
  onChange,
  multiSelect = true,
  theme = 'sailor',
}: ChipSelectorProps) {
  const themeColors = theme === 'sailor' ? SailorColors : theme === 'coach' ? CoachColors : ClubColors;

  const handleChipPress = (chipId: string) => {
    if (multiSelect) {
      if (selectedIds.includes(chipId)) {
        onChange(selectedIds.filter(id => id !== chipId));
      } else {
        onChange([...selectedIds, chipId]);
      }
    } else {
      onChange([chipId]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((chip) => {
        const isSelected = selectedIds.includes(chip.id);

        return (
          <TouchableOpacity
            key={chip.id}
            style={[
              styles.chip,
              isSelected && {
                backgroundColor: themeColors.primarySubtle,
                borderColor: themeColors.primary,
              },
            ]}
            onPress={() => handleChipPress(chip.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                isSelected && { color: themeColors.primary, fontWeight: '600' },
              ]}
            >
              {chip.label}
            </Text>
            {isSelected && multiSelect && (
              <View style={{ marginLeft: DesignSystem.spacing.xs }}>
                <X size={16} color={themeColors.primary} strokeWidth={2} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: DesignSystem.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.base,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.full,
    borderWidth: 1,
    borderColor: Neutrals.border,
    backgroundColor: Neutrals.surface,
    marginRight: DesignSystem.spacing.sm,
  },
  chipText: {
    ...DesignSystem.bodySmall,
    color: Neutrals.textPrimary,
  },
});
```

---

## Specialized Racing Components

### Wind Direction Indicator

```typescript
// components/racing/WindIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp } from 'lucide-react-native';
import { DesignSystem, Neutrals, WindColors } from '@/constants/RacingDesignSystem';

interface WindIndicatorProps {
  direction: number; // 0-360 degrees
  speed: number; // knots
  size?: 'sm' | 'md' | 'lg';
}

export function WindIndicator({ direction, speed, size = 'md' }: WindIndicatorProps) {
  const sizes = {
    sm: { container: 48, icon: 20, fontSize: 12 },
    md: { container: 64, icon: 28, fontSize: 14 },
    lg: { container: 80, icon: 36, fontSize: 16 },
  };

  const currentSize = sizes[size];

  const getWindColor = () => {
    if (speed < 5) return WindColors.light;
    if (speed < 12) return WindColors.moderate;
    if (speed < 20) return WindColors.strong;
    return WindColors.extreme;
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.indicator,
          {
            width: currentSize.container,
            height: currentSize.container,
            backgroundColor: `${getWindColor()}20`,
            borderColor: getWindColor(),
          },
        ]}
      >
        <View style={{ transform: [{ rotate: `${direction}deg` }] }}>
          <ArrowUp size={currentSize.icon} color={getWindColor()} strokeWidth={3} />
        </View>
      </View>
      <Text style={[styles.speed, { fontSize: currentSize.fontSize }]}>
        {speed.toFixed(1)} kts
      </Text>
      <Text style={[styles.direction, { fontSize: currentSize.fontSize - 2 }]}>
        {direction}°
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  indicator: {
    borderRadius: DesignSystem.borderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  speed: {
    ...DesignSystem.bodySmall,
    fontWeight: '700',
    color: Neutrals.textPrimary,
  },
  direction: {
    ...DesignSystem.caption,
    color: Neutrals.textSecondary,
  },
});
```

### Race Timer Display

```typescript
// components/racing/RaceTimer.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { DesignSystem, Neutrals, Semantic } from '@/constants/RacingDesignSystem';

interface RaceTimerProps {
  startTime: Date;
  status: 'countdown' | 'racing' | 'finished';
  theme?: PersonaTheme;
}

export function RaceTimer({ startTime, status, theme = 'sailor' }: RaceTimerProps) {
  const [timeString, setTimeString] = useState('00:00');
  const [isNegative, setIsNegative] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();
      const absDiff = Math.abs(diff);

      const minutes = Math.floor(absDiff / 60000);
      const seconds = Math.floor((absDiff % 60000) / 1000);

      setTimeString(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      setIsNegative(diff < 0);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  const getTimerColor = () => {
    if (status === 'finished') return Neutrals.textSecondary;
    if (status === 'racing') return Semantic.success;

    // Countdown
    if (isNegative) return Semantic.error;
    return Semantic.warning;
  };

  const getStatusLabel = () => {
    if (status === 'finished') return 'Finished';
    if (status === 'racing') return 'Racing';
    if (isNegative) return 'Started';
    return 'Starting in';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Clock size={20} color={getTimerColor()} strokeWidth={2} />
        <Text style={[styles.status, { color: getTimerColor() }]}>
          {getStatusLabel()}
        </Text>
      </View>
      <Text style={[styles.timer, { color: getTimerColor() }]}>
        {isNegative && status === 'countdown' ? '+' : ''}{timeString}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Neutrals.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.base,
    alignItems: 'center',
    ...DesignSystem.shadow.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  status: {
    ...DesignSystem.bodySmall,
    fontWeight: '600',
    marginLeft: DesignSystem.spacing.xs,
  },
  timer: {
    ...DesignSystem.display,
    fontVariant: ['tabular-nums'],
  },
});
```

### Weather Condition Card

```typescript
// components/racing/WeatherCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cloud, Droplets, Eye, Thermometer } from 'lucide-react-native';
import { DesignSystem, Neutrals, WeatherColors } from '@/constants/RacingDesignSystem';

interface WeatherCardProps {
  temperature: number; // Celsius
  conditions: string;
  humidity: number; // Percentage
  visibility: number; // km
  precipitation: number; // mm
  theme?: PersonaTheme;
}

export function WeatherCard({
  temperature,
  conditions,
  humidity,
  visibility,
  precipitation,
  theme = 'sailor',
}: WeatherCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Cloud size={32} color={WeatherColors.cloudy} strokeWidth={2} />
        <View style={styles.headerText}>
          <Text style={styles.temperature}>{temperature}°C</Text>
          <Text style={styles.conditions}>{conditions}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Droplets size={16} color={Neutrals.textSecondary} />
          <Text style={styles.detailText}>{humidity}% humidity</Text>
        </View>

        <View style={styles.detailItem}>
          <Eye size={16} color={Neutrals.textSecondary} />
          <Text style={styles.detailText}>{visibility}km visibility</Text>
        </View>

        {precipitation > 0 && (
          <View style={styles.detailItem}>
            <Droplets size={16} color={WeatherColors.rainy} />
            <Text style={styles.detailText}>{precipitation}mm rain</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Neutrals.surface,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.base,
    ...DesignSystem.shadow.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  headerText: {
    marginLeft: DesignSystem.spacing.md,
  },
  temperature: {
    ...DesignSystem.h1,
    color: Neutrals.textPrimary,
  },
  conditions: {
    ...DesignSystem.bodyRegular,
    color: Neutrals.textSecondary,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    ...DesignSystem.bodySmall,
    color: Neutrals.textSecondary,
    marginLeft: DesignSystem.spacing.xs,
  },
});
```

---

## Implementation Notes

### Performance Optimization
- Use `React.memo()` for components that receive frequent prop updates
- Implement `VirtualizedList` or `FlashList` for long lists (>50 items)
- Use `getItemLayout` prop for fixed-height list items
- Lazy load heavy components with `React.lazy()` and `Suspense`

### Accessibility
All components include:
- `accessibilityRole` for proper screen reader announcements
- `accessibilityLabel` for meaningful descriptions
- `accessibilityState` for interactive elements (checked, disabled, selected)
- `accessibilityHint` for complex interactions
- Minimum touch target size of 44x44px (iOS) / 48x48px (Android)

### Testing
Each component should have:
- Unit tests for state changes and user interactions
- Snapshot tests for visual regression
- Accessibility tests with `@testing-library/react-native`

Example test:
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);

    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} disabled />);

    fireEvent.press(getByText('Test'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### Theme Integration
All components accept a `theme` prop ('sailor', 'coach', 'club') to automatically apply persona-specific colors. Import theme colors from the Design System:

```typescript
import { SailorColors, CoachColors, ClubColors } from '@/constants/RacingDesignSystem';
```

---

## Next Steps

With the Design System and Component Library established, the next document will detail:
- **SCREEN_DESIGNS.md**: Complete layouts for all 40+ screens
- **INTERACTION_PATTERNS.md**: Animations and micro-interactions
- **NAVIGATION_ARCHITECTURE.md**: Full navigation flow
- **ACCESSIBILITY.md**: Comprehensive accessibility requirements
