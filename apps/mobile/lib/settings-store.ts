import * as SecureStore from 'expo-secure-store';

export const settingsStore = {
    get: SecureStore.getItemAsync,
    set: SecureStore.setItemAsync,
    delete: SecureStore.deleteItemAsync,
    getSync: SecureStore.getItem,
};