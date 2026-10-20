import { useState } from 'react';

import {
  ActivityIndicator,

  Alert,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { saveToken, saveUser } from './auth';

export default function LoginPage() {

  const router = useRouter();

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {

    if (!username || !password) {

      Alert.alert('แจ้งเตือน', 'กรุณากรอก Username และ Password');

      return;

    }

    setLoading(true);

    try {

      const response = await fetch('http://119.59.102.161:3102/api/login', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ username, password }),

      });

      const result = await response.json();

      setLoading(false);

      if (response.ok && (result.token || result.success === true || result.success === 'true')) {

        const tokenToSave = result.token || result.accessToken;

        if (tokenToSave) {

          await saveToken(tokenToSave);

          if (result.user) {

            // เก็บข้อมูล user (รวม role) ไว้ในเครื่อง เพื่อใช้เช็คสิทธิ์ แอดมิน/ผู้ใช้ทั่วไป

            await saveUser(result.user);

          }

          router.replace('/');

        } else {

          Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่พบ Token ในระบบหลังบ้าน');

        }

      } else {

        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', result.message || result.error || 'Username หรือ Password ไม่ถูกต้อง');

      }

    } catch (err) {

      setLoading(false);

      console.error(err);

      Alert.alert('Error', 'เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้');

    }

  };

  return (
<View style={styles.container}>
<View style={styles.card}>
<Text style={styles.logo}>🎧</Text>
<Text style={styles.title}>AirPods Store</Text>
<Text style={styles.subtitle}>เข้าสู่ระบบเพื่อจัดการสินค้า</Text>
<TextInput

          style={styles.input}

          placeholder="Username"

          placeholderTextColor="#8e8e93"

          autoCapitalize="none"

          value={username}

          onChangeText={setUsername}

        />
<TextInput

          style={styles.input}

          placeholder="Password"

          placeholderTextColor="#8e8e93"

          secureTextEntry

          value={password}

          onChangeText={setPassword}

        />
<TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>

          {loading ? (
<ActivityIndicator color="#fff" />

          ) : (
<Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>

          )}
</TouchableOpacity>
<TouchableOpacity

          style={styles.registerLink}

          onPress={() => router.push('/register')}
>
<Text style={styles.registerLinkText}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
</TouchableOpacity>
</View>
</View>

  );

}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', padding: 20 },

  card: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', elevation: 4 },

  logo: { fontSize: 40, marginBottom: 8 },

  title: { fontSize: 20, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 4 },

  subtitle: { fontSize: 12, color: '#8e8e93', marginBottom: 24 },

  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14, backgroundColor: '#f9f9f9' },

  loginButton: { width: '100%', backgroundColor: '#007AFF', paddingVertical: 13, borderRadius: 10, alignItems: 'center', marginTop: 6 },

  loginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  registerLink: { marginTop: 18, alignItems: 'center' },

  registerLinkText: { color: '#007AFF', fontSize: 13, fontWeight: '500' },

});
 