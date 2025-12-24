import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, Alert, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { OrderService, ShippingInfo } from '../../services/OrderService';
import { ShippingForm } from './ShippingForm';
import { PaymentConfirmation } from './PaymentConfirmation';

interface ProductShowcaseProps {
    onAddToBag: (color: string) => void;
}

const { width } = Dimensions.get('window');

const VENMO_LINK = 'https://venmo.com/code?user_id=2749420076826624446';

const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onAddToBag }) => {
    const { isDarkMode, colors } = useTheme();
    const theme = isDarkMode ? 'dark' : 'light';
    const { user } = useAuthStore();
    const [selectedColor, setSelectedColor] = useState<'orange' | 'black'>('orange');
    const [showShippingForm, setShowShippingForm] = useState(false);
    const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBuyNow = () => {
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to purchase The Wolverine',
                [{ text: 'OK' }]
            );
            return;
        }
        setShowShippingForm(true);
    };

    const handleShippingSubmit = async (shippingInfo: ShippingInfo) => {
        if (!user) {
            Alert.alert('Error', 'Please sign in to continue');
            return;
        }

        // Use shipping email if user email is not available (e.g., anonymous auth)
        const userEmail = user.email || shippingInfo.email;

        setIsProcessing(true);
        try {
            // Create order in Firestore
            const orderId = await OrderService.createOrder(
                user.uid,
                userEmail,
                shippingInfo
            );

            setCurrentOrderId(orderId);
            setShowShippingForm(false);

            // Open Venmo link
            const canOpen = await Linking.canOpenURL(VENMO_LINK);
            if (canOpen) {
                await Linking.openURL(VENMO_LINK);
            } else {
                Alert.alert('Error', 'Cannot open Venmo. Please install the Venmo app or use venmo.com');
            }

            // Show payment confirmation modal
            setTimeout(() => {
                setShowPaymentConfirmation(true);
            }, 1000);

        } catch (error) {
            console.error('Error creating order:', error);
            Alert.alert('Error', 'Failed to create order. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!currentOrderId) return;

        try {
            await OrderService.confirmPaymentSent(currentOrderId);
            setShowPaymentConfirmation(false);
            setCurrentOrderId(null);

            Alert.alert(
                'Order Received!',
                'Thank you! We\'ll verify your payment and ship The Wolverine within 2-3 business days.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error confirming payment:', error);
            Alert.alert('Error', 'Failed to confirm payment. Please try again.');
        }
    };

    const handleNotYet = () => {
        setShowPaymentConfirmation(false);
        Alert.alert(
            'No Problem',
            'Your order is saved. You can send payment to @MattDyor on Venmo anytime.',
            [
                {
                    text: 'Open Venmo',
                    onPress: () => Linking.openURL(VENMO_LINK)
                },
                { text: 'OK' }
            ]
        );
    };

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
                        Stick "The Wolverine" in the grass and prop your camera up on every shot in about 2 seconds. Use it with Golf Brain to record your whole round.
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
                    onPress={handleBuyNow}
                    disabled={isProcessing}
                >
                    <Text style={styles.addToBagText}>{isProcessing ? 'Processing...' : 'Buy Now'}</Text>
                    <Ionicons name="card-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </BlurView>

            {/* Shipping Form Modal */}
            <Modal
                visible={showShippingForm}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowShippingForm(false)}
            >
                <ShippingForm
                    onSubmit={handleShippingSubmit}
                    onCancel={() => setShowShippingForm(false)}
                />
            </Modal>

            {/* Payment Confirmation Modal */}
            {currentOrderId && (
                <PaymentConfirmation
                    visible={showPaymentConfirmation}
                    orderId={currentOrderId}
                    onConfirmPayment={handleConfirmPayment}
                    onNotYet={handleNotYet}
                />
            )}
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
