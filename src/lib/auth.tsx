// src/lib/auth.ts

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. تعریف ساختار داده‌های کاربر (مطابق با چیزی که در توکن ذخیره شده)
interface User {
  id: string;
  username: string;
  role: 'admin' | 'user' | string; // نقش کاربر را دقیق‌تر تعریف می‌کنیم
}

// 2. تعریف مقادیر و توابع Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean; // برای نمایش وضعیت در حال بارگذاری اولیه
}

// 3. ایجاد Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. کامپوننت Provider که داده‌ها را در کل برنامه به اشتراک می‌گذارد
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // هر زمان توکن تغییر کرد، اطلاعات کاربر را به‌روزرسانی کن
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("توکن نامعتبر است:", error);
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } else {
        setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
  };

  const value = { user, token, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. هوک سفارشی برای استفاده آسان از Context در سایر کامپوننت‌ها
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth باید در داخل یک AuthProvider استفاده شود');
  }
  return context;
};