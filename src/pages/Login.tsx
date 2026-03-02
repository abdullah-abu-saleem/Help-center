import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { NoiseOverlay } from '../components/ui/NoiseOverlay';
import { NeuroNetworkCanvas } from '../components/theme/NeuroNetworkCanvas';
import {
  Eye, Mail, Lock, ArrowRight, Command, CheckCircle2,
  QrCode, ScanLine, ChevronRight, Users, School,
  Building2, ArrowLeft, Rocket, ChevronDown, AlertCircle,
} from 'lucide-react';

// --- BRAND COLORS ---
const COLORS = {
  primary: '#ed3b91',
  secondary: '#08b8fb',
  neutral: '#091e42',
  neutralLight: '#6882a9',
  error: '#ef4444',
};

// --- DATA: Country Codes ---
const COUNTRY_CODES = [
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'USA' },
  { code: 'UK', dial: '+44',  flag: '🇬🇧', name: 'UK' },
];

// --- COMPONENT: Spotlight Input ---
const SpotlightInput = ({
  children,
  className = '',
  as: Component = 'div',
  onClick,
  hasError = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: any;
  onClick?: () => void;
  hasError?: boolean;
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Component
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => setOpacity(1)}
      onBlur={() => setOpacity(0)}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden bg-white border transition-all duration-300 ${
        hasError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
      } group ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(8, 184, 251, 0.05), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${
            hasError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(8, 184, 251, 0.5)'
          }, transparent 40%)`,
          maskImage: 'linear-gradient(#fff, #fff)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor' as any,
          padding: '1px',
        }}
      />
      <div className="relative h-full">{children}</div>
    </Component>
  );
};

type AuthView = 'login' | 'register-select' | 'register-create' | 'register-join' | 'email-confirmation' | 'forgot-password';

export default function Login() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const { locale, setLocale } = useI18n();

  // Navigation State
  const [view, setView] = useState<AuthView>('login');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classCode, setClassCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'code' | 'qr'>('email');
  const [loginError, setLoginError] = useState('');

  // Register Fields
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { setMounted(true); }, []);

  // Redirect if already logged in
  const getRedirect = (role: string) => {
    const r = role.toLowerCase().trim();
    return r === 'teacher' || r === 'admin' ? '/teacher/dashboard' : '/help';
  };

  useEffect(() => {
    if (user) navigate(getRedirect(user.role), { replace: true });
  }, [user, navigate]);

  // --- Login Handler (real auth) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (!result.success) {
        setLoginError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Register Handler (real auth) ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) { newErrors.name = 'Name is required.'; }
    if (regPassword.length < 6) { newErrors.password = 'Password must be at least 6 characters.'; }
    if (regPassword !== regConfirmPassword) { newErrors.password = 'Passwords do not match.'; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(regEmail.trim().toLowerCase(), regPassword, fullName.trim());
      if (!result.success) {
        setErrors({ email: result.error || 'Registration failed.' });
      } else {
        changeView('email-confirmation');
      }
    } catch (err: any) {
      setErrors({ email: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Forgot Password Handler ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}${window.location.pathname}#/login`,
      });
      setForgotSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const changeView = (newView: AuthView) => {
    setView(newView);
    setErrors({});
    setLoginError('');
  };

  const lang = locale === 'en-US' ? 'en' : 'ar';

  return (
    <div className="min-h-[100dvh] w-full flex font-sans bg-white text-[#091e42] selection:bg-[#08b8fb]/20 overflow-hidden relative">
      <NoiseOverlay />

      <style>{`
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-entry { animation: fadeScale 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-scan { animation: scan 3s linear infinite; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      <div className="flex w-full h-full">

        {/* --- LEFT SIDE: Form Container --- */}
        <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col px-8 sm:px-12 lg:px-16 relative z-20 bg-white border-r border-slate-100 h-screen overflow-y-auto custom-scrollbar">

          {/* HEADER */}
          <div className="w-full flex items-center justify-between pt-8 pb-4 mb-auto shrink-0">
            <img
              src="https://string.education/assets/Logo-fhKqX0L9.svg"
              alt="String Logo"
              className="h-10 w-auto cursor-pointer"
              onClick={() => changeView('login')}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocale(locale === 'en-US' ? 'ar-AR' : 'en-US')}
                className="text-xs font-bold text-[#091e42] hover:text-[#08b8fb] w-6 text-center"
              >
                {lang === 'en' ? 'ع' : 'EN'}
              </button>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className={`w-full max-w-[380px] mx-auto transition-all duration-700 my-auto py-8 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* ═══════════ LOGIN VIEW ═══════════ */}
            {view === 'login' && (
              <>
                <div className="mb-8 animate-entry">
                  <h1 className="text-3xl font-bold tracking-tight text-[#091e42] mb-2">Welcome back</h1>
                  <p className="text-[#6882a9] text-sm">Enter your details to access your workspace.</p>
                </div>

                {loginError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2 animate-entry">
                    <AlertCircle size={16} /> {loginError}
                  </div>
                )}

                <div className="min-h-[280px]">
                  {loginMethod === 'email' && (
                    <form onSubmit={handleLogin} className="space-y-4 animate-entry delay-100">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#6882a9] ml-1">Email Address</label>
                        <SpotlightInput>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6882a9]"><Mail size={16} /></div>
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-[#091e42] pl-10 pr-4 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="name@string.education" />
                        </SpotlightInput>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                          <label className="text-xs font-semibold text-[#6882a9]">Password</label>
                          <button type="button" onClick={() => changeView('forgot-password')} className="text-xs font-bold text-[#08b8fb] hover:underline">Forgot?</button>
                        </div>
                        <SpotlightInput>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6882a9]"><Lock size={16} /></div>
                          <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-[#091e42] pl-10 pr-10 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="Enter password" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6882a9] hover:text-[#091e42]"><Eye size={16} /></button>
                        </SpotlightInput>
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full bg-[#ed3b91] hover:bg-[#d6257a] text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 text-sm">
                        {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Log In <ArrowRight size={16} /></>}
                      </button>
                    </form>
                  )}

                  {loginMethod === 'code' && (
                    <div className="space-y-6 animate-entry">
                      <div className="text-center space-y-2">
                        <h3 className="text-[#091e42] font-bold text-lg">Enter Class Code</h3>
                        <p className="text-xs text-[#6882a9]">Ask your teacher for the 6-character code.</p>
                      </div>
                      <div className="relative group">
                        <SpotlightInput className="border-2 group-focus-within:border-[#08b8fb] transition-colors">
                          <input type="text" maxLength={6} value={classCode} onChange={(e) => setClassCode(e.target.value.toUpperCase())} className="w-full bg-transparent text-[#091e42] py-4 text-center rounded-xl outline-none font-mono text-3xl font-bold tracking-[0.5em] uppercase placeholder:text-[#6882a9]/20" placeholder="······" />
                        </SpotlightInput>
                      </div>
                      <button className="w-full bg-[#091e42] hover:bg-[#08b8fb] text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.99] flex items-center justify-center gap-2">
                        Join Class <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {loginMethod === 'qr' && (
                    <div className="animate-entry flex flex-col items-center space-y-6">
                      <div className="text-center space-y-1">
                        <h3 className="text-[#091e42] font-bold text-lg">Scan QR Badge</h3>
                        <p className="text-xs text-[#6882a9]">Hold your badge up to the camera.</p>
                      </div>
                      <div className="relative w-64 h-64 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-slate-50">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scan z-10"></div>
                        <div className="absolute inset-0 flex items-center justify-center"><QrCode className="text-white/20 w-24 h-24" /></div>
                      </div>
                      <button className="text-sm font-semibold text-[#091e42] hover:text-[#ed3b91] flex items-center gap-2 transition-colors bg-slate-50 px-4 py-2 rounded-full border border-slate-100 hover:border-slate-200">
                        <ScanLine size={16} /> Allow Camera Access
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-6 text-xs font-medium text-[#6882a9] mt-6 animate-entry delay-200">
                  <button onClick={() => setLoginMethod('email')} className={`hover:text-[#08b8fb] transition-colors ${loginMethod === 'email' ? 'text-[#08b8fb] underline underline-offset-4' : ''}`}>Email Login</button>
                  <button onClick={() => setLoginMethod('code')} className={`hover:text-[#08b8fb] transition-colors ${loginMethod === 'code' ? 'text-[#08b8fb] underline underline-offset-4' : ''}`}>Class Code</button>
                  <button onClick={() => setLoginMethod('qr')} className={`hover:text-[#08b8fb] transition-colors ${loginMethod === 'qr' ? 'text-[#08b8fb] underline underline-offset-4' : ''}`}>QR Badge</button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between animate-entry delay-300">
                  <span className="text-xs text-[#6882a9]">Or continue with</span>
                  <div className="flex gap-2">
                    <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:border-[#08b8fb] hover:bg-[#f0f9ff] transition-all group">
                      <svg className="w-4 h-4 text-[#091e42] group-hover:text-[#08b8fb] fill-current" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:border-[#08b8fb] hover:bg-[#f0f9ff] transition-all group">
                      <div className="w-4 h-4 grid grid-cols-2 gap-0.5"><div className="bg-[#091e42] group-hover:bg-[#08b8fb]" /><div className="bg-[#091e42] group-hover:bg-[#08b8fb]" /><div className="bg-[#091e42] group-hover:bg-[#08b8fb]" /><div className="bg-[#091e42] group-hover:bg-[#08b8fb]" /></div>
                    </button>
                  </div>
                </div>

                <div className="mt-6 text-center animate-entry delay-300">
                  <p className="text-xs text-[#6882a9]">New to String? <button onClick={() => changeView('register-select')} className="font-bold text-[#ed3b91] hover:underline">Register</button></p>
                </div>
              </>
            )}

            {/* ═══════════ FORGOT PASSWORD VIEW ═══════════ */}
            {view === 'forgot-password' && (
              <div className="animate-entry">
                <button onClick={() => changeView('login')} className="flex items-center gap-1 text-[#6882a9] hover:text-[#091e42] text-xs font-semibold mb-6 transition-colors">
                  <ArrowLeft size={14} /> Back to Login
                </button>

                {!forgotSubmitted ? (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight text-[#091e42] mb-2">Reset password</h1>
                    <p className="text-[#6882a9] text-sm mb-8">Enter your email and we'll send you a reset link.</p>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#6882a9] ml-1">Email Address</label>
                        <SpotlightInput>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6882a9]"><Mail size={16} /></div>
                          <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full bg-transparent text-[#091e42] pl-10 pr-4 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="name@string.education" />
                        </SpotlightInput>
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full bg-[#ed3b91] hover:bg-[#d6257a] text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 text-sm">
                        {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send Reset Link <ArrowRight size={16} /></>}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center pt-4">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500">
                      <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#091e42] mb-3">Check your email</h1>
                    <p className="text-[#6882a9] text-sm leading-relaxed mb-8 max-w-[280px]">
                      We've sent password reset instructions to <span className="font-semibold text-[#091e42]">{forgotEmail}</span>.
                    </p>
                    <button onClick={() => { changeView('login'); setForgotSubmitted(false); }} className="text-sm font-semibold text-[#08b8fb] hover:underline">
                      Back to Login
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════ REGISTER SELECTION ═══════════ */}
            {view === 'register-select' && (
              <div className="animate-entry">
                <button onClick={() => changeView('login')} className="flex items-center gap-1 text-[#6882a9] hover:text-[#091e42] text-xs font-semibold mb-6 transition-colors">
                  <ArrowLeft size={14} /> Back to Login
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-[#091e42] mb-2">Create Account</h1>
                <p className="text-[#6882a9] text-sm mb-8">How will you be using String?</p>

                <div className="space-y-4">
                  <SpotlightInput as="button" onClick={() => changeView('register-create')} className="w-full text-left p-5 hover:border-[#ed3b91]/30 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#ed3b91]/10 flex items-center justify-center shrink-0 text-[#ed3b91]">
                        <School size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#091e42] text-sm mb-1">Create a New School</h3>
                        <p className="text-xs text-[#6882a9] leading-relaxed">I am an <span className="text-[#091e42] font-semibold">Admin or Teacher</span> setting up a new String workspace.</p>
                      </div>
                      <ChevronRight size={16} className="text-[#6882a9] ml-auto mt-1" />
                    </div>
                  </SpotlightInput>

                  <SpotlightInput as="button" onClick={() => changeView('register-join')} className="w-full text-left p-5 hover:border-[#08b8fb]/30 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#08b8fb]/10 flex items-center justify-center shrink-0 text-[#08b8fb]">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#091e42] text-sm mb-1">Join an Existing School</h3>
                        <p className="text-xs text-[#6882a9] leading-relaxed">I am a <span className="text-[#091e42] font-semibold">Student or Teacher</span> joining a school on String.</p>
                      </div>
                      <ChevronRight size={16} className="text-[#6882a9] ml-auto mt-1" />
                    </div>
                  </SpotlightInput>
                </div>
              </div>
            )}

            {/* ═══════════ REGISTER: CREATE NEW ORG ═══════════ */}
            {view === 'register-create' && (
              <div className="animate-entry pb-12">
                <button onClick={() => changeView('register-select')} className="flex items-center gap-1 text-[#6882a9] hover:text-[#091e42] text-xs font-semibold mb-6 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
                <h1 className="text-2xl font-bold tracking-tight text-[#091e42] mb-2">Start your journey</h1>
                <p className="text-[#6882a9] text-sm mb-6">Create a workspace for your organization.</p>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Organization Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6882a9] ml-1">School / Organization Name <span className="text-[#ed3b91]">*</span></label>
                    <SpotlightInput>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6882a9]"><Building2 size={16} /></div>
                      <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)} className="w-full bg-transparent text-[#091e42] pl-10 pr-4 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="e.g. Al-Khader Schools" />
                    </SpotlightInput>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6882a9] ml-1">Full Name <span className="text-[#ed3b91]">*</span></label>
                    <SpotlightInput hasError={!!errors.name}>
                      <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent text-[#091e42] px-4 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="Enter name" />
                    </SpotlightInput>
                    {errors.name && <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 pl-1"><AlertCircle size={10} /> {errors.name}</p>}
                  </div>

                  {/* Work Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6882a9] ml-1">Work Email <span className="text-[#ed3b91]">*</span></label>
                    <SpotlightInput hasError={!!errors.email}>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6882a9]"><Mail size={16} /></div>
                      <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-transparent text-[#091e42] pl-10 pr-4 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="admin@school.edu" />
                    </SpotlightInput>
                    {errors.email && <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 pl-1"><AlertCircle size={10} /> {errors.email}</p>}
                  </div>

                  {/* Phone with Country Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6882a9] ml-1">Your Phone <span className="text-[#ed3b91]">*</span></label>
                    <div className="flex gap-2">
                      <div className="relative w-28 shrink-0">
                        <SpotlightInput className="h-full" as="div">
                          <button type="button" onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)} className="w-full h-full flex items-center justify-between px-3 bg-transparent text-[#091e42] text-sm font-medium outline-none py-3">
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span>{selectedCountry.dial}</span>
                            <ChevronDown size={14} className="text-[#6882a9]" />
                          </button>
                        </SpotlightInput>
                        {isCountryDropdownOpen && (
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-entry py-1">
                            {COUNTRY_CODES.map((country) => (
                              <button key={country.code} type="button" onClick={() => { setSelectedCountry(country); setIsCountryDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left">
                                <span className="text-lg">{country.flag}</span>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-[#091e42]">{country.name}</span>
                                  <span className="text-[10px] text-[#6882a9]">{country.dial}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grow">
                        <SpotlightInput hasError={!!errors.phone}>
                          <input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full bg-transparent text-[#091e42] px-4 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="79 000 0000" />
                        </SpotlightInput>
                      </div>
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 pl-1"><AlertCircle size={10} /> {errors.phone}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6882a9] ml-1">Password <span className="text-[#ed3b91]">*</span></label>
                    <SpotlightInput hasError={!!errors.password}>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6882a9]"><Lock size={16} /></div>
                      <input type={showRegPassword ? 'text' : 'password'} required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-transparent text-[#091e42] pl-10 pr-10 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="••••••••••••" />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6882a9] hover:text-[#091e42]"><Eye size={16} /></button>
                    </SpotlightInput>
                  </div>

                  {/* Retype Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6882a9] ml-1">Retype Password <span className="text-[#ed3b91]">*</span></label>
                    <SpotlightInput hasError={!!errors.password}>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6882a9]"><Lock size={16} /></div>
                      <input type="password" required value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className="w-full bg-transparent text-[#091e42] pl-10 pr-4 py-3 rounded-xl outline-none placeholder:text-[#6882a9]/60 text-sm font-medium" placeholder="Retype password" />
                    </SpotlightInput>
                    {errors.password && <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 pl-1"><AlertCircle size={10} /> {errors.password}</p>}
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full bg-[#ed3b91] hover:bg-[#d6257a] text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 text-sm mt-4">
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Workspace <Rocket size={16} /></>}
                  </button>
                  <p className="text-[10px] text-[#6882a9] text-center px-4">By clicking create, you agree to our Terms of Service and Privacy Policy.</p>
                </form>
              </div>
            )}

            {/* ═══════════ EMAIL CONFIRMATION ═══════════ */}
            {view === 'email-confirmation' && (
              <div className="animate-entry flex flex-col items-center text-center pt-8">
                <div className="w-20 h-20 bg-[#ed3b91]/10 rounded-full flex items-center justify-center mb-6 text-[#ed3b91]">
                  <Mail size={40} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#091e42] mb-3">Check your inbox</h1>
                <p className="text-[#6882a9] text-sm leading-relaxed mb-8 max-w-[280px]">
                  We've sent a confirmation link to <span className="font-semibold text-[#091e42]">{regEmail}</span>. Please verify your email to start using String.
                </p>
                <div className="space-y-3 w-full">
                  <button className="w-full bg-[#091e42] hover:bg-[#08b8fb] text-white font-semibold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm">
                    Open Email App
                  </button>
                  <button onClick={() => changeView('login')} className="w-full text-[#6882a9] hover:text-[#091e42] font-semibold py-3 text-sm">
                    Back to Login
                  </button>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 w-full">
                  <p className="text-xs text-[#6882a9]">Didn't receive it? <button className="text-[#ed3b91] font-bold hover:underline">Resend Email</button></p>
                </div>
              </div>
            )}

            {/* ═══════════ JOIN EXISTING ═══════════ */}
            {view === 'register-join' && (
              <div className="animate-entry">
                <button onClick={() => changeView('register-select')} className="flex items-center gap-1 text-[#6882a9] hover:text-[#091e42] text-xs font-semibold mb-6 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center space-y-4 mb-8">
                  <div className="w-16 h-16 bg-[#f0f9ff] rounded-full flex items-center justify-center mx-auto text-[#08b8fb]">
                    <Mail size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#091e42] mb-2">Check your invite</h1>
                    <p className="text-[#6882a9] text-sm leading-relaxed">
                      To join an existing school, you need an <strong>Invite Link</strong> or a <strong>Class Code</strong> from your administrator or teacher.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button onClick={() => { changeView('login'); setLoginMethod('code'); }} className="w-full bg-[#091e42] hover:bg-[#08b8fb] text-white font-semibold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm">
                    I have a Class Code
                  </button>
                  <button className="w-full bg-white border border-slate-200 hover:border-[#ed3b91] hover:text-[#ed3b91] text-[#6882a9] font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                    I need to find my school
                  </button>
                </div>
              </div>
            )}

          </div>
          <div className="pb-4 shrink-0"></div>
        </div>

        {/* --- RIGHT SIDE: Art Panel --- */}
        <div className="hidden lg:flex lg:w-[60%] xl:w-[65%] relative bg-[#F8FAFC] overflow-hidden flex-col items-center justify-center p-12 h-screen">
          <div className="absolute inset-0 opacity-[0.6]" style={{ backgroundImage: `linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)`, backgroundSize: '50px 50px' }}></div>
          <NeuroNetworkCanvas />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/60 pointer-events-none" />

          <div className="relative z-10 w-full max-w-xl space-y-10 transition-all duration-500">
            <div className="space-y-6">
              <div className={`w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center ring-1 ring-slate-100 animate-entry ${view !== 'login' ? 'text-[#08b8fb]' : 'text-[#ed3b91]'}`}>
                {view !== 'login' ? <Rocket className="w-8 h-8" /> : <Command className="w-8 h-8" />}
              </div>

              {view !== 'login' ? (
                <h2 className="text-5xl xl:text-6xl font-bold text-[#091e42] tracking-tight leading-[1.1] animate-entry delay-100">
                  Join the <span className="text-[#08b8fb]">education revolution</span> today.
                </h2>
              ) : (
                <h2 className="text-5xl xl:text-6xl font-bold text-[#091e42] tracking-tight leading-[1.1] animate-entry delay-100">
                  The <span className="text-[#ed3b91]">operating system</span> for modern education.
                </h2>
              )}
            </div>

            {/* Testimonial Card */}
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 pr-10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5 transform transition-all hover:scale-[1.01] animate-entry delay-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-tr from-[#ed3b91] to-[#d6257a] p-0.5">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <span className="font-bold text-[#ed3b91] text-sm">
                      {view === 'login' ? 'DA' : 'MD'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {view === 'login' ? (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#091e42] text-lg">Dr. Jihad Al-Kiswani</h4>
                          <CheckCircle2 size={16} className="text-[#08b8fb] fill-[#08b8fb]/10" />
                        </div>
                        <p className="text-sm text-[#6882a9] font-medium">Principal, Al-Khader Schools</p>
                      </div>
                      <p className="text-lg text-[#091e42] leading-relaxed font-medium">
                        "String isn't just a 'better LMS'—it's a whole new category. It allowed us to stop paying for 9 different tools, gave our teachers back 10 hours a week, and doubled our student engagement."
                      </p>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#091e42] text-lg">Maha Darwish</h4>
                          <CheckCircle2 size={16} className="text-[#08b8fb] fill-[#08b8fb]/10" />
                        </div>
                        <p className="text-sm text-[#6882a9] font-medium">CEO, Inbdaa Foundation for Talented Students</p>
                      </div>
                      <p className="text-lg text-[#091e42] leading-relaxed font-medium">
                        "String empowers us to identify and nurture potential like never before. It's not just a tool; it's a partner in shaping the future of our most talented students."
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 opacity-80 animate-entry delay-300">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#6882a9] bg-white/50 px-3 py-1 rounded-full border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#ed3b91]" /> 99.9% Uptime
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-[#6882a9] bg-white/50 px-3 py-1 rounded-full border border-slate-200">
                <Command size={12} /> SOC2 Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
