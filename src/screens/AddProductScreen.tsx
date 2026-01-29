import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    ActivityIndicator,
    Modal,
    Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { getCategories, createSellerProduct, getSellerProductById, updateSellerProduct } from '../services/endpoints';
import type { Category, RootStackParamList } from '../types';
import { Loading } from '../components';
import { useTranslation } from '../context';
import { getLocalizedField } from '../i18n/locale';

type RouteProps = RouteProp<RootStackParamList, 'AddProduct'>;

export default function AddProductScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProps>();
    const productId = route.params?.productId;
    const isEdit = typeof productId === 'number';
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingProduct, setLoadingProduct] = useState(false);

    // Form Fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const MAX_IMAGES = 5;

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories', error);
            Alert.alert(t('common.error', 'Error'), t('categories.load_failed', 'Could not load categories'));
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadProduct = useCallback(async () => {
        if (!isEdit || !productId) return;
        setLoadingProduct(true);
        try {
            const product = await getSellerProductById(productId);
            setName(product.name || '');
            setDescription(product.description || '');
            setPrice(product.price || '');
            setExistingImages(Array.isArray(product.images) ? product.images : []);
            if (product.category) {
                setSelectedCategory(product.category);
            }
        } catch (error) {
            console.error('Failed to load product', error);
            Alert.alert(t('common.error', 'Error'), t('products.load_failed', 'Could not load product'));
        } finally {
            setLoadingProduct(false);
        }
    }, [isEdit, productId]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    const pickImages = async () => {
        const remaining = isEdit ? MAX_IMAGES : MAX_IMAGES - images.length;
        if (!isEdit && remaining <= 0) {
            Alert.alert(t('product.images_max', 'Maximum Images'), t('product.images_max_desc', `You can only add up to ${MAX_IMAGES} images.`));
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: remaining,
            });

            if (!result.canceled) {
                const newImages = result.assets.map(asset => asset.uri);
                if (isEdit) {
                    setImages(newImages.slice(0, MAX_IMAGES));
                    setExistingImages([]);
                } else {
                    setImages([...images, ...newImages.slice(0, remaining)]);
                }
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert(t('common.error', 'Error'), t('product.images_pick_failed', 'Failed to pick images'));
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const validate = () => {
        if (!name.trim()) {
            Alert.alert(t('common.error', 'Error'), t('product.name_required', 'Product name is required'));
            return false;
        }
        if (!price || isNaN(Number(price)) || Number(price) <= 0) {
            Alert.alert(t('common.error', 'Error'), t('product.price_invalid', 'Price must be a number greater than 0'));
            return false;
        }
        if (!isEdit && (!stock || isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
            Alert.alert(t('common.error', 'Error'), t('product.stock_invalid', 'Stock must be an integer >= 0'));
            return false;
        }
        if (!selectedCategory) {
            Alert.alert(t('common.error', 'Error'), t('product.category_required', 'Category is required'));
            return false;
        }
        if (images.length === 0 && existingImages.length === 0) {
            Alert.alert(t('common.error', 'Error'), t('product.image_required', 'At least one image is required'));
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('base_price', price);
            if (!isEdit && stock) {
                formData.append('stock', stock);
            }
            formData.append('category_id', selectedCategory!.id.toString());

            const getMimeType = (filename: string) => {
                const ext = filename.split('.').pop()?.toLowerCase();
                if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
                if (ext === 'png') return 'image/png';
                if (ext === 'gif') return 'image/gif';
                if (ext === 'webp') return 'image/webp';
                return 'image/jpeg';
            };

            if (images.length > 0) {
                if (Platform.OS === 'web') {
                    for (let i = 0; i < images.length; i++) {
                        const uri = images[i];
                        const response = await fetch(uri);
                        const blob = await response.blob();
                        const filename = `image_${i}.jpg`;
                        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
                        formData.append('images[]', file);
                    }
                } else {
                    images.forEach((uri, index) => {
                        const filename = uri.split('/').pop() || `image_${index}.jpg`;
                        const type = getMimeType(filename);
                        // @ts-ignore
                        formData.append('images[]', { uri, name: filename, type });
                    });
                }
                formData.append('replace_images', '1');
            }

            if (isEdit && productId) {
                const response = await updateSellerProduct(productId, formData);
                console.log('Product updated successfully:', response);
                Alert.alert(t('common.success', 'Success'), t('product.updated', 'Product updated successfully'), [
                    { text: t('common.ok', 'OK'), onPress: () => navigation.goBack() },
                ]);
            } else {
                const response = await createSellerProduct(formData);
                console.log('Product created successfully:', response);
                Alert.alert(t('common.success', 'Success'), t('product.created', 'Product created successfully'), [
                    { text: t('common.ok', 'OK'), onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error: any) {
            console.error('Save product error:', error);
            const msg = error.response?.data?.message || t('product.save_failed', 'Failed to save product');
            Alert.alert(t('common.error', 'Error'), msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingProduct) {
        return <Loading message={t('product.loading', 'Loading product...')} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEdit ? t('product.edit_title', 'Edit Product') : t('product.add_title', 'Add New Product')}
                </Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Image Picker */}
                <View style={styles.imageSection}>
                    <Text style={styles.label}>{t('product.images', 'Product Images')} *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                        <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                            <Ionicons name="camera-outline" size={30} color={colors.primary} />
                            <Text style={styles.addImageText}>{isEdit ? t('common.replace', 'Replace') : t('common.add', 'Add')}</Text>
                        </TouchableOpacity>

                        {existingImages.map((uri, index) => (
                            <View key={`existing-${index}`} style={styles.imagePreviewWrapper}>
                                <Image source={{ uri }} style={styles.imagePreview} />
                                <View style={styles.currentBadge}>
                                    <Text style={styles.currentBadgeText}>{t('product.current', 'Current')}</Text>
                                </View>
                            </View>
                        ))}

                        {images.map((uri, index) => (
                            <View key={index} style={styles.imagePreviewWrapper}>
                                <Image source={{ uri }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close-circle" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Product Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('product.name', 'Product Name')} *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('product.name_placeholder', 'e.g. Wireless Headphones')}
                        placeholderTextColor={colors.textLight}
                    />
                </View>

                {/* Price & Stock */}
                {isEdit ? (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('product.price', 'Price')} ($) *</Text>
                        <TextInput
                            style={styles.input}
                            value={price}
                            onChangeText={setPrice}
                            placeholder="0.00"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textLight}
                        />
                    </View>
                ) : (
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                            <Text style={styles.label}>{t('product.price', 'Price')} ($) *</Text>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                placeholder="0.00"
                                keyboardType="numeric"
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                            <Text style={styles.label}>{t('product.stock', 'Stock')} *</Text>
                            <TextInput
                                style={styles.input}
                                value={stock}
                                onChangeText={setStock}
                                placeholder="1"
                                keyboardType="numeric"
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                    </View>
                )}

                {/* Category Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('categories.title', 'Category')} *</Text>
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text style={selectedCategory ? styles.selectText : styles.placeholderText}>
                            {selectedCategory ? getLocalizedField(selectedCategory as any, 'name', selectedCategory.name) : t('categories.select', 'Select Category')}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('product.description', 'Description')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder={t('product.description_placeholder', 'Product details...')}
                        placeholderTextColor={colors.textLight}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {isEdit ? t('common.save_changes', 'Save Changes') : t('product.create', 'Create Product')}
                        </Text>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* Category Modal */}
            <Modal
                visible={showCategoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('categories.select', 'Select Category')}</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.categoryList}>
                            {loadingCategories ? (
                                <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                            ) : (
                                categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={styles.categoryItem}
                                        onPress={() => {
                                            setSelectedCategory(cat);
                                            setShowCategoryModal(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.categoryItemText,
                                            selectedCategory?.id === cat.id && styles.categoryItemTextSelected
                                        ]}>{getLocalizedField(cat as any, 'name', cat.name)}</Text>
                                        {selectedCategory?.id === cat.id && (
                                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
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
        height: 48,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: spacing.sm,
    },
    row: {
        flexDirection: 'row',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 48,
        backgroundColor: colors.background,
    },
    selectText: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    placeholderText: {
        fontSize: fontSize.md,
        color: colors.textLight,
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginTop: spacing.md,
        height: 50,
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '60%',
        padding: spacing.md,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    modalTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    categoryList: {
        flex: 1,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    categoryItemText: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    categoryItemTextSelected: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
    imageSection: {
        marginBottom: spacing.lg,
    },
    imageList: {
        flexDirection: 'row',
    },
    addImageButton: {
        width: 80,
        height: 80,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        backgroundColor: colors.background,
    },
    addImageText: {
        fontSize: fontSize.xs,
        color: colors.primary,
        marginTop: 4,
    },
    imagePreviewWrapper: {
        position: 'relative',
        marginRight: spacing.md,
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.md,
    },
    currentBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    currentBadgeText: {
        color: colors.white,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.white,
        borderRadius: 10,
    },
});
