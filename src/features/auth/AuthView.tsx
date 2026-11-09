import { useState, type FormEvent } from 'react';
import { useI18n } from '../../shared/i18n';
import { enterAsGuest, logIn, signUp, type Session } from '../../shared/auth';

type Mode = 'login' | 'signup';

export function AuthView({ onDone, langSwitch }: { onDone: (s: Session) => void; langSwitch: JSX.Element }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(() => {
    try { return location.hash === '#signup' ? 'signup' : 'login'; } catch { return 'login'; }
  });
  const [name, setName] = useState('');
  const [winery, setWinery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function switchTo(m: Mode) {
    setMode(m);
    setError('');
    setPassword('');
    setConfirm('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('Enter a valid email address.', 'შეიყვანე სწორი ელფოსტა.'));
    if (mode === 'signup') {
      if (!name.trim()) return setError(t('Enter your name.', 'შეიყვანე სახელი.'));
      if (password.length < 8) return setError(t('Password must be at least 8 characters.', 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.'));
      if (password !== confirm) return setError(t('Passwords do not match.', 'პაროლები არ ემთხვევა.'));
    } else if (!password) {
      return setError(t('Enter your password.', 'შეიყვანე პაროლი.'));
    }
    setBusy(true);
    const r = mode === 'signup' ? await signUp(name, winery, email, password) : await logIn(email, password);
    setBusy(false);
    if (r === 'exists') return setError(t('An account with this email already exists. Log in instead.', 'ამ ელფოსტით ანგარიში უკვე არსებობს. შედი სისტემაში.'));
    if (r === 'unknown') return setError(t('No account with this email. Sign up first.', 'ამ ელფოსტით ანგარიში ვერ მოიძებნა. ჯერ დარეგისტრირდი.'));
    if (r === 'wrong') return setError(t('Wrong password.', 'პაროლი არასწორია.'));
    onDone(r);
  }

  const isUp = mode === 'signup';

  return (
    <div className="auth">
      <section className="auth-brand" aria-hidden="false">
        <div className="logo">terr<span>oir</span> ◈</div>
        <div>
          <h1 className="auth-claim">{t('Traceability platform for wineries.', 'მიკვლევადობის პლატფორმა მარნებისთვის.')}</h1>
          <ul className="auth-points">
            <li>{t('MyVineyard — plots, bays, field reports and AI advice', 'MyVineyard — ნაკვეთები, ბიჯები, საველე რეპორტები და AI რჩევები')}</li>
            <li>{t('MyCellar — every lot from grape reception to bottling', 'MyCellar — ყოველი ლოტი ყურძნის მიღებიდან ჩამოსხმამდე')}</li>
            <li>{t('Reports for the Wine Agency in one click', 'რეპორტი ღვინის სააგენტოსთვის ერთი დაჭერით')}</li>
          </ul>
        </div>
        <div className="auth-foot">Gurjaani, Kakheti · WINOTHON 2026</div>
      </section>

      <section className="auth-panel">
        <div className="auth-top">{langSwitch}</div>
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="eyebrow">TERROIR</div>
          <h2 className="auth-title">{isUp ? t('Create your account', 'შექმენი ანგარიში') : t('Log in', 'შესვლა')}</h2>
          <p className="muted auth-sub">
            {isUp ? t('Start tracking your wine today.', 'დაიწყე ღვინის აღრიცხვა დღესვე.') : t('Welcome back.', 'კეთილი იყოს შენი დაბრუნება.')}
          </p>

          <div className="auth-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={!isUp} onClick={() => switchTo('login')}>{t('Log in', 'შესვლა')}</button>
            <button type="button" role="tab" aria-selected={isUp} onClick={() => switchTo('signup')}>{t('Sign up', 'რეგისტრაცია')}</button>
          </div>

          {isUp && (
            <>
              <div className="field">
                <label htmlFor="au-name">{t('Full name', 'სახელი და გვარი')}</label>
                <input id="au-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="au-winery">{t('Winery (optional)', 'მარანი (არასავალდებულო)')}</label>
                <input id="au-winery" autoComplete="organization" value={winery} onChange={(e) => setWinery(e.target.value)} />
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="au-email">{t('Email', 'ელფოსტა')}</label>
            <input id="au-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="au-pw">{t('Password', 'პაროლი')}</label>
            <div className="auth-pw">
              <input id="au-pw" type={showPw ? 'text' : 'password'} autoComplete={isUp ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="auth-show" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}>{showPw ? t('Hide', 'დამალვა') : t('Show', 'ჩვენება')}</button>
            </div>
            {isUp && <small className="muted">{t('At least 8 characters.', 'მინიმუმ 8 სიმბოლო.')}</small>}
          </div>
          {isUp && (
            <div className="field">
              <label htmlFor="au-pw2">{t('Repeat password', 'გაიმეორე პაროლი')}</label>
              <input id="au-pw2" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          )}

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? '…' : isUp ? t('Create account', 'ანგარიშის შექმნა') : t('Log in', 'შესვლა')}
          </button>

          <div className="auth-or"><span>{t('or', 'ან')}</span></div>
          <button type="button" className="auth-guest" onClick={() => onDone(enterAsGuest(t('Guest', 'სტუმარი')))}>
            {t('Continue as guest', 'სტუმრად შესვლა')} →
            <small>{t('No registration — explore the demo right away', 'რეგისტრაციის გარეშე — დემოს ნახვა ახლავე')}</small>
          </button>

          <p className="auth-switch muted">
            {isUp ? t('Already have an account?', 'უკვე გაქვს ანგარიში?') : t('New to Terroir?', 'პირველად ხარ Terroir-ზე?')}{' '}
            <button type="button" className="btn-link" onClick={() => switchTo(isUp ? 'login' : 'signup')}>{isUp ? t('Log in', 'შესვლა') : t('Create an account', 'შექმენი ანგარიში')}</button>
          </p>
          <div className="auth-secure" aria-label={t('Data protection', 'მონაცემთა დაცვა')}>
            <div className="auth-secure-head"><span aria-hidden="true">🔒</span> {t('Your data is protected', 'შენი მონაცემები დაცულია')}</div>
            <ul>
              <li>{t('Encrypted HTTPS connection', 'დაშიფრული HTTPS კავშირი')}</li>
              <li>{t('Passwords are never stored in plain text (SHA-256 hash)', 'პაროლი არასდროს ინახება ღია სახით (SHA-256 ჰეში)')}</li>
              <li>{t('Your records stay on your device and are never sold or shared', 'ჩანაწერები რჩება შენს მოწყობილობაზე და არავის გადაეცემა')}</li>
            </ul>
          </div>
        </form>
      </section>
    </div>
  );
}
