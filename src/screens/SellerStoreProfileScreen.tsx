import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { getSellerProfile, updateSellerProfile } from '../services/endpoints';
import { useTranslation } from '../context';

interface LocalImage {
    uri: string;
    isLocal: boolean;
}

const getMimeType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    return 'image/jpeg';
};

export default function SellerStoreProfileScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [storeName, setStoreName] = useState('');
    const [description, setDescription] = useState('');
    const [profileImage, setProfileImage] = useState<LocalImage | null>(null);
    const [coverImage, setCoverImage] = useState<LocalImage | null>(null);

    const loadProfile = useCallback(async () => {
        try {
            const data = await getSellerProfile();
            setStoreName(data.vendor.name || '');
            setDescription(data.vendor.description || '');
            if (data.vendor.logo) {
                setProfileImage({ uri: data.vendor.logo, isLocal: false });
            }
            if (data.vendor.banner) {
                setCoverImage({ uri: data.vendor.banner, isLocal: false });
            }
        } catch (error) {
            console.error('Failed to load seller profile:', error);
            Alert.alert(t('common.error', 'Error'), t('seller.profile_load_failed', 'Failed to load store profile'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const pickImage = async (type: 'profile' | 'cover') => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            });

            if (!result.canceled) {
                const uri = result.assets[0]?.uri;
                if (!uri) return;
                const image = { uri, isLocal: true };
                if (type === 'profile') {
                    setProfileImage(image);
                } else {
                    setCoverImage(image);
                }
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert(t('common.error', 'Error'), t('seller.image_pick_failed', 'Failed to pick image'));
        }
    };

    const handleSave = async () => {
        if (!storeName.trim()) {
            Alert.alert(t('common.error', 'Error'), t('seller.store_name_required', 'Store name is required'));
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('store_name', storeName.trim());
            formData.append('description', description.trim());
            if (profileImage?.isLocal) {
                const filename = profileImage.uri.split('/').pop() || 'profile.jpg';
                if (Platform.OS === 'web') {
                    const response = await fetch(profileImage.uri);
                    const blob = await response.blob();
                    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
                    formData.append('profile_image', file);
                } else {
                    const type = getMimeType(filename);
                    // @ts-ignore
                    formData.append('profile_image', { uri: profileImage.uri, name: filename, type });
                }
            }

            if (coverImage?.isLocal) {
                const filename = coverImage.uri.split('/').pop() || 'cover.jpg';
                if (Platform.OS === 'web') {
                    const response = await fetch(coverImage.uri);
                    const blob = await response.blob();
                    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
                    formData.append('cover_image', file);
                } else {
                    const type = getMimeType(filename);
                    // @ts-ignore
                    formData.append('cover_image', { uri: coverImage.uri, name: filename, type });
                }
            }

            await updateSellerProfile(formData);
            Alert.alert(t('common.success', 'Success'), t('seller.profile_updated', 'Store profile updated'), [
                { text: t('common.ok', 'OK'), onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error('Update store profile error:', error);
            Alert.alert(t('common.error', 'Error'), t('seller.profile_update_failed', 'Failed to update store profile'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('seller.edit_store', 'Edit Store')}</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.coverSection}>
                    {coverImage?.uri ? (
                        <Image source={{ uri: coverImage.uri }} style={styles.coverImage} />
                    ) : (
                        <View style={styles.coverPlaceholder}>
                            <Ionicons name="image-outline" size={40} color={colors.textLight} />
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.coverButton}
                        onPress={() => pickImage('cover')}
                    >
                        <Ionicons name="camera" size={18} color={colors.white} />
                        <Text style={styles.coverButtonText}>{t('seller.change_cover', 'Change Cover')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.profileSection}>
                    <View style={styles.profileImageWrapper}>
                        {profileImage?.uri ? (
                            <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
                        ) : (
                            <Ionicons name="person-outline" size={32} color={colors.textLight} />
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => pickImage('profile')}
                    >
                        <Ionicons name="camera" size={16} color={colors.primary} />
                        <Text style={styles.profileButtonText}>{t('seller.change_logo', 'Change Logo')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('seller.store_name', 'Store Name')}</Text>
                    <TextInput
                        style={styles.input}
                        value={storeName}
                        onChangeText={setStoreName}
                        placeholder={t('seller.store_name_placeholder', 'Store name')}
                        placeholderTextColor={colors.textLight}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('seller.description', 'Description')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder={t('seller.description_placeholder', 'Describe your store')}
                        placeholderTextColor={colors.textLight}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.saveButtonText}>{t('common.save_changes', 'Save Changes')}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        flex: 1,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    coverSection: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.lg,
    },
    coverImage: {
        width: '100%',
        height: 150,
    },
    coverPlaceholder: {
        width: '100%',
        height: 150,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverButton: {
        position: 'absolute',
        right: spacing.md,
        bottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    coverButtonText: {
        color: colors.white,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    profileImageWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    profileButtonText: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: fontWeight.medium,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        backgroundColor: colors.background,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});
