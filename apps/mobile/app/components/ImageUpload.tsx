import { View, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'

export default function ImageUpload() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        })

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri)
        }
    }

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            alert('Sorry, we need camera permissions to make this work!')
            return
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        })

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri)
        }
    }

    return (
        <View style={styles.container}>
            {selectedImage ? (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.image} />
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.uploadContainer}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={pickImage}>
                            <Ionicons name="images" size={40} color="#666" />
                            <Text style={styles.buttonText}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button} onPress={takePhoto}>
                            <Ionicons name="camera" size={40} color="#666" />
                            <Text style={styles.buttonText}>Camera</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>
                        Upload a photo or take a new one
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    imageContainer: {
        position: 'relative',
        aspectRatio: 1,
        width: '100%',
    },
    image: {
        flex: 1,
        borderRadius: 12,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    uploadContainer: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        borderRadius: 12,
        padding: 32,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        borderRadius: 12,
        marginHorizontal: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    helperText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        textAlign: 'center',
    },
}) 