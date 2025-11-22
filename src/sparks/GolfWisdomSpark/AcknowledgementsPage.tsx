import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AcknowledgementsPage: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Acknowledgements</Text>
            <Text style={styles.text}>
                This epic work is the result of contributions from many golfers.
            </Text>
            <Text style={styles.text}>
                John Hart was not one of them.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    heading: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2C2C2C',
        marginBottom: 24,
        fontFamily: 'American Typewriter',
    },
    text: {
        fontSize: 18,
        lineHeight: 28,
        color: '#666',
        textAlign: 'center',
        fontFamily: 'American Typewriter',
        fontStyle: 'italic',
    },
});
