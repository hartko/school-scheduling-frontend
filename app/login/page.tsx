'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/schemas';
import { Button } from '@/components/ui/Button';
import { School, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (_data: LoginInput) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push('/teachers');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f5f5' }}>
      {/* Left panel — pink */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #e91e8c 0%, #c2185b 60%, #880e4f 100%)' }}>
        {/* Blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)', filter: 'blur(60px)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.2)', filter: 'blur(80px)', transform: 'translate(30%, 30%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{ border: '1px solid rgba(255,255,255,0.15)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full"
          style={{ border: '1px solid rgba(255,255,255,0.10)' }} />

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}>
            <School className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">EduSchedule</h1>
          <p className="text-lg font-light" style={{ color: 'rgba(255,255,255,0.8)' }}>
            School Scheduling System
          </p>
          <div className="mt-10 space-y-3 text-left max-w-xs">
            {['Manage Teachers & Rooms', 'Build Class Schedules', 'Assign Subjects & Sections'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.25)' }}>
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — white form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #e91e8c, #c2185b)' }}>
              <School className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#333' }}>EduSchedule</h1>
          </div>

          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: '#333333' }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: '#9e9e9e' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#bdbdbd' }} />
                <input type="email" className="form-input pl-10" placeholder="admin@school.edu" {...register('email')} />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#bdbdbd' }} />
                <input type="password" className="form-input pl-10" placeholder="••••••••" {...register('password')} />
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #e91e8c 0%, #c2185b 100%)', boxShadow: '0 4px 14px rgba(233,30,140,0.35)' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-center mt-6 font-mono" style={{ color: '#bdbdbd' }}>
            Demo: any email + 6+ char password
          </p>
        </div>
      </div>
    </div>
  );
}
