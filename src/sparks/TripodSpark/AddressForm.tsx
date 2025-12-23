import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export interface ShippingAddress {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
}

interface AddressFormProps {
    onSubmit: (address: ShippingAddress) => void;
    onBack: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSubmit, onBack }) => {
    const { colors } = useTheme();
    const [address, setAddress] = useState<ShippingAddress>({
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
    });

    const isValid = Object.values(address).every(field => field.trim().length > 0);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Shipping Address</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder="John Doe"
                        placeholderTextColor={colors.textSecondary} // Using textSecondary for placeholder for better visibility in dark mode
                        value={address.name}
                        onChangeText={(text) => setAddress({ ...address, name: text })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder="123 Golf Lane"
                        placeholderTextColor={colors.textSecondary}
                        value={address.street}
                        onChangeText={(text) => setAddress({ ...address, street: text })}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 2, marginRight: 12 }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                            placeholder="Fairway"
                            placeholderTextColor={colors.textSecondary}
                            value={address.city}
                            onChangeText={(text) => setAddress({ ...address, city: text })}
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>State</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                            placeholder="CA"
                            placeholderTextColor={colors.textSecondary}
                            value={address.state}
                            onChangeText={(text) => setAddress({ ...address, state: text })}
                            maxLength={2}
                            autoCapitalize="characters"
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>ZIP Code</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder="90210"
                        placeholderTextColor={colors.textSecondary}
                        value={address.zip}
                        onChangeText={(text) => setAddress({ ...address, zip: text })}
                        keyboardType="number-pad"
                        maxLength={10}
                    />
                </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: isValid ? colors.primary : colors.border }
                    ]}
                    disabled={!isValid}
                    onPress={() => onSubmit(address)}
                >
                    <Text style={styles.submitButtonText}>Continue to Payment</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    formGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    footer: {
        padding: 24,
        paddingBottom: 34,
        borderTopWidth: 1,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default AddressForm;
