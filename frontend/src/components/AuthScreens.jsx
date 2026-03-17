import React from "react";

function AuthHeader({ title, subtitle, onBack }) {
  return (
    <>
      <button className="back-btn" onClick={onBack}>Back</button>
      <h2 className="auth-title">{title}</h2>
      <p className="auth-subtitle">{subtitle}</p>
    </>
  );
}

function SocialButtons({ providerStatus, onSocialLogin }) {
  return (
    <div className="social-row">
      <button className="social-btn" type="button" onClick={() => onSocialLogin("google")} disabled={!providerStatus.google}>Google</button>
      <button className="social-btn" type="button" onClick={() => onSocialLogin("github")} disabled={!providerStatus.github}>GitHub</button>
      <button className="social-btn" type="button" onClick={() => onSocialLogin("facebook")} disabled={!providerStatus.facebook}>Facebook</button>
    </div>
  );
}

export function SplashScreen({ brand, onNext }) {
  return (
    <div className="splash-page">
      <div className="splash-card">
        <div className="brand-row">
          <div className="brand-badge">{brand.short}</div>
          <h1>{brand.name}</h1>
        </div>
        <button className="next-page-btn" onClick={onNext}>Next Page</button>
      </div>
    </div>
  );
}

export function LoginScreen({ subtitle, authNotice, loginForm, onLoginChange, onSubmit, onBack, onOpenForgot, onOpenRegister, providerStatus, onSocialLogin }) {
  return (
    <div className="splash-page">
      <div className="auth-card">
        <AuthHeader title="Login Now" subtitle={subtitle} onBack={onBack} />
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Email</label>
          <input placeholder="Email Address" value={loginForm.email} onChange={(e) => onLoginChange("email", e.target.value)} />
          <label>Password</label>
          <input type="password" placeholder="New Password" value={loginForm.password} onChange={(e) => onLoginChange("password", e.target.value)} />
          <div className="auth-row">
            <label className="checkline">
              <input type="checkbox" checked={loginForm.remember} onChange={(e) => onLoginChange("remember", e.target.checked)} />
              Remember Me
            </label>
            <button type="button" className="link-btn" onClick={onOpenForgot}>Forgot Password</button>
          </div>
          <button type="submit" className="primary-auth-btn">Log In</button>
        </form>
        <div className="divider">Or</div>
        <div className="social-auth-block">
          <p className="social-auth-title">Login with Google, GitHub, or Facebook</p>
          <SocialButtons providerStatus={providerStatus} onSocialLogin={onSocialLogin} />
        </div>
        <p className="auth-footer">
          Don&apos;t Have An Account?
          <button className="inline-link" type="button" onClick={onOpenRegister}>Register</button>
        </p>
        {authNotice ? <p className="auth-notice">{authNotice}</p> : null}
      </div>
    </div>
  );
}

export function RegisterScreen({ subtitle, authNotice, registerForm, onRegisterChange, onSubmit, onBack, providerStatus, onSocialLogin }) {
  return (
    <div className="splash-page">
      <div className="auth-card">
        <AuthHeader title="Register Now" subtitle={subtitle} onBack={onBack} />
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Name</label>
          <input placeholder="Full Name" value={registerForm.name} onChange={(e) => onRegisterChange("name", e.target.value)} />
          <label>Email</label>
          <input placeholder="Email Address" value={registerForm.email} onChange={(e) => onRegisterChange("email", e.target.value)} />
          <label>Password</label>
          <input type="password" placeholder="New Password" value={registerForm.password} onChange={(e) => onRegisterChange("password", e.target.value)} />
          <label className="checkline">
            <input type="checkbox" checked={registerForm.terms} onChange={(e) => onRegisterChange("terms", e.target.checked)} />
            I agree to the terms & conditions
          </label>
          <button type="submit" className="primary-auth-btn">Register</button>
        </form>
        <div className="divider">Or</div>
        <div className="social-auth-block">
          <p className="social-auth-title">Register quickly with Google, GitHub, or Facebook</p>
          <SocialButtons providerStatus={providerStatus} onSocialLogin={onSocialLogin} />
        </div>
        {authNotice ? <p className="auth-notice">{authNotice}</p> : null}
      </div>
    </div>
  );
}

export function ForgotScreen({ subtitle, authNotice, forgotEmail, setForgotEmail, onSubmit, onBack, onBackToLogin }) {
  return (
    <div className="splash-page">
      <div className="auth-card">
        <AuthHeader title="Forgot Password" subtitle={subtitle} onBack={onBack} />
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Email</label>
          <input placeholder="Email Address" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
          <button type="submit" className="primary-auth-btn">Send</button>
        </form>
        <div className="divider">Or</div>
        <p className="auth-footer">
          Go Back To
          <button className="inline-link" type="button" onClick={onBackToLogin}>Log In</button>
        </p>
        {authNotice ? <p className="auth-notice">{authNotice}</p> : null}
      </div>
    </div>
  );
}

export function OtpScreen({ subtitle, authNotice, otpDigits, otpTimer, onOtpChange, onSubmit, onBack }) {
  return (
    <div className="splash-page">
      <div className="auth-card">
        <AuthHeader title="Enter Your OTP" subtitle={subtitle} onBack={onBack} />
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="otp-row">
            {otpDigits.map((digit, index) => (
              <input key={index} className="otp-box" value={digit} maxLength={1} inputMode="numeric" onChange={(e) => onOtpChange(index, e.target.value)} />
            ))}
          </div>
          <p className="otp-resend">Resend Code In <span>{otpTimer}</span> Sec</p>
          <button type="submit" className="primary-auth-btn">Verify</button>
        </form>
        {authNotice ? <p className="auth-notice">{authNotice}</p> : null}
      </div>
    </div>
  );
}

export function ResetScreen({ subtitle, authNotice, resetForm, onResetChange, onSubmit, onBack }) {
  return (
    <div className="splash-page">
      <div className="auth-card">
        <AuthHeader title="Reset Password" subtitle={subtitle} onBack={onBack} />
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Password</label>
          <input type="password" placeholder="New Password" value={resetForm.password} onChange={(e) => onResetChange("password", e.target.value)} />
          <label>Password</label>
          <input type="password" placeholder="Confirm Password" value={resetForm.confirmPassword} onChange={(e) => onResetChange("confirmPassword", e.target.value)} />
          <button type="submit" className="primary-auth-btn">Reset Password</button>
        </form>
        {authNotice ? <p className="auth-notice">{authNotice}</p> : null}
      </div>
    </div>
  );
}
