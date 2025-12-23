import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { usePlatformPay, PlatformPay, PlatformPayButton, isPlatformPaySupported } from '@stripe/stripe-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { ShippingAddress } from './AddressForm';

interface CheckoutPaymentProps {
    color: 'orange' | 'black';
    address: ShippingAddress;
    onSuccess: () => void;
    onBack: () => void;
}

const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({ color, address, onSuccess, onBack }) => {
    const { colors } = useTheme();
    const { isPlatformPaySupported: checkPlatformPay, confirmPlatformPayPayment } = usePlatformPay();
    const [isPaySupported, setIsPaySupported] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const supported = await checkPlatformPay({ googlePay: { testEnv: true } });
            setIsPaySupported(supported);
        })();
    }, []);

    const handlePay = async () => {
        setLoading(true);
        try {
            // NOTE: In a real app, you would fetch a clientSecret from your backend here.
            // Since we are mocking/testing mechanisms, we will simulate the flow.
            // If we had a clientSecret:
            /*
            const { error } = await confirmPlatformPayPayment(
              clientSecret,
              {
                applePay: {
                  cartItems: [
                    {
                      label: 'Wolverine Tripod',
                      amount: '5.00',
                      paymentType: PlatformPay.PaymentType.Immediate,
                    },
                  ],
                  merchantCountryCode: 'US',
                  currencyCode: 'USD',
                },
                googlePay: {
                  testEnv: true,
                  merchantName: 'Sparks App',
                  merchantCountryCode: 'US',
                  currencyCode: 'USD',
                  billingAddressConfig: {
                    format: PlatformPay.BillingAddressFormat.Full,
                    isPhoneNumberRequired: true,
                  },
                },
              }
            );
            */

            // SIMULATION MODE
            await new Promise(resolve => setTimeout(resolve, 2000)); // Fake network delay

            // Randomly succeed for demo
            const success = true;

            if (success) {
                onSuccess();
            } else {
                Alert.alert('Payment Failed', 'Please try again.');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong with the payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.itemText, { color: colors.text }]}>Wolverine Tripod ({color})</Text>
                        <Text style={[styles.priceText, { color: colors.text }]}>$5.00</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.summaryRow}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                        <Text style={[styles.totalPrice, { color: colors.primary }]}>$5.00</Text>
                    </View>
                </View>

                <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>Ship To</Text>
                    <Text style={[styles.addressText, { color: colors.text }]}>{address.name}</Text>
                    <Text style={[styles.addressText, { color: colors.text }]}>{address.street}</Text>
                    <Text style={[styles.addressText, { color: colors.text }]}>{address.city}, {address.state} {address.zip}</Text>
                </View>

                <View style={styles.paymentSection}>
                    {/* 
                NOTE: PlatformPayButton requires a valid setup to render properly usually.
                If it fails to verify support, we fallback to a custom button.
            */}
                    {isPaySupported ? (
                        <PlatformPayButton
                            type={PlatformPay.ButtonType.Pay}
                            onPress={handlePay}
                            style={styles.payButton}
                        />
                    ) : (
                        <TouchableOpacity
                            style={[styles.customPayButton, { backgroundColor: '#000' }]}
                            onPress={handlePay}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="card-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.customPayText}>Pay $5.00</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <Text style={[styles.secureText, { color: colors.textSecondary }]}>
                        Payments secured by Stripe
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        padding: 24,
    },
    summaryCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    addressCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 32,
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemText: {
        fontSize: 16,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: '700',
    },
    addressText: {
        fontSize: 16,
        marginBottom: 4,
    },
    paymentSection: {
        alignItems: 'center',
    },
    payButton: {
        width: '100%',
        height: 50,
    },
    customPayButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    customPayText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    secureText: {
        marginTop: 16,
        fontSize: 12,
    },
});

export default CheckoutPayment;
