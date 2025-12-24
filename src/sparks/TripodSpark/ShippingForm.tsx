import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ShippingInfo } from '../../services/OrderService';

interface ShippingFormProps {
    onSubmit: (shippingInfo: ShippingInfo) => void;
    onCancel: () => void;
}

export const ShippingForm: React.FC<ShippingFormProps> = ({ onSubmit, onCancel }) => {
    const { colors } = useTheme();
    const [formData, setFormData] = useState<ShippingInfo>({
        name: '',
        email: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    const validateZip = (zip: string): boolean => {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return zipRegex.test(zip);
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof ShippingInfo, string>> = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Invalid phone format (e.g., 555-123-4567)';
        }
        if (!formData.address1.trim()) newErrors.address1 = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.zip.trim()) {
            newErrors.zip = 'Zip code is required';
        } else if (!validateZip(formData.zip)) {
            newErrors.zip = 'Invalid zip code (e.g., 12345 or 12345-6789)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit(formData);
        } else {
            Alert.alert('Validation Error', 'Please fill in all required fields correctly');
        }
    };

    const updateField = (field: keyof ShippingInfo, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        scrollContent: {
            padding: 20,
        },
        fieldContainer: {
            marginBottom: 16,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
        },
        required: {
            color: colors.error || '#ff4444',
        },
        input: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.text,
        },
        inputError: {
            borderColor: colors.error || '#ff4444',
            borderWidth: 2,
        },
        errorText: {
            fontSize: 12,
            color: colors.error || '#ff4444',
            marginTop: 4,
        },
        buttonContainer: {
            padding: 20,
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Shipping Information</Text>
                <Text style={styles.subtitle}>Enter your details to receive The Wolverine</Text>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Name */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Full Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        value={formData.name}
                        onChangeText={(value) => updateField('name', value)}
                        placeholder="John Doe"
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="words"
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Email */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Email <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        value={formData.email}
                        onChangeText={(value) => updateField('email', value)}
                        placeholder="john@example.com"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Phone */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Phone Number <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.phone && styles.inputError]}
                        value={formData.phone}
                        onChangeText={(value) => updateField('phone', value)}
                        placeholder="555-123-4567"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="phone-pad"
                    />
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                {/* Address Line 1 */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Address Line 1 <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.address1 && styles.inputError]}
                        value={formData.address1}
                        onChangeText={(value) => updateField('address1', value)}
                        placeholder="123 Main St"
                        placeholderTextColor={colors.textSecondary}
                    />
                    {errors.address1 && <Text style={styles.errorText}>{errors.address1}</Text>}
                </View>

                {/* Address Line 2 */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Address Line 2 (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.address2}
                        onChangeText={(value) => updateField('address2', value)}
                        placeholder="Apt 4B"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                {/* City */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        City <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.city && styles.inputError]}
                        value={formData.city}
                        onChangeText={(value) => updateField('city', value)}
                        placeholder="New York"
                        placeholderTextColor={colors.textSecondary}
                    />
                    {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                </View>

                {/* State */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        State <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.state && styles.inputError]}
                        value={formData.state}
                        onChangeText={(value) => updateField('state', value)}
                        placeholder="NY"
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="characters"
                        maxLength={2}
                    />
                    {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
                </View>

                {/* Zip Code */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Zip Code <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, errors.zip && styles.inputError]}
                        value={formData.zip}
                        onChangeText={(value) => updateField('zip', value)}
                        placeholder="12345"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                    />
                    {errors.zip && <Text style={styles.errorText}>{errors.zip}</Text>}
                </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSubmit}>
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>Continue to Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onCancel}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};
