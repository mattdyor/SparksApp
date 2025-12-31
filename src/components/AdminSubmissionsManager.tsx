import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Linking, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SparkSubmissionAdminService, SparkSubmission } from '../services/SparkSubmissionAdminService';

interface AdminSubmissionsManagerProps {
    visible: boolean;
    onClose: () => void;
}

export const AdminSubmissionsManager: React.FC<AdminSubmissionsManagerProps> = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const [submissions, setSubmissions] = useState<SparkSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            loadSubmissions();
        }
    }, [visible]);

    const loadSubmissions = async () => {
        try {
            setIsLoading(true);
            const allSubmissions = await SparkSubmissionAdminService.getAllSubmissions();
            setSubmissions(allSubmissions);
        } catch (error) {
            console.error('Error loading submissions:', error);
            Alert.alert('Error', 'Failed to load spark submissions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsViewed = async (id: string) => {
        try {
            await SparkSubmissionAdminService.markSubmissionAsViewed(id);
            await loadSubmissions(); // Refresh
        } catch (error) {
            Alert.alert('Error', 'Failed to mark as viewed');
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 20,
            fontWeight: '600',
            color: colors.text,
        },
        closeButton: {
            padding: 8,
        },
        closeButtonText: {
            fontSize: 16,
            color: colors.primary,
            fontWeight: '600',
        },
        content: {
            flex: 1,
            padding: 16,
        },
        submissionItem: {
            backgroundColor: colors.surface,
            padding: 16,
            marginBottom: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        unreadIndicator: {
            position: 'absolute',
            top: 12,
            right: 12,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.error,
        },
        sparkName: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 4,
        },
        email: {
            fontSize: 14,
            color: colors.primary,
            marginBottom: 8,
        },
        date: {
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 12,
        },
        label: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textSecondary,
            marginTop: 8,
            textTransform: 'uppercase',
        },
        value: {
            fontSize: 14,
            color: colors.text,
            marginTop: 2,
            lineHeight: 20,
        },
        actions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 16,
            gap: 12,
        },
        actionButton: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: colors.primary,
        },
        actionButtonSecondary: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
        },
        actionText: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '600',
        },
        actionTextSecondary: {
            color: colors.text,
            fontSize: 14,
            fontWeight: '600',
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
        },
        emptyText: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
        }
    });

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Spark Submissions</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <ScrollView style={styles.content}>
                        {submissions.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.submissionItem}
                                onPress={() => setSelectedSubmissionId(selectedSubmissionId === item.id ? null : item.id)}
                            >
                                {item.viewedByAdmin !== true && <View style={styles.unreadIndicator} />}

                                <Text style={styles.sparkName}>{item.sparkName}</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.email}`)}>
                                    <Text style={styles.email}>{item.email}</Text>
                                </TouchableOpacity>
                                <Text style={styles.date}>{formatDate(item.timestamp)}</Text>

                                <Text style={styles.label}>Description</Text>
                                <Text style={styles.value} numberOfLines={selectedSubmissionId === item.id ? undefined : 2}>
                                    {item.description}
                                </Text>

                                {selectedSubmissionId === item.id && (
                                    <>
                                        <Text style={styles.label}>Target Customer</Text>
                                        <Text style={styles.value}>{item.customer}</Text>

                                        <Text style={styles.label}>Customer Payment</Text>
                                        <Text style={styles.value}>{item.customerPayment}</Text>

                                        <Text style={styles.label}>Creation Payment</Text>
                                        <Text style={styles.value}>{item.creationPayment}</Text>

                                        <View style={styles.actions}>
                                            {item.viewedByAdmin !== true && (
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => handleMarkAsViewed(item.id)}
                                                >
                                                    <Text style={styles.actionText}>Mark as Viewed</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </>
                                )}
                            </TouchableOpacity>
                        ))}

                        {submissions.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No spark submissions yet.</Text>
                            </View>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
};
