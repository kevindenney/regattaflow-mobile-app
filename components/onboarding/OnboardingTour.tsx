/**
 * Onboarding Tour Component
 *
 * Modal-based tour with spotlight effect for first-time user onboarding.
 * Uses SVG masking to highlight target elements with a glowing cutout.
 */

import { TUFTE_FORM_COLORS } from '@/components/races/AddRaceDialog/tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    LayoutRectangle,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface TourStep {
    id: string;
    title: string;
    description: string;
    targetLayout?: LayoutRectangle | null; // The layout of the element to highlight
    position?: 'top' | 'bottom' | 'center' | 'right' | 'left'; // Where to place the tooltip relative to target
    spotlightPadding?: number; // Extra padding around the spotlight cutout
    spotlightBorderRadius?: number; // Border radius for the spotlight cutout
}

interface OnboardingTourProps {
    visible: boolean;
    steps: TourStep[];
    currentStepIndex: number;
    onNext: () => void;
    onDismiss: () => void;
    /** Optional drawer content to render inside the tour Modal (fixes iOS Modal stacking) */
    drawerContent?: React.ReactNode;
    /** Map of step IDs to layouts (for dynamic layout resolution) */
    stepLayouts?: Record<string, LayoutRectangle | null>;
}

export function OnboardingTour({
    visible,
    steps,
    currentStepIndex,
    onNext,
    onDismiss,
    drawerContent,
    stepLayouts,
}: OnboardingTourProps) {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const stepDef = steps[currentStepIndex];

    // Resolve targetLayout from stepLayouts map or use step's own layout
    const resolvedLayout = stepLayouts?.[stepDef?.id] ?? stepDef?.targetLayout;
    const step = stepDef ? { ...stepDef, targetLayout: resolvedLayout } : stepDef;

    // Animation values for smooth spotlight transitions
    const spotlightX = useRef(new Animated.Value(0)).current;
    const spotlightY = useRef(new Animated.Value(0)).current;
    const spotlightWidth = useRef(new Animated.Value(0)).current;
    const spotlightHeight = useRef(new Animated.Value(0)).current;
    const spotlightOpacity = useRef(new Animated.Value(0)).current;

    // Animation for smooth fade in/out of entire overlay
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    // Ref to the modal container for relative measurements (fixes iOS coordinate system issue)
    const containerRef = useRef<View>(null);

    // Fade in on mount
    useEffect(() => {
        if (visible) {
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    // Smooth dismiss with fade-out animation
    const handleDismissWithAnimation = () => {
        Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onDismiss();
        });
    };

    // Animate spotlight when step changes
    useEffect(() => {
        if (!visible || !step) return;

        const padding = step.spotlightPadding ?? 8;
        const hasTarget = step.targetLayout && step.position !== 'center';

        if (hasTarget && step.targetLayout) {
            const { x, y, width, height } = step.targetLayout;

            Animated.parallel([
                Animated.spring(spotlightX, {
                    toValue: x - padding,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 10,
                }),
                Animated.spring(spotlightY, {
                    toValue: y - padding,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 10,
                }),
                Animated.spring(spotlightWidth, {
                    toValue: width + padding * 2,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 10,
                }),
                Animated.spring(spotlightHeight, {
                    toValue: height + padding * 2,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 10,
                }),
                Animated.timing(spotlightOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            // No target - hide spotlight
            Animated.timing(spotlightOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [visible, step, currentStepIndex]);

    if (!visible || !step) return null;

    const hasSpotlight = step.targetLayout && step.position !== 'center';
    const borderRadius = step.spotlightBorderRadius ?? 12;

    // Calculate tooltip position
    const getTooltipStyle = () => {
        const tooltipWidth = Math.min(windowWidth - 48, 320);
        const spacing = 20;

        if (step.position === 'center' || !step.targetLayout) {
            return {
                top: windowHeight / 2 - 100,
                left: (windowWidth - tooltipWidth) / 2,
                width: tooltipWidth,
            };
        }

        const { x, y, width, height } = step.targetLayout;

        // Handle right position (tooltip to the right of target)
        if (step.position === 'right') {
            let left = x + width + spacing;
            let top = y - 20; // Align with target, slightly above center

            // Ensure tooltip stays on screen
            if (left + tooltipWidth > windowWidth - 24) {
                left = windowWidth - tooltipWidth - 24;
            }
            if (top < 60) top = 60;
            if (top + 200 > windowHeight - 40) top = windowHeight - 240;

            return {
                top,
                left,
                width: tooltipWidth,
            };
        }

        // Handle left position (tooltip to the left of target)
        if (step.position === 'left') {
            let left = x - tooltipWidth - spacing;
            let top = y - 20;

            // Ensure tooltip stays on screen
            if (left < 24) left = 24;
            if (top < 60) top = 60;
            if (top + 200 > windowHeight - 40) top = windowHeight - 240;

            return {
                top,
                left,
                width: tooltipWidth,
            };
        }

        // Top/Bottom positions
        let top = 0;
        if (step.position === 'bottom') {
            top = y + height + spacing;
        } else if (step.position === 'top') {
            top = y - 200 - spacing; // Approximate height of tooltip
        }

        // Ensure tooltip stays on screen vertically
        if (top < 60) top = 60;
        if (top + 200 > windowHeight - 40) top = windowHeight - 240;

        // Center tooltip horizontally relative to target, but keep on screen
        let left = x + width / 2 - tooltipWidth / 2;
        if (left < 24) left = 24;
        if (left + tooltipWidth > windowWidth - 24) left = windowWidth - tooltipWidth - 24;

        return {
            top,
            left,
            width: tooltipWidth,
        };
    };

    const tooltipStyle = getTooltipStyle();
    const isLastStep = currentStepIndex === steps.length - 1;

    // Calculate arrow position to point at target
    const getArrowStyle = (): { left?: number; right?: number; top?: number; position: 'top' | 'bottom' | 'left' | 'right' } | null => {
        if (!step.targetLayout || step.position === 'center') return null;

        const { y, height } = step.targetLayout;

        // For right position: arrow on left side of tooltip, pointing left
        if (step.position === 'right') {
            const targetCenterY = y + height / 2;
            let arrowTop = targetCenterY - tooltipStyle.top - 8;

            // Clamp arrow to stay within tooltip bounds
            if (arrowTop < 20) arrowTop = 20;
            if (arrowTop > 160) arrowTop = 160;

            return { left: -8, top: arrowTop, position: 'left' };
        }

        // For left position: arrow on right side of tooltip, pointing right
        if (step.position === 'left') {
            const targetCenterY = y + height / 2;
            let arrowTop = targetCenterY - tooltipStyle.top - 8;

            if (arrowTop < 20) arrowTop = 20;
            if (arrowTop > 160) arrowTop = 160;

            return { right: -8, top: arrowTop, position: 'right' };
        }

        // Top/Bottom positions: arrow on top or bottom edge
        const targetCenterX = step.targetLayout.x + step.targetLayout.width / 2;
        let arrowLeft = targetCenterX - tooltipStyle.left - 8;

        // Clamp arrow position to stay within tooltip bounds
        if (arrowLeft < 20) arrowLeft = 20;
        if (arrowLeft > tooltipStyle.width - 36) arrowLeft = tooltipStyle.width - 36;

        return { left: arrowLeft, position: step.position === 'bottom' ? 'top' : 'bottom' };
    };

    const arrowStyle = getArrowStyle();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <Animated.View
                ref={containerRef}
                collapsable={false}
                style={[styles.container, { opacity: overlayOpacity }]}
            >
                {/* SVG Spotlight Overlay */}
                <Svg
                    width={windowWidth}
                    height={windowHeight}
                    style={StyleSheet.absoluteFill}
                >
                    <Defs>
                        <Mask id="spotlight-mask">
                            {/* White background = visible overlay */}
                            <Rect
                                x="0"
                                y="0"
                                width={windowWidth}
                                height={windowHeight}
                                fill="white"
                            />
                            {/* Black cutout = transparent hole */}
                            {hasSpotlight && (
                                <AnimatedRect
                                    x={spotlightX}
                                    y={spotlightY}
                                    width={spotlightWidth}
                                    height={spotlightHeight}
                                    rx={borderRadius}
                                    ry={borderRadius}
                                    fill="black"
                                />
                            )}
                        </Mask>
                    </Defs>

                    {/* Dark overlay with spotlight cutout */}
                    <Rect
                        x="0"
                        y="0"
                        width={windowWidth}
                        height={windowHeight}
                        fill="rgba(0, 0, 0, 0.7)"
                        mask="url(#spotlight-mask)"
                    />

                    {/* Glow effect around spotlight */}
                    {hasSpotlight && (
                        <AnimatedRect
                            x={spotlightX}
                            y={spotlightY}
                            width={spotlightWidth}
                            height={spotlightHeight}
                            rx={borderRadius}
                            ry={borderRadius}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth={2}
                        />
                    )}
                </Svg>

                {/* Drawer content rendered inside tour Modal (fixes iOS Modal stacking) */}
                {/* Pass containerRef for relative measurements on iOS */}
                {drawerContent && React.cloneElement(drawerContent as React.ReactElement, {
                    measureRelativeTo: containerRef
                })}

                {/* Tooltip - with glassmorphism effect */}
                <Animated.View style={[
                    styles.tooltip,
                    tooltipStyle,
                    // Web-only glassmorphism
                    Platform.OS === 'web' && {
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    } as any,
                ]}>
                    {/* Arrow pointing to target */}
                    {step.position !== 'center' && step.targetLayout && arrowStyle && (
                        <View style={[
                            styles.arrow,
                            arrowStyle.position === 'top' && styles.arrowTop,
                            arrowStyle.position === 'bottom' && styles.arrowBottom,
                            arrowStyle.position === 'left' && styles.arrowLeft,
                            arrowStyle.position === 'right' && styles.arrowRight,
                            { left: arrowStyle.left, right: arrowStyle.right, top: arrowStyle.top }
                        ]} />
                    )}

                    <View style={styles.header}>
                        <Text style={styles.stepIndicator}>
                            {currentStepIndex + 1} of {steps.length}
                        </Text>
                        <TouchableOpacity onPress={handleDismissWithAnimation} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <Ionicons name="close" size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.title}>{step.title}</Text>
                    <Text style={styles.description}>{step.description}</Text>

                    <View style={styles.footer}>
                        {currentStepIndex > 0 && (
                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={handleDismissWithAnimation}
                            >
                                <Text style={styles.skipButtonText}>Skip</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={isLastStep ? handleDismissWithAnimation : onNext}
                        >
                            <Text style={styles.buttonText}>
                                {isLastStep ? 'Get Started' : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tooltip: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.92)', // Semi-transparent for glassmorphism
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35, // Slightly stronger shadow for definition
        shadowRadius: 16,
        elevation: 12,
    },
    arrow: {
        position: 'absolute',
        width: 16,
        height: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.92)', // Match tooltip transparency
        transform: [{ rotate: '45deg' }],
        shadowColor: '#000',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    arrowTop: {
        top: -8,
    },
    arrowBottom: {
        bottom: -8,
    },
    arrowLeft: {
        left: -8,
    },
    arrowRight: {
        right: -8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    stepIndicator: {
        fontSize: 12,
        fontWeight: '600',
        color: IOS_COLORS.blue,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: TUFTE_FORM_COLORS.label,
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: TUFTE_FORM_COLORS.secondaryLabel,
        lineHeight: 22,
        marginBottom: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
    },
    skipButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    skipButtonText: {
        color: TUFTE_FORM_COLORS.secondaryLabel,
        fontSize: 15,
        fontWeight: '500',
    },
    button: {
        backgroundColor: IOS_COLORS.blue,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
