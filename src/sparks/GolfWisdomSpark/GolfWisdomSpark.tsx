import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TitlePage } from './TitlePage';
import { WisdomPage } from './WisdomPage';
import { AcknowledgementsPage } from './AcknowledgementsPage';
import { NavigationArrows } from './NavigationArrows';
import { GolfWisdomSettings } from './GolfWisdomSettings';
import { getTotalPages, getPageType, getWisdomQuote, wisdomQuotes, WisdomQuote } from './wisdomData';
import { loadWisdomPages } from '../../services/golfWisdomService';

const STORAGE_KEY = 'golfWisdom_currentPage';

interface GolfWisdomSparkProps {
    showSettings?: boolean;
    onCloseSettings?: () => void;
    onStateChange?: (state: any) => void;
    onComplete?: (result: any) => void;
}

export const GolfWisdomSpark: React.FC<GolfWisdomSparkProps> = ({
    showSettings = false,
    onCloseSettings
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [wisdomPages, setWisdomPages] = useState<WisdomQuote[]>(wisdomQuotes); // Start with local data
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Load wisdom pages from Firebase (with cache)
    useEffect(() => {
        loadWisdomData();
    }, []);

    // Load last read page on mount
    useEffect(() => {
        loadLastPage();
    }, []);

    // Save current page whenever it changes
    useEffect(() => {
        saveCurrentPage();
    }, [currentPage]);

    const loadWisdomData = async () => {
        try {
            setIsLoading(true);
            const { pages, fromCache } = await loadWisdomPages();

            if (pages && pages.length > 0) {
                setWisdomPages(pages);
                console.log(`✅ Loaded ${pages.length} wisdom pages ${fromCache ? 'from cache' : 'from Firebase'}`);
            } else {
                // Fallback to local data if Firebase fails
                console.log('⚠️ Using local wisdom data as fallback');
                setWisdomPages(wisdomQuotes);
            }
            setLoadError(null);
        } catch (error) {
            console.error('Error loading wisdom data:', error);
            setLoadError('Using offline data');
            // Keep using local data on error
            setWisdomPages(wisdomQuotes);
        } finally {
            setIsLoading(false);
        }
    };

    const loadLastPage = async () => {
        try {
            const savedPage = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedPage !== null) {
                setCurrentPage(parseInt(savedPage, 10));
            }
        } catch (error) {
            console.error('Error loading last page:', error);
        }
    };

    const saveCurrentPage = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, currentPage.toString());
        } catch (error) {
            console.error('Error saving current page:', error);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        const totalPages = 1 + wisdomPages.length + 1; // title + wisdom + acknowledgements
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const renderPage = () => {
        const totalPages = 1 + wisdomPages.length + 1;

        // Determine page type
        if (currentPage === 0) {
            return <TitlePage />;
        } else if (currentPage === totalPages - 1) {
            return <AcknowledgementsPage />;
        } else {
            // Wisdom page
            const wisdomIndex = currentPage - 1;
            const quote = wisdomPages[wisdomIndex];
            return quote ? <WisdomPage quote={quote} /> : null;
        }
    };

    const totalPages = 1 + wisdomPages.length + 1;

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#2D5016" />
                <Text style={styles.loadingText}>Loading wisdom...</Text>
            </View>
        );
    }

    if (showSettings) {
        return <GolfWisdomSettings onClose={onCloseSettings || (() => { })} />;
    }

    return (
        <View style={styles.container}>
            {/* Page Content */}
            <View style={styles.pageContent}>{renderPage()}</View>

            {/* Navigation Arrows with Page Indicator */}
            <NavigationArrows
                onPrevious={handlePrevious}
                onNext={handleNext}
                canGoPrevious={currentPage > 0}
                canGoNext={currentPage < totalPages - 1}
                currentPage={currentPage}
                totalPages={totalPages}
            />

            {/* Error indicator (subtle) */}
            {loadError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{loadError}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F1E8', // Warm cream/parchment
    },
    pageContent: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontFamily: 'American Typewriter',
    },
    errorContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 200, 100, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#666',
    },
});
