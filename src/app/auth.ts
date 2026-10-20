import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

const USER_KEY = 'auth_user';

export interface AuthUser {

  id: string | number;

  username: string;

  role: string;

}

export async function saveToken(token: string) {

  await AsyncStorage.setItem(TOKEN_KEY, token);

}

export async function getToken(): Promise<string | null> {

  return AsyncStorage.getItem(TOKEN_KEY);

}

export async function saveUser(user: AuthUser) {

  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

}

export async function getUser(): Promise<AuthUser | null> {

  const raw = await AsyncStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {

    return JSON.parse(raw) as AuthUser;

  } catch {

    return null;

  }

}

export async function clearToken() {

  await AsyncStorage.removeItem(TOKEN_KEY);

  await AsyncStorage.removeItem(USER_KEY);

}
 