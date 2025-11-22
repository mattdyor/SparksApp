import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PageIndicatorProps {
    currentPage: number;
    totalPages: number;
}

export const PageIndicator: React.FC<PageIndicatorProps> = ({
    currentPage,
    totalPages,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Page {currentPage + 1} of {totalPages}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    text: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'System',
    },
});
