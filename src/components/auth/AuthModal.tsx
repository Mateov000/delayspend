import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { useToastStore } from '../../store/useToastStore';
import { STRINGS } from '../../constants/strings';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Cloud, Lock, Mail, LogOut, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, signIn, signUp, signOut, isLoading } = useAuthStore();
  const { status, syncAllWithCloud } = useSyncStore();
  const { showToast } = useToastStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Por favor completá todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'signin') {
      const { error } = await signIn(cleanEmail, password);
      if (error) {
        setErrorMsg(error.message || STRINGS.AUTH_ERROR_GENERIC);
      } else {
        showToast(STRINGS.AUTH_SUCCESS_LOGIN, 'success');
        onClose();
      }
    } else {
      const { error } = await signUp(cleanEmail, password);
      if (error) {
        if (error.message && error.message.includes('ya está registrado')) {
          setMode('signin');
          setErrorMsg('Esta cuenta ya existe. Por favor ingresá tu contraseña para iniciar sesión.');
        } else {
          setErrorMsg(error.message || STRINGS.AUTH_ERROR_GENERIC);
        }
      } else {
        showToast(STRINGS.AUTH_SUCCESS_LOGIN, 'success');
        onClose();
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    showToast(STRINGS.AUTH_SUCCESS_LOGOUT, 'info');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Sincronización en la Nube' : mode === 'signin' ? STRINGS.AUTH_TITLE_SIGNIN : STRINGS.AUTH_TITLE_SIGNUP}
    >
      <div className="flex flex-col gap-4">
        {/* Caso 1: Usuario ya autenticado */}
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-emerald-600">Dispositivo vinculado</span>
                <span className="text-sm font-bold text-slate-900 truncate">{user.email}</span>
                <span className="text-[11px] text-emerald-700 mt-0.5">
                  Estado: {status === 'synced' ? '🟢 Sincronizado en tiempo real' : '🔄 Sincronizando...'}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                syncAllWithCloud(user.id);
                showToast('Forzando sincronización...', 'info');
              }}
              className="flex items-center justify-center gap-2"
            >
              <Cloud className="w-4 h-4" />
              <span>Forzar sincronización ahora</span>
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="md"
              fullWidth
              onClick={handleLogout}
              className="flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{STRINGS.AUTH_BUTTON_LOGOUT}</span>
            </Button>
          </div>
        ) : (
          /* Caso 2: Formulario de Inicio de Sesión / Registro */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-950 text-xs">
              <Cloud className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>{STRINGS.AUTH_SUBTITLE}</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{STRINGS.AUTH_EMAIL_LABEL}</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>{STRINGS.AUTH_PASSWORD_LABEL}</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold mt-1"
            >
              {isLoading
                ? 'Procesando...'
                : mode === 'signin'
                ? STRINGS.AUTH_BUTTON_SIGNIN
                : STRINGS.AUTH_BUTTON_SIGNUP}
            </Button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setMode(mode === 'signin' ? 'signup' : 'signin');
              }}
              className="text-xs text-center text-indigo-600 hover:text-indigo-800 font-semibold py-1 transition-colors cursor-pointer"
            >
              {mode === 'signin' ? STRINGS.AUTH_SWITCH_TO_SIGNUP : STRINGS.AUTH_SWITCH_TO_SIGNIN}
            </button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}

