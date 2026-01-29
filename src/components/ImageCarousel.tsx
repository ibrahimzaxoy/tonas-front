import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import { colors, borderRadius } from '../theme';

interface ImageCarouselProps {
    images: string[];
    height?: number;
    onIndexChange?: (index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ImageCarousel({ images, height = Math.round(SCREEN_WIDTH * 0.6), onIndexChange }: ImageCarouselProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        onIndexChange?.(currentIndex);
    }, [currentIndex, onIndexChange]);

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        if (index !== currentIndex && index >= 0 && index < images.length) {
            setCurrentIndex(index);
        }
    };

    if (images.length === 0) {
        return <View style={[styles.placeholder, { height }]} />;
    }

    return (
        <View>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                decelerationRate="fast"
            >
                {images.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={[styles.slide, { width: SCREEN_WIDTH, height }]}>
                        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
                    </View>
                ))}
            </ScrollView>

            {images.length > 1 && (
                <View style={styles.pagination}>
                    {images.map((_, index) => (
                        <View key={index} style={[styles.dot, currentIndex === index && styles.dotActive]} />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    slide: {
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
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
