import { Link, router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="wallet-outline" size={80} color="#8E45FF" />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.textContainer}>
                    <Text style={styles.title}>Nostr Wallet</Text>
                    <Text style={styles.subtitle}>
                        Secure, decentralized wallet for the Nostr ecosystem
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => router.push('/create-account')}
                    >
                        <Text style={styles.buttonText}>Create Account</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.importButton}>
                        <Text style={styles.importButtonText}>Import Existing Account</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    logoContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    logoCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333333',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    title: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#AAAAAA',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    createButton: {
        backgroundColor: '#8E45FF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#8E45FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    importButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333333',
    },
    importButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Inter-Medium',
    },
}); 