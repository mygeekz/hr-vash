// src/pages/Login.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/ui/auth/LoginForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { post } from '@/lib/http';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);

    try {
      const res = await post('/auth/login', { username, password });

      if (res.token) {
        login(res.token); // ذخیره توکن در Context و LocalStorage
        toast({
          title: "خوش آمدید",
          description: "با موفقیت وارد سیستم شدید.",
        });
        navigate('/dashboard');
      } else {
        throw new Error(res.message || "ورود ناموفق بود، توکن دریافت نشد.");
      }

    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error || error?.message || "مشکلی در ورود به سیستم پیش آمده است.";
      toast({
        title: "خطا در ورود",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return <LoginForm onLogin={handleLogin} isLoading={isLoading} />;
}
