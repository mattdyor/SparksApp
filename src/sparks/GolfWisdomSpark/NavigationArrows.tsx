import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface NavigationArrowsProps {
    onPrevious: () => void;
    onNext: () => void;
    canGoPrevious: boolean;
    canGoNext: boolean;
    currentPage: number;
    totalPages: number;
}

export const NavigationArrows: React.FC<NavigationArrowsProps> = ({
    onPrevious,
    onNext,
    canGoPrevious,
    canGoNext,
    currentPage,
    totalPages,
}) => {
    // Convert page number to chapter label
    const getPageLabel = (pageIndex: number): string => {
        if (pageIndex === 0) return 'Title';
        if (pageIndex === totalPages - 1) return 'Acknowledgements';
        return `Chapter ${pageIndex}`;
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.arrow}
                onPress={onPrevious}
                disabled={!canGoPrevious}
            >
                <Text style={[styles.arrowText, !canGoPrevious && styles.arrowDisabled]}>
                    ←
                </Text>
            </TouchableOpacity>

            <Text style={styles.pageLabel}>
                {getPageLabel(currentPage)}
            </Text>

            <TouchableOpacity
                style={styles.arrow}
                onPress={onNext}
                disabled={!canGoNext}
            >
                <Text style={[styles.arrowText, !canGoNext && styles.arrowDisabled]}>
                    →
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    arrow: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        fontSize: 32,
        color: '#2D5016',
        fontWeight: 'bold',
    },
    arrowDisabled: {
        color: '#CCC',
        opacity: 0.3,
    },
    pageLabel: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'System',
        minWidth: 120,
        textAlign: 'center',
    },
});
