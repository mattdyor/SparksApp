import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface PaymentConfirmationProps {
    visible: boolean;
    orderId: string;
    onConfirmPayment: () => void;
    onNotYet: () => void;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
    visible,
    orderId,
    onConfirmPayment,
    onNotYet,
}) => {
    const { colors } = useTheme();

    const styles = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 24,
            width: '85%',
            maxWidth: 400,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 12,
            textAlign: 'center',
        },
        message: {
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: 8,
            textAlign: 'center',
            lineHeight: 24,
        },
        highlight: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.primary,
            marginBottom: 24,
            textAlign: 'center',
        },
        buttonContainer: {
            gap: 12,
        },
        button: {
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: 'center',
        },
        primaryButton: {
            backgroundColor: colors.primary,
        },
        secondaryButton: {
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: colors.border,
        },
        buttonText: {
            fontSize: 16,
            fontWeight: '600',
        },
        primaryButtonText: {
            color: '#FFFFFF',
        },
        secondaryButtonText: {
            color: colors.text,
        },
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onNotYet}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Payment Confirmation</Text>
                    <Text style={styles.message}>
                        Did you send $5.00 to our Venmo account?
                    </Text>
                    <Text style={styles.highlight}>
                        @MattDyor
                    </Text>
                    <Text style={styles.message}>
                        Once you confirm, we'll verify your payment and ship within 2-3 business days.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={onConfirmPayment}
                        >
                            <Text style={[styles.buttonText, styles.primaryButtonText]}>
                                ✓ Yes, I sent $5
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={onNotYet}
                        >
                            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                                Not yet
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
