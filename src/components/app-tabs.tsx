import { useEffect, useState } from 'react';

import { ActivityIndicator, FlatList, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

interface Product {

  id: string | number;

  name: string;

  stock: string | number;

  category: string;

  location: string;

  price: string | number;

  status: string;

  image: string;

}

const API_URL = 'http://119.59.102.161:3102/api/products?type=all';

export default function AppTabs() {

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    fetch(API_URL)

      .then((response) => response.json())

      .then((data) => {

        setProducts(data);

        setLoading(false);

      })

      .catch((error) => {

        console.error('Error fetching data:', error);

        setLoading(false);

      });

  }, []);

  if (loading) {

    return (
<View style={styles.centerContainer}>
<ActivityIndicator size="large" color="#0000ff" />
</View>

    );

  }

  return (
<SafeAreaView style={styles.container}>
<FlatList

        data={products}

        keyExtractor={(item) => String(item.id)}

        renderItem={({ item }) => (
<View style={styles.card}>
<Image source={{ uri: item.image }} style={styles.image} />
<View style={styles.details}>
<Text style={styles.name}>{item.name}</Text>
<Text style={styles.price}>{item.price} ฿</Text>
<Text style={styles.text}>Stock: {item.stock}</Text>
<Text style={styles.text}>Category: {item.category}</Text>
<Text style={styles.text}>Location: {item.location}</Text>
<View style={styles.statusBadge}>
<Text style={styles.statusText}>{item.status}</Text>
</View>
</View>
</View>

        )}

      />
</SafeAreaView>

  );

}

const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#f5f5f5',

    padding: 10,

  },

  centerContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

  card: {

    flexDirection: 'row',

    backgroundColor: '#ffffff',

    borderRadius: 12,

    padding: 12,

    marginBottom: 12,

    alignItems: 'center',

    shadowColor: '#000',

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 2,

  },

  image: {

    width: 70,

    height: 70,

    borderRadius: 8,

    marginRight: 12,

  },

  details: {

    flex: 1,

  },

  name: {

    fontSize: 16,

    fontWeight: 'bold',

    color: '#333',

  },

  price: {

    fontSize: 14,

    color: '#007AFF',

    fontWeight: '600',

    marginVertical: 2,

  },

  text: {

    fontSize: 12,

    color: '#666',

  },

  statusBadge: {

    alignSelf: 'flex-start',

    backgroundColor: '#E8F5E9',

    paddingHorizontal: 8,

    paddingVertical: 2,

    borderRadius: 4,

    marginTop: 4,

  },

  statusText: {

    fontSize: 10,

    color: '#2E7D32',

    fontWeight: 'bold',

  },

});
 