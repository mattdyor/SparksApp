import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ProductShowcaseProps {
    onAddToBag: (color: string) => void;
}

const { width } = Dimensions.get('window');

const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onAddToBag }) => {
    const { isDarkMode, colors } = useTheme();
    const theme = isDarkMode ? 'dark' : 'light';
    const [selectedColor, setSelectedColor] = useState<'orange' | 'black'>('orange');

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../../assets/wolverine_tripod.jpg')}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <View style={styles.gradientOverlay} />
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Text style={[styles.brandText, { color: colors.primary }]}>THE WOLVERINE</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Mount Up. Swing Well.</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Record your swing on the golf course. The ultimate grass-mounting tripod for your swing analysis. Compact, durable, and ready for the range.
                    </Text>

                    {/* Color Selection */}
                    <View style={styles.colorSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Color</Text>
                        <View style={styles.colorOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.colorOption,
                                    selectedColor === 'orange' && styles.selectedColorOption,
                                    { borderColor: colors.primary }
                                ]}
                                onPress={() => setSelectedColor('orange')}
                            >
                                <View style={[styles.colorSwatch, { backgroundColor: '#FF6B00' }]} />
                                <Text style={[styles.colorName, { color: colors.text }]}>Blaze Orange</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.colorOption,
                                    selectedColor === 'black' && styles.selectedColorOption,
                                    { borderColor: colors.primary }
                                ]}
                                onPress={() => setSelectedColor('black')}
                            >
                                <View style={[styles.colorSwatch, { backgroundColor: '#1A1A1A' }]} />
                                <Text style={[styles.colorName, { color: colors.text }]}>stealth Black</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <BlurView intensity={80} tint={theme} style={[styles.footer, { borderTopColor: colors.border }]}>
                <View style={styles.priceContainer}>
                    <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Total</Text>
                    <Text style={[styles.price, { color: colors.text }]}>$5.00</Text>
                    <Text style={[styles.shippingLabel, { color: colors.success }]}>Free Shipping</Text>
                </View>

                <TouchableOpacity
                    style={[styles.addToBagButton, { backgroundColor: colors.primary }]}
                    onPress={() => onAddToBag(selectedColor)}
                >
                    <Text style={styles.addToBagText}>Add to Bag</Text>
                    <Ionicons name="bag-handle-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    imageContainer: {
        height: 400,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    contentContainer: {
        padding: 24,
    },
    brandText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 12,
        lineHeight: 38,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    colorSection: {
        marginBottom: 24,
    },
    colorOptions: {
        flexDirection: 'row',
        gap: 16,
    },
    colorOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'rgba(128,128,128,0.1)',
    },
    selectedColorOption: {
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    colorSwatch: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 12,
    },
    colorName: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 34,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceContainer: {
        flexDirection: 'column',
    },
    priceLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    price: {
        fontSize: 24,
        fontWeight: '700',
    },
    shippingLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    addToBagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        minWidth: 160,
    },
    addToBagText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ProductShowcase;
