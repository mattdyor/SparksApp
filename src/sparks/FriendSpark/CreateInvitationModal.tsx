import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { createCommonStyles } from '../../styles/CommonStyles';
import { CommonModal } from '../../components/CommonModal';
import FriendService from '../../services/FriendService';
import { HapticFeedback } from '../../utils/haptics';
import { useAuthStore } from '../../store/authStore';
import AuthService from '../../services/AuthService';

interface CreateInvitationModalProps {
    visible: boolean;
    onClose: () => void;
    onInvitationCreated: () => void;
}

export const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({
    visible,
    onClose,
    onInvitationCreated,
}) => {
    const { colors } = useTheme();
    const commonStyles = createCommonStyles(colors);
    const { user } = useAuthStore();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Verify user is authenticated when modal opens
    useEffect(() => {
        if (visible && !user) {
            Alert.alert(
                'Sign In Required',
                'You must be signed in to send friend invitations.',
                [{ text: 'OK', onPress: onClose }]
            );
        }
    }, [visible, user, onClose]);

    const handleSubmit = async () => {
        console.log('📧 CreateInvitationModal: handleSubmit called');
        
        // Verify authentication before proceeding
        if (!user || !user.uid) {
            Alert.alert(
                'Sign In Required',
                'You must be signed in to send friend invitations. Please sign in and try again.'
            );
            return;
        }

        // Verify current Firebase Auth user matches store
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser || currentUser.uid !== user.uid) {
            Alert.alert(
                'Authentication Error',
                'Your session has expired. Please sign in again.'
            );
            return;
        }
        
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        try {
            setIsSubmitting(true);
            HapticFeedback.light();

            console.log('📧 CreateInvitationModal: Calling FriendService.createInvitation with:', email.trim());
            
            // Check if FriendService is available
            if (!FriendService || typeof FriendService.createInvitation !== 'function') {
                throw new Error('FriendService is not available. Please ensure you are signed in.');
            }

            const invitationId = await FriendService.createInvitation(email.trim());
            console.log('📧 CreateInvitationModal: Invitation created successfully:', invitationId);
            
            HapticFeedback.success();
            Alert.alert('Success', 'Invitation sent!');
            
            setEmail('');
            onInvitationCreated();
        } catch (error: any) {
            console.error('❌ CreateInvitationModal: Error creating invitation:', error);
            console.error('❌ Error details:', {
                message: error?.message,
                stack: error?.stack,
                name: error?.name,
            });
            HapticFeedback.error();
            Alert.alert(
                'Error', 
                error?.message || 'Failed to send invitation. Please check the console for details.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setEmail('');
            onClose();
        }
    };

    const footer = (
        <View style={styles.footer}>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[commonStyles.secondaryButton, styles.button]}
                    onPress={handleClose}
                    disabled={isSubmitting}
                >
                    <Text style={commonStyles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        commonStyles.primaryButton, 
                        styles.button, 
                        (isSubmitting || !email.trim()) && { opacity: 0.6 }
                    ]}
                    onPress={() => {
                        console.log('📧 CreateInvitationModal: Send button pressed');
                        handleSubmit();
                    }}
                    disabled={isSubmitting || !email.trim()}
                    activeOpacity={0.7}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={commonStyles.primaryButtonText}>Send</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <CommonModal visible={visible} title="Send Friend Invitation" onClose={handleClose} footer={footer}>
            <View style={styles.content}>
                <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="friend@example.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                />
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    An invitation will be sent to this email address. They can accept it from their Friend Spark settings.
                </Text>
            </View>
        </CommonModal>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    hint: {
        fontSize: 12,
        marginTop: 4,
    },
    footer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
    },
});
