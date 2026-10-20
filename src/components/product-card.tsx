import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface ProductProps {

  item: {

    id: string;

    name: string;

    price: string;

    image: string;

  };

}

export function ProductCard({ item }: ProductProps) {

  return (
<View style={styles.productCard}>
<Image

        source={{ uri: item.image }}

        style={styles.productImage}

        resizeMode="contain" // ปรับเป็น contain เพื่อไม่ให้รูปหูฟังโดนตัดขอบ

      />
<View style={styles.productInfo}>
<ThemedText style={styles.productName}>{item.name}</ThemedText>
<ThemedText style={styles.productPrice}>{item.price}</ThemedText>
</View>
<TouchableOpacity style={styles.viewButton} activeOpacity={0.6}>
<ThemedText style={styles.viewButtonText}>ดูเลย</ThemedText>
</TouchableOpacity>
</View>

  );

}

const styles = StyleSheet.create({

  productCard: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    padding: 12,

    borderRadius: 16,

    marginBottom: 12,

    borderWidth: 1,

    borderColor: '#E6F2FF', // ขอบสีฟ้าอ่อน

    shadowColor: '#007AFF',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.08,

    shadowRadius: 4,

    elevation: 2,

  },

  productImage: {

    width: 60,

    height: 60,

    borderRadius: 8,

    backgroundColor: '#F0F7FF', // สีพื้นหลังฟ้าจางๆ รองรับตอนโหลดรูป

    marginRight: 12,

  },

  productInfo: {

    flex: 1,

  },

  productName: {

    fontSize: 15,

    fontWeight: '600',

    color: '#003366', // สีน้ำเงินเข้มอ่านง่าย

  },

  productPrice: {

    fontSize: 13,

    color: '#007AFF', // สีกระเน้นราคาเป็นสีฟ้าสด

    fontWeight: '500',

    marginTop: 2,

  },

  viewButton: {

    backgroundColor: '#007AFF', // ปรับปุ่มเป็นสีฟ้าหลัก

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

  },

  viewButtonText: {

    color: '#FFFFFF', // ข้อความปุ่มสีขาว

    fontSize: 12,

    fontWeight: '600',

  },

});
 