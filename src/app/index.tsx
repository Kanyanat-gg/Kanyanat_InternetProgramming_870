import { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,

  Alert,

  FlatList,

  Image,

  Modal,

  Platform,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';

import { clearToken, getToken, getUser } from './auth';

interface Product {

  id: string | number;

  productCode: string;

  name: string;

  stock: string | number;

  category: string;

  location: string;

  price: string | number;

  status: string;

  image: string;

}

const API_BASE = 'http://119.59.102.161:3102/api/products';

const emptyForm = {

  name: '',

  productCode: '',

  price: '',

  stock: '',

  category: '',

  location: '',

  image: '',

};

const CATEGORIES = [

  { label: 'สวมหู (In-ear)', value: 'สวมหู', icon: '🎧' },

  { label: 'ครอบหู (Over-ear)', value: 'ครอบหู', icon: '🎶' },

];

type TabKey = 'home' | 'airpods' | 'categories';

// Alert.alert ของ React Native ไม่แสดงผลบน web ในโปรเจกต์นี้ (บั๊กของ react-native-web)

// เลยทำฟังก์ชันแจ้งเตือนของตัวเอง: web ใช้ window.alert, มือถือใช้ Alert.alert ปกติ

function notify(title: string, message?: string) {

  console.log('[notify]', title, message);

  if (Platform.OS === 'web') {

    if (typeof window !== 'undefined') {

      window.alert(message ? `${title}\n${message}` : title);

    }

  } else {

    Alert.alert(title, message);

  }

}

export default function Page() {

  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);

  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const [imageUploading, setImageUploading] = useState(false);

  const [userRole, setUserRole] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  const isAdmin = userRole === 'admin';

  useFocusEffect(

    useCallback(() => {

      (async () => {

        const token = await getToken();

        if (!token) {

          router.replace('/login');

          return;

        }

        const user = await getUser();

        setUserRole(user?.role ?? null);

      })();

    }, [])

  );

  const fetchProducts = async (keyword = '', type: 'all' | 'category' = 'all') => {

    try {

      setLoading(true);

      const response = await fetch(`${API_BASE}?search=${keyword}&type=${type}`);

      const data = await response.json();

      setProducts(data);

    } catch (error) {

      console.error('Error fetching products:', error);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchProducts();

  }, []);

  const openAddModal = () => {

    setEditingId(null);

    setForm(emptyForm);

    setModalVisible(true);

  };

  const openEditModal = (item: Product) => {

    setEditingId(item.id);

    setForm({

      name: item.name ?? '',

      productCode: item.productCode ?? '',

      price: String(item.price ?? ''),

      stock: String(item.stock ?? ''),

      category: item.category ?? '',

      location: item.location ?? '',

      image: item.image ?? '',

    });

    setModalVisible(true);

  };

  // ============ เลือกรูปจากเครื่อง (แทนการกรอกลิงก์) ============

  const pickImage = async () => {

    try {

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {

        notify('แจ้งเตือน', 'กรุณาอนุญาตให้แอปเข้าถึงรูปภาพในเครื่องก่อน');

        return;

      }

      const result = await ImagePicker.launchImageLibraryAsync({

        mediaTypes: ImagePicker.MediaTypeOptions.Images,

        allowsEditing: true,

        aspect: [1, 1],

        quality: 0.5,

        base64: true,

      });

      if (result.canceled || !result.assets || !result.assets[0]) {

        return;

      }

      const asset = result.assets[0];

      if (!asset.base64) {

        notify('Error', 'ไม่สามารถอ่านไฟล์รูปภาพได้');

        return;

      }

      setImageUploading(true);

      const mimeType = asset.mimeType || 'image/jpeg';

      const base64Image = `data:${mimeType};base64,${asset.base64}`;

      setForm((prev) => ({ ...prev, image: base64Image }));

      setImageUploading(false);

    } catch (err) {

      setImageUploading(false);

      console.error(err);

      notify('Error', 'เลือกรูปภาพไม่สำเร็จ');

    }

  };

  const handleSave = async () => {

    if (!form.name || !form.price) {

      notify('แจ้งเตือน', 'กรุณากรอกชื่อสินค้าและราคาด้วยครับ');

      return;

    }

    const token = await getToken();

    if (!token) {

      notify('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน');

      router.replace('/login');

      return;

    }

    const payload = {

      name: form.name,

      productCode: form.productCode,

      price: Number(form.price),

      stock: Number(form.stock) || 0,

      category: form.category,

      location: form.location,

      image: form.image || 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=300',

      status: 'Active',

    };

    const isEditing = editingId !== null;

    const url = isEditing ? `${API_BASE}/${editingId}` : API_BASE;

    const method = isEditing ? 'PUT' : 'POST';

    console.log('[handleSave] request', method, url);

    try {

      const response = await fetch(url, {

        method,

        headers: {

          'Content-Type': 'application/json',

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify(payload),

      });

      const result = await response.json().catch(() => ({}));

      console.log('[handleSave] response', response.status, result);

      if (response.status === 401 || response.status === 403) {

        notify('ไม่สามารถทำรายการได้', result.error || 'กรุณาเข้าสู่ระบบใหม่');

        return;

      }

      if (response.ok) {

        notify('สำเร็จ', isEditing ? 'แก้ไขสินค้าเรียบร้อยแล้ว!' : 'เพิ่มสินค้าเรียบร้อยแล้ว!');

        setModalVisible(false);

        setForm(emptyForm);

        setEditingId(null);

        fetchProducts(searchQuery);

      } else {

        notify('Error', result.error || 'ทำรายการไม่สำเร็จ');

      }

    } catch (err) {

      console.error('[handleSave] error', err);

      notify('Error', 'เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้');

    }

  };

  // ============ ซื้อสินค้า (สำหรับผู้ใช้ทั่วไปที่ไม่ใช่แอดมิน) ============

  // ไม่ใช้ Alert.alert แบบยืนยันหลายปุ่ม เพราะมีปัญหากับ react-native-web

  const handlePurchase = async (item: Product) => {

    const token = await getToken();

    if (!token) {

      notify('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน');

      router.replace('/login');

      return;

    }

    if (Number(item.stock) <= 0) {

      notify('สินค้าหมด', 'สินค้านี้หมดสต็อกแล้ว');

      return;

    }

    try {

      const response = await fetch(`${API_BASE}/${item.id}/purchase`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({ quantity: 1 }),

      });

      const result = await response.json().catch(() => ({}));

      console.log('[handlePurchase] response', response.status, result);

      if (response.status === 401 || response.status === 403) {

        notify('ไม่สามารถซื้อได้', result.error || 'กรุณาเข้าสู่ระบบใหม่');

        return;

      }

      if (!response.ok) {

        notify('ซื้อไม่สำเร็จ', result.error || 'เกิดข้อผิดพลาด');

        return;

      }

      notify('สำเร็จ', `ซื้อ "${item.name}" เรียบร้อยแล้ว`);

      fetchProducts(searchQuery);

    } catch (err) {

      console.error('[handlePurchase] error', err);

      notify('Error', 'เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้');

    }

  };

  const performDelete = async (item: Product) => {

    try {

      const token = await getToken();

      if (!token) {

        notify('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน');

        router.replace('/login');

        return;

      }

      console.log('[handleDelete] deleting id', item.id);

      const response = await fetch(`${API_BASE}/${item.id}`, {

        method: 'DELETE',

        headers: { Authorization: `Bearer ${token}` },

      });

      const result = await response.json().catch(() => ({}));

      console.log('[handleDelete] response', response.status, result);

      if (response.status === 401 || response.status === 403) {

        notify('แจ้งเตือน', result.error || 'ไม่สามารถลบได้ กรุณาเข้าสู่ระบบใหม่หรือเช็คสิทธิ์');

        return;

      }

      if (response.ok) {

        notify('สำเร็จ', 'ลบสินค้าเรียบร้อยแล้ว');

        fetchProducts(searchQuery);

      } else {

        notify('Error', result.error || 'ลบสินค้าไม่สำเร็จ');

      }

    } catch (err) {

      console.error('[handleDelete] error', err);

      notify('Error', 'เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้');

    } finally {

      setDeleteConfirmId(null);

    }

  };

  // กดครั้งแรก: ปุ่มเปลี่ยนเป็น "ยืนยันลบ?" / กดครั้งที่สอง (ภายใน 3 วิ): ลบจริง

  // ไม่ใช้ Alert.alert confirm เพราะใช้งานไม่ได้บนเว็บ

  const handleDelete = (item: Product) => {

    if (deleteConfirmId === item.id) {

      performDelete(item);

      return;

    }

    setDeleteConfirmId(item.id);

    setTimeout(() => {

      setDeleteConfirmId((curr) => (curr === item.id ? null : curr));

    }, 3000);

  };

  // ============ ออกจากระบบ (ไอคอนคนที่มุมขวาบน -> กดแล้วเปิด modal นี้) ============

  // ตัดขั้นตอนยืนยันด้วย Alert/window.confirm ออก เพราะมีปัญหากับ react-native-web

  // กดปุ่มแล้วออกจากระบบทันที

  const handleLogout = async () => {

    console.log('handleLogout called');

    setProfileModalVisible(false);

    try {

      await clearToken();

      console.log('token cleared');

    } catch (e) {

      console.error('clearToken error:', e);

    }

    router.replace('/login');

  };

  const openCategory = (categoryValue: string) => {

    setActiveTab('airpods');

    setSearchQuery(categoryValue);

    fetchProducts(categoryValue, 'category');

  };

  const goHomeTab = () => {

    setActiveTab('home');

    setSearchQuery('');

    fetchProducts('');

  };

  const goAirpodsTab = () => {

    setActiveTab('airpods');

    setSearchQuery('');

    fetchProducts('');

  };

  return (
<View style={styles.outerContainer}>
<View style={styles.phoneFrame}>

        {/* Header */}
<View style={styles.phoneHeader}>
<Text style={styles.menuIcon}>☰</Text>
<Text style={styles.headerTitle}>AirPods Store</Text>
<TouchableOpacity onPress={() => setProfileModalVisible(true)}>
<Text style={styles.profileIcon}>👤</Text>
</TouchableOpacity>
</View>

        {/* ===== หน้าแรก (Home) ===== */}

        {activeTab === 'home' && (

          loading ? (
<View style={styles.centerContainer}>
<ActivityIndicator size="large" color="#007AFF" />
</View>

          ) : (
<FlatList

              data={products}

              keyExtractor={(item) => String(item.id)}

              numColumns={2}

              contentContainerStyle={styles.promoListContent}

              columnWrapperStyle={{ gap: 10 }}

              ListHeaderComponent={
<View style={styles.heroBanner}>
<Text style={styles.heroTitle}>🎧 AirPods Store</Text>
<Text style={styles.heroSubtitle}>สินค้าแนะนำสำหรับคุณ</Text>
</View>

              }

              renderItem={({ item }) => (
<TouchableOpacity style={styles.promoCard} onPress={goAirpodsTab}>
<Image source={{ uri: item.image }} style={styles.promoImage} />
<Text style={styles.promoName} numberOfLines={1}>{item.name}</Text>
<Text style={styles.promoPrice}>{item.price} ฿</Text>
</TouchableOpacity>

              )}

            />

          )

        )}

        {/* ===== รายการสินค้า (AirPods) ===== */}

        {activeTab === 'airpods' && (
<>
<View style={styles.actionRow}>
<View style={styles.searchBox}>
<Text style={styles.searchIcon}>🔍</Text>
<TextInput

                  placeholder="ค้นหาสินค้า..."

                  placeholderTextColor="#8e8e93"

                  style={styles.searchInput}

                  value={searchQuery}

                  onChangeText={(text) => {

                    setSearchQuery(text);

                    fetchProducts(text);

                  }}

                />
</View>
<TouchableOpacity style={styles.addButton} onPress={() => fetchProducts(searchQuery)}>
<Text style={styles.addButtonText}>ค้นหา</Text>
</TouchableOpacity>
</View>

            {loading ? (
<View style={styles.centerContainer}>
<ActivityIndicator size="large" color="#007AFF" />
</View>

            ) : (
<FlatList

                data={products}

                keyExtractor={(item) => String(item.id)}

                contentContainerStyle={styles.listContent}

                showsVerticalScrollIndicator={false}

                renderItem={({ item }) => (
<View style={styles.card}>
<Image source={{ uri: item.image }} style={styles.productImage} />
<View style={styles.productInfo}>
<Text style={styles.codeText}>ID: {item.id} | Code: {item.productCode || '-'}</Text>
<Text style={styles.productName}>{item.name}</Text>
<Text style={styles.productPrice}>{item.price} ฿</Text>
<Text style={styles.metaText}>Stock: {item.stock}</Text>
<Text style={styles.metaText}>Category: {item.category}</Text>
<Text style={styles.metaText}>Location: {item.location}</Text>
</View>
<View style={styles.cardActions}>

                      {isAdmin ? (
<>
<TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
<Text style={styles.editBtnText}>แก้ไข</Text>
</TouchableOpacity>
<TouchableOpacity

                            style={[styles.deleteBtn, deleteConfirmId === item.id && styles.deleteBtnConfirming]}

                            onPress={() => handleDelete(item)}
>
<Text style={styles.deleteBtnText}>

                              {deleteConfirmId === item.id ? 'ยืนยันลบ?' : 'ลบ'}
</Text>
</TouchableOpacity>
</>

                      ) : (
<TouchableOpacity

                          style={[styles.buyBtn, Number(item.stock) <= 0 && styles.buyBtnDisabled]}

                          onPress={() => handlePurchase(item)}

                          disabled={Number(item.stock) <= 0}
>
<Text style={styles.buyBtnText}>

                            {Number(item.stock) <= 0 ? 'สินค้าหมด' : 'ซื้อ'}
</Text>
</TouchableOpacity>

                      )}
</View>
</View>

                )}

              />

            )}
</>

        )}

        {/* ===== หมวดหมู่ (Categories) ===== */}

        {activeTab === 'categories' && (
<View style={styles.categoriesContainer}>
<Text style={styles.categoriesTitle}>เลือกหมวดหมู่</Text>

            {CATEGORIES.map((cat) => (
<TouchableOpacity

                key={cat.value}

                style={styles.categoryCard}

                onPress={() => openCategory(cat.value)}
>
<Text style={styles.categoryIcon}>{cat.icon}</Text>
<Text style={styles.categoryLabel}>{cat.label}</Text>
<Text style={styles.chevron}>›</Text>
</TouchableOpacity>

            ))}
</View>

        )}

        {/* Modal เพิ่ม/แก้ไขสินค้า */}
<Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
<View style={styles.modalOverlay}>
<View style={styles.addModalContainer}>
<Text style={styles.modalTitle}>

                {editingId !== null ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}
</Text>
<ScrollView showsVerticalScrollIndicator={false}>
<TextInput style={styles.inputField} placeholder="ชื่อสินค้า (Name) *" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
<TextInput style={styles.inputField} placeholder="รหัสสินค้า (Product Code)" value={form.productCode} onChangeText={(t) => setForm({ ...form, productCode: t })} />
<TextInput style={styles.inputField} placeholder="ราคา (Price) *" keyboardType="numeric" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
<TextInput style={styles.inputField} placeholder="จำนวนสต็อก (Stock)" keyboardType="numeric" value={form.stock} onChangeText={(t) => setForm({ ...form, stock: t })} />
<TextInput style={styles.inputField} placeholder="หมวดหมู่ (สวมหู / ครอบหู)" value={form.category} onChangeText={(t) => setForm({ ...form, category: t })} />
<TextInput style={styles.inputField} placeholder="สถานที่จัดเก็บ (Location)" value={form.location} onChangeText={(t) => setForm({ ...form, location: t })} />

                {/* ===== เลือกรูปจากเครื่อง แทนการกรอกลิงก์ ===== */}
<TouchableOpacity style={styles.imagePickerButton} onPress={pickImage} disabled={imageUploading}>

                  {imageUploading ? (
<ActivityIndicator color="#fff" />

                  ) : (
<Text style={styles.imagePickerButtonText}>📷 เลือกรูปจากเครื่อง</Text>

                  )}
</TouchableOpacity>

                {form.image ? (
<Image source={{ uri: form.image }} style={styles.imagePreview} />

                ) : (
<Text style={styles.noImageText}>ยังไม่ได้เลือกรูปภาพ</Text>

                )}
<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
<Text style={styles.saveButtonText}>{editingId !== null ? 'บันทึกการแก้ไข' : 'บันทึกสินค้า'}</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
<Text style={styles.cancelButtonText}>ยกเลิก</Text>
</TouchableOpacity>
</ScrollView>
</View>
</View>
</Modal>

        {/* Modal โปรไฟล์ / ออกจากระบบ */}
<Modal animationType="fade" transparent visible={profileModalVisible} onRequestClose={() => setProfileModalVisible(false)}>
<View style={styles.modalOverlay}>
<View style={styles.profileModalContainer}>
<Text style={styles.profileAvatar}>👤</Text>
<Text style={styles.profileUsername}>บัญชีผู้ใช้</Text>
<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
<Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.cancelButton} onPress={() => setProfileModalVisible(false)}>
<Text style={styles.cancelButtonText}>ปิด</Text>
</TouchableOpacity>
</View>
</View>
</Modal>

        {/* Bottom Nav */}
<View style={styles.bottomNav}>
<TouchableOpacity style={styles.navItem} onPress={goHomeTab}>
<Text style={styles.navIcon}>🏠</Text>
<Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>หน้าแรก</Text>
</TouchableOpacity>

          {isAdmin && (
<TouchableOpacity style={styles.navItem} onPress={openAddModal}>
<Text style={styles.navIcon}>➕</Text>
<Text style={[styles.navText, { color: '#007AFF', fontWeight: 'bold' }]}>เพิ่มสินค้า</Text>
</TouchableOpacity>

          )}
<TouchableOpacity style={styles.navItem} onPress={goAirpodsTab}>
<Text style={styles.navIcon}>🎧</Text>
<Text style={[styles.navText, activeTab === 'airpods' && styles.navTextActive]}>AirPods</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('categories')}>
<Text style={styles.navIcon}>📁</Text>
<Text style={[styles.navText, activeTab === 'categories' && styles.navTextActive]}>หมวดหมู่</Text>
</TouchableOpacity>
</View>
</View>
</View>

  );

}

