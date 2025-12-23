import React, { useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import ProductShowcase from './TripodSpark/ProductShowcase';
import AddressForm, { ShippingAddress } from './TripodSpark/AddressForm';
import CheckoutPayment from './TripodSpark/CheckoutPayment';
import ConfettiCannon from 'react-native-confetti-cannon';

type Step = 'showcase' | 'address' | 'checkout' | 'success';

export default function TripodSpark() {
    const { colors } = useTheme();
    const [step, setStep] = useState<Step>('showcase');
    const [selectedColor, setSelectedColor] = useState<'orange' | 'black'>('orange');
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);

    const handleAddToBag = (color: string) => {
        setSelectedColor(color as 'orange' | 'black');
        setStep('address');
    };

    const handleAddressSubmit = (address: ShippingAddress) => {
        setShippingAddress(address);
        setStep('checkout');
    };

    const handlePaymentSuccess = () => {
        setStep('success');
    };

    if (step === 'success') {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />
                <View style={styles.successContent}>
                    <Text style={[styles.successTitle, { color: colors.text }]}>Order Confirmed!</Text>
                    <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                        Your Wolverine Tripod ({selectedColor}) is on its way to:
                    </Text>
                    <Text style={[styles.addressPreview, { color: colors.text }]}>
                        {shippingAddress?.city}, {shippingAddress?.state}
                    </Text>
                    <Image
                        source={require('../../assets/wolverine_tripod.jpg')}
                        style={styles.successImage}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {step === 'showcase' && (
                <ProductShowcase onAddToBag={handleAddToBag} />
            )}

            {step === 'address' && (
                <AddressForm
                    onSubmit={handleAddressSubmit}
                    onBack={() => setStep('showcase')}
                />
            )}

            {step === 'checkout' && shippingAddress && (
                <CheckoutPayment
                    color={selectedColor}
                    address={shippingAddress}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setStep('address')}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    successContent: {
        alignItems: 'center',
        padding: 32,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 12,
    },
    successSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
    },
    addressPreview: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 32,
    },
    successImage: {
        width: 200,
        height: 200,
        borderRadius: 100,
    },
});
