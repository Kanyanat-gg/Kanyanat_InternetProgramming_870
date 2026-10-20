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

// ⚠️ ใช้ URL พื้นฐานและ path สำหรับสมัครสมาชิกที่ถูกต้องตาม Backend ของระบบ

const API_REGISTER = 'http://119.59.102.161:3102/api/register';

export default function RegisterPage() {

  const router = useRouter();

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {

    if (!username || !password || !confirmPassword) {

      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');

      return;

    }

    if (password !== confirmPassword) {

      Alert.alert('แจ้งเตือน', 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');

      return;

    }

    setLoading(true);

    try {

      const response = await fetch(API_REGISTER, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ username, password }),

      });

      const result = await response.json();

      setLoading(false);

      if (response.ok && (result.success || response.status === 200 || response.status === 201)) {

        Alert.alert('สำเร็จ', 'สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ', [

          { text: 'ตกลง', onPress: () => router.replace('/login') }

        ]);

      } else {

        Alert.alert('สมัครสมาชิกไม่สำเร็จ', result.message || result.error || 'ไม่สามารถสมัครสมาชิกได้');

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
<Text style={styles.title}>สมัครสมาชิก</Text>
<Text style={styles.subtitle}>สร้างบัญชีเพื่อใช้งาน AirPods Store</Text>
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
<TextInput

          style={styles.input}

          placeholder="Confirm Password"

          placeholderTextColor="#8e8e93"

          secureTextEntry

          value={confirmPassword}

          onChangeText={setConfirmPassword}

        />
<TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>

          {loading ? (
<ActivityIndicator color="#fff" />

          ) : (
<Text style={styles.registerButtonText}>สมัครสมาชิก</Text>

          )}
</TouchableOpacity>

        {/* ปุ่มกลับไปหน้าเข้าสู่ระบบ */}
<TouchableOpacity 

          style={styles.loginLink} 

          onPress={() => router.replace('/login')}
>
<Text style={styles.loginLinkText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
</TouchableOpacity>
</View>
</View>

  );

}

const styles = StyleSheet.create({

  container: { 

    flex: 1, 

    backgroundColor: '#e9ecef', 

    justifyContent: 'center', 

    alignItems: 'center', 

    padding: 20 

  },

  card: { 

    width: '100%', 

    maxWidth: 340, 

    backgroundColor: '#fff', 

    borderRadius: 20, 

    padding: 28, 

    alignItems: 'center', 

    elevation: 4 

  },

  logo: { 

    fontSize: 40, 

    marginBottom: 8 

  },

  title: { 

    fontSize: 20, 

    fontWeight: 'bold', 

    color: '#1c1c1e', 

    marginBottom: 4 

  },

  subtitle: { 

    fontSize: 12, 

    color: '#8e8e93', 

    marginBottom: 24 

  },

  input: { 

    width: '100%', 

    borderWidth: 1, 

    borderColor: '#ddd', 

    borderRadius: 10, 

    paddingHorizontal: 14, 

    paddingVertical: 12, 

    fontSize: 14, 

    marginBottom: 14, 

    backgroundColor: '#f9f9f9' 

  },

  registerButton: { 

    width: '100%', 

    backgroundColor: '#007AFF', 

    paddingVertical: 13, 

    borderRadius: 10, 

    alignItems: 'center', 

    marginTop: 6 

  },

  registerButtonText: { 

    color: '#fff', 

    fontWeight: 'bold', 

    fontSize: 15 

  },

  loginLink: {

    marginTop: 18,

    alignItems: 'center',

  },

  loginLinkText: {

    color: '#007AFF',

    fontSize: 13,

    fontWeight: '500',

  },

});
 