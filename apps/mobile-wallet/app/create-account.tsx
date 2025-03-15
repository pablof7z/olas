import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateAccountScreen() {
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Account</Text>
                <View style={{ width: 24 }} />
            </View>
            
            <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
                <Text style={styles.title}>Create Your Wallet</Text>
                <Text style={styles.subtitle}>
                    This is a placeholder for the account creation process.
                </Text>
                
                <View style={styles.formContainer}>
                    {/* Account creation form will go here */}
                    <Text style={styles.comingSoon}>Account creation coming soon</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Inter-Bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#AAAAAA',
        marginBottom: 40,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    comingSoon: {
        fontSize: 18,
        fontFamily: 'Inter-Medium',
        color: '#8E45FF',
    }
}); 