import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Image
} from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import type { Slide } from '../types';
import { getImageUrl } from '../services/api';
import { useTranslation } from '../context';
import { getLocalizedField } from '../i18n/locale';

interface HeroBannerProps {
    slides: Slide[];
    onSlidePress?: (slide: Slide) => void;
    autoPlayInterval?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const BANNER_HEIGHT = Math.min(130, Math.max(90, Math.round(SCREEN_WIDTH * 0.26)));

export default function HeroBanner({
    slides,
    onSlidePress,
    autoPlayInterval = 4000
}: HeroBannerProps) {
    const { t } = useTranslation();
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;

        const timer = setInterval(() => {
            const nextIndex = (currentIndex + 1) % slides.length;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * BANNER_WIDTH,
                animated: true
            });
            setCurrentIndex(nextIndex);
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [currentIndex, slides.length, autoPlayInterval]);

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / BANNER_WIDTH);
        if (index !== currentIndex && index >= 0 && index < slides.length) {
            setCurrentIndex(index);
        }
    };

    if (slides.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderTitle}>{t('home.hero.welcome_title', 'Welcome to TONAS')}</Text>
                    <Text style={styles.placeholderSubtitle}>{t('home.hero.welcome_subtitle', 'Discover amazing products')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                decelerationRate="fast"
                snapToInterval={BANNER_WIDTH}
                contentContainerStyle={styles.scrollContent}
            >
                {slides.map((slide, index) => {
                    const imageUrl = getImageUrl(slide.image);
                    const title = getLocalizedField(slide as any, 'title', slide.title);
                    const subtitle = getLocalizedField(slide as any, 'subtitle', slide.subtitle || 'TONAS');

                    return (
                        <TouchableOpacity
                            key={slide.id || index}
                            style={styles.slide}
                            onPress={() => onSlidePress?.(slide)}
                            activeOpacity={0.9}
                        >
                            {slide.image ? (
                                <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.slideImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.slideGradient} />
                            )}
                            <View style={styles.slideContent}>
                                <Text style={styles.slideSubtitle}>{subtitle || 'TONAS'}</Text>
                                <Text style={styles.slideTitle}>{title}</Text>
                                <TouchableOpacity style={styles.shopButton}>
                                    <Text style={styles.shopButtonText}>{t('home.hero.shop_now', 'Shop Now')}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Pagination Dots */}
            {slides.length > 1 && (
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: spacing.md,
        marginTop: spacing.sm,
    },
    scrollContent: {
        // No gap needed - snapToInterval handles spacing
    },
    slide: {
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: colors.secondary,
    },
    slideImage: {
        ...StyleSheet.absoluteFillObject,
    },
    slideGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.secondary,
    },
    slideContent: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'center',
        maxWidth: '70%',
    },
    slideSubtitle: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.xs,
    },
    slideTitle: {
        color: colors.white,
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.md,
    },
    shopButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignSelf: 'flex-start',
    },
    shopButtonText: {
        color: colors.white,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    placeholder: {
        height: BANNER_HEIGHT,
        backgroundColor: colors.secondary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        justifyContent: 'center',
    },
    placeholderTitle: {
        color: colors.white,
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.xs,
    },
    placeholderSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: fontSize.md,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.borderLight,
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: colors.primary,
        width: 20,
    },
});