const styles = StyleSheet.create({

  outerContainer: { flex: 1, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },

  phoneFrame: { width: 375, height: 720, backgroundColor: '#f8f9fa', borderRadius: 36, overflow: 'hidden', borderWidth: 8, borderColor: '#ffffff', elevation: 10 },

  phoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10, backgroundColor: '#ffffff' },

  menuIcon: { fontSize: 20, color: '#333' },

  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e' },

  profileIcon: { fontSize: 20 },

  promoListContent: { padding: 12 },

  heroBanner: { backgroundColor: '#007AFF', borderRadius: 14, padding: 18, marginBottom: 14 },

  heroTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  heroSubtitle: { color: '#eaf3ff', fontSize: 12, marginTop: 4 },

  promoCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },

  promoImage: { width: 90, height: 90, borderRadius: 8, resizeMode: 'contain', marginBottom: 6 },

  promoName: { fontSize: 12, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center' },

  promoPrice: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', marginTop: 2 },

  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#ffffff', gap: 6 },

  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2f5', borderRadius: 8, paddingHorizontal: 8, height: 36 },

  searchIcon: { marginRight: 6, fontSize: 12 },

  searchInput: { flex: 1, fontSize: 12, color: '#000' },

  addButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },

  addButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { padding: 12 },

  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 14, padding: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },

  productImage: { width: 50, height: 50, borderRadius: 8, marginRight: 8, resizeMode: 'contain' },

  productInfo: { flex: 1 },

  codeText: { fontSize: 9, color: '#e67e22', fontWeight: 'bold', marginBottom: 2 },

  productName: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50' },

  productPrice: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', marginVertical: 1 },

  metaText: { fontSize: 9, color: '#7f8c8d' },

  cardActions: { justifyContent: 'center', gap: 6, marginLeft: 4 },

  editBtn: { backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },

  editBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  deleteBtn: { backgroundColor: '#ff3b30', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },

  deleteBtnConfirming: { backgroundColor: '#c93b00' },

  deleteBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  buyBtn: { backgroundColor: '#34c759', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },

  buyBtnDisabled: { backgroundColor: '#c7c7cc' },

  buyBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  categoriesContainer: { flex: 1, padding: 16 },

  categoriesTitle: { fontSize: 15, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 12 },

  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2 },

  categoryIcon: { fontSize: 24, marginRight: 12 },

  categoryLabel: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#2c3e50' },

  chevron: { fontSize: 20, color: '#c7c7cc' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },

  modalTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', color: '#333' },

  addModalContainer: { width: 320, backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },

  inputField: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, marginBottom: 10, backgroundColor: '#f9f9f9' },

  imagePickerButton: { backgroundColor: '#007AFF', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 8 },

  imagePickerButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  imagePreview: { width: '100%', height: 140, borderRadius: 10, marginBottom: 10, resizeMode: 'cover', backgroundColor: '#eee' },

  noImageText: { fontSize: 11, color: '#8e8e93', textAlign: 'center', marginBottom: 10 },

  saveButton: { backgroundColor: '#34c759', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 5 },

  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  cancelButton: { backgroundColor: '#8e8e93', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginTop: 8, width: '100%' },

  cancelButtonText: { color: '#fff', fontSize: 12, textAlign: 'center' },

  profileModalContainer: { width: 280, backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },

  profileAvatar: { fontSize: 40, marginBottom: 8 },

  profileUsername: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 16 },

  logoutButton: { width: '100%', backgroundColor: '#ff3b30', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },

  logoutButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#ffffff', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },

  navItem: { alignItems: 'center' },

  navIcon: { fontSize: 16 },

  navText: { fontSize: 9, color: '#8e8e93', marginTop: 2 },

  navTextActive: { color: '#007AFF', fontWeight: 'bold' },

});
 