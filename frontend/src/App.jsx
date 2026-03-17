import React from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { getAddress, isConnected, requestAccess } from "@stellar/freighter-api";
import { AdminPage } from "./components/AdminPage";
import {
  ForgotScreen,
  LoginScreen,
  OtpScreen,
  RegisterScreen,
  ResetScreen,
  SplashScreen
} from "./components/AuthScreens";
import {
  ApplyJobScreen,
  BottomNav,
  FilterScreen,
  HomeScreen,
  NotificationsScreen,
  PostJobScreen,
  ProfileScreen,
  SearchScreen
} from "./components/AppScreens";
import { useSiteContent } from "./hooks/useSiteContent";
import { createContractClient, parseContractOutputValue } from "./lib/contract";

const API_BASE = "http://localhost:4000/api";

function isStellarPublicKey(address) {
  const value = String(address || "").trim();
  return /^G[A-Z2-7]{55}$/.test(value);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

const contractClient = createContractClient(API_BASE);

function AppInner() {
  const { content, saveContent, resetContent, isReady } = useSiteContent();
  const location = useLocation();
  const navigate = useNavigate();

  const [page, setPage] = React.useState("splash");
  const [appTab, setAppTab] = React.useState("home");
  const [currentUser, setCurrentUser] = React.useState({ name: "Antonio", email: "" });
  const [providerStatus, setProviderStatus] = React.useState({ google: false, github: false, facebook: false });
  const [authNotice, setAuthNotice] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState("");
  const [walletStatus, setWalletStatus] = React.useState("Wallet not connected");
  const [result, setResult] = React.useState("");

  const [loginForm, setLoginForm] = React.useState({ email: "", password: "", remember: true });
  const [registerForm, setRegisterForm] = React.useState({ name: "", email: "", password: "", terms: true });
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [otpDigits, setOtpDigits] = React.useState(["", "", "", ""]);
  const [otpTimer, setOtpTimer] = React.useState(20);
  const [resetForm, setResetForm] = React.useState({ password: "", confirmPassword: "" });
  const [postForm, setPostForm] = React.useState({
    title: "",
    nature: "Full Time",
    location: "Select A Country",
    experience: "Select An Experience",
    level: "Entry Level",
    model: "Remote",
    salary: "",
    description: ""
  });
  const [selectedJob, setSelectedJob] = React.useState(null);
  const [applyForm, setApplyForm] = React.useState({
    jobId: "",
    coverLetter: "I am excited to apply for this role.",
    resumeLink: "https://example.com/resume.pdf"
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterForm, setFilterForm] = React.useState({
    location: "",
    sortBy: "Most Recent",
    jobNature: "",
    salaryMin: "0",
    salaryMax: "999999"
  });

  React.useEffect(() => {
    setFilterForm({
      location: content.filter?.location || "",
      sortBy: content.filter?.sortBy || "Most Recent",
      jobNature: content.filter?.jobNature || "",
      salaryMin: String(content.filter?.salaryMin ?? 0),
      salaryMax: String(content.filter?.salaryMax ?? 999999)
    });
  }, [content.filter]);

  const allJobs = React.useMemo(() => {
    const merged = [
      ...(content.home?.popularJobs || []),
      ...(content.home?.recentJobs || []),
      ...(content.search?.recentView || [])
    ];

    const unique = [];
    const seen = new Set();

    merged.forEach((job) => {
      const key = `${job.company || "Unknown"}-${job.role || "Role"}-${job.location || "Location"}`;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push({
        ...job,
        id: job.id || unique.length + 1,
        tags: Array.isArray(job.tags) ? job.tags : []
      });
    });

    return unique;
  }, [content.home, content.search]);

  const filteredJobs = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const minSalary = Number(filterForm.salaryMin) || 0;
    const maxSalary = Number(filterForm.salaryMax) || Number.MAX_SAFE_INTEGER;
    const location = filterForm.location.trim().toLowerCase();
    const nature = filterForm.jobNature.trim().toLowerCase();

    return allJobs.filter((job) => {
      const salaryNumber = Number(String(job.salary || "0").replace(/[^\d.-]/g, "")) || 0;
      const text = `${job.company || ""} ${job.role || ""} ${job.location || ""} ${(job.tags || []).join(" ")}`.toLowerCase();

      const queryMatch = !query || text.includes(query);
      const locationMatch = !location || String(job.location || "").toLowerCase().includes(location);
      const natureMatch = !nature || (job.tags || []).some((tag) => String(tag).toLowerCase().includes(nature));
      const salaryMatch = salaryNumber >= minSalary && salaryNumber <= maxSalary;

      return queryMatch && locationMatch && natureMatch && salaryMatch;
    });
  }, [allJobs, filterForm, searchQuery]);

  React.useEffect(() => {
    if (location.pathname !== "/auth/callback") return;

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const data = params.get("data");
    const message = params.get("message");

    if (status === "success" && data) {
      try {
        const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
        const decoded = JSON.parse(window.atob(padded));

        setCurrentUser({ name: decoded?.profile?.name || "User", email: decoded?.profile?.email || "" });
        setAuthNotice(`${decoded.provider} login successful.`);
        setPage("app");
      } catch {
        setAuthNotice("Login completed but profile parsing failed.");
        setPage("login");
      }
    } else {
      setAuthNotice(message || "Social login failed.");
      setPage("login");
    }

    navigate("/", { replace: true });
  }, [location.pathname, navigate]);

  React.useEffect(() => {
    if (!["login", "register"].includes(page)) return;

    apiRequest("/auth/providers")
      .then((response) => setProviderStatus(response.providers || { google: false, github: false, facebook: false }))
      .catch(() => setProviderStatus({ google: false, github: false, facebook: false }));
  }, [page]);

  React.useEffect(() => {
    if (page !== "otp" || otpTimer <= 0) return undefined;
    const timer = window.setTimeout(() => setOtpTimer((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [page, otpTimer]);

  const onLoginChange = (field, value) => setLoginForm((prev) => ({ ...prev, [field]: value }));
  const onRegisterChange = (field, value) => setRegisterForm((prev) => ({ ...prev, [field]: value }));
  const onResetChange = (field, value) => setResetForm((prev) => ({ ...prev, [field]: value }));
  const onPostChange = (field, value) => setPostForm((prev) => ({ ...prev, [field]: value }));
  const onApplyChange = (field, value) => setApplyForm((prev) => ({ ...prev, [field]: value }));
  const onFilterChange = (field, value) => setFilterForm((prev) => ({ ...prev, [field]: value }));

  const goToPage = (nextPage) => {
    setAuthNotice("");
    setPage(nextPage);
  };

  const socialLogin = (provider) => {
    if (!providerStatus[provider]) {
      setAuthNotice(`${provider} login is not configured in backend yet.`);
      return;
    }
    const redirect = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `${API_BASE}/auth/${provider}/start?redirect=${redirect}`;
  };

  const submitLogin = (event) => {
    event.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setAuthNotice("Enter email and password.");
      return;
    }

    setCurrentUser({ name: loginForm.email.split("@")[0] || "User", email: loginForm.email });
    setPage("app");
    setAppTab("home");
  };

  const submitRegister = (event) => {
    event.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setAuthNotice("Fill all registration fields.");
      return;
    }
    if (!registerForm.terms) {
      setAuthNotice("Please accept terms and conditions.");
      return;
    }
    setLoginForm((prev) => ({ ...prev, email: registerForm.email }));
    setAuthNotice("Registration complete. Please login.");
    setPage("login");
  };

  const submitForgot = (event) => {
    event.preventDefault();
    if (!forgotEmail) {
      setAuthNotice("Enter your email to reset password.");
      return;
    }
    setOtpDigits(["", "", "", ""]);
    setOtpTimer(20);
    setPage("otp");
  };

  const onOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = cleanValue;
      return next;
    });
  };

  const submitOtp = (event) => {
    event.preventDefault();
    if (otpDigits.some((digit) => !digit)) {
      setAuthNotice("Please enter all 4 OTP digits.");
      return;
    }
    setPage("reset");
  };

  const submitReset = (event) => {
    event.preventDefault();
    if (!resetForm.password || !resetForm.confirmPassword) {
      setAuthNotice("Enter new and confirm password.");
      return;
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      setAuthNotice("Passwords do not match.");
      return;
    }
    setAuthNotice("Password reset successful. Please login.");
    setPage("login");
  };

  const connectWallet = async () => {
    setWalletStatus("Connecting...");
    try {
      const connected = await isConnected();
      if (connected.error) {
        setWalletStatus(connected.error);
        return;
      }

      if (!connected.isConnected) {
        const access = await requestAccess();
        if (access.error) {
          setWalletStatus(access.error);
          return;
        }
      }

      const addressResult = await getAddress();
      if (addressResult.error) {
        setWalletStatus(addressResult.error);
        return;
      }
      setWalletAddress(addressResult.address);
      setWalletStatus("Wallet connected");
    } catch (error) {
      setWalletStatus(`Wallet error: ${error.message}`);
    }
  };

  const onWalletAddressChange = (value) => {
    setWalletAddress(value.trim());
  };

  const useManualWalletAddress = () => {
    if (!isStellarPublicKey(walletAddress)) {
      setWalletStatus("Invalid wallet address. Use a Stellar public key starting with G.");
      return;
    }

    setWalletStatus("Manual wallet address set");
  };

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/health");
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSelectJobForApply = (job) => {
    setSelectedJob(job);
    setApplyForm((prev) => ({ ...prev, jobId: String(job.id || "") }));
    setAppTab("apply");
  };

  const applyFilter = () => {
    setResult(`Filter applied. Matching jobs: ${filteredJobs.length}`);
    setAppTab("search");
  };

  const resetFilter = () => {
    setFilterForm({
      location: content.filter?.location || "",
      sortBy: content.filter?.sortBy || "Most Recent",
      jobNature: content.filter?.jobNature || "",
      salaryMin: String(content.filter?.salaryMin ?? 0),
      salaryMax: String(content.filter?.salaryMax ?? 999999)
    });
    setSearchQuery("");
    setResult("Filters reset.");
  };

  const submitJobApply = async (event) => {
    event.preventDefault();

    if (!applyForm.jobId) {
      setResult("Job ID is required.");
      return;
    }

    if (!walletAddress) {
      setResult("Connect wallet first, then submit application.");
      return;
    }

    setLoading(true);
    try {
      const data = await contractClient.applyToJob(applyForm.jobId, {
        sourceAccount: "alice",
        applicant: walletAddress,
        cover_letter: applyForm.coverLetter,
        resume_link: applyForm.resumeLink
      });

      setResult(JSON.stringify(data, null, 2));
      setAppTab("home");
    } catch (error) {
      setResult(error.message);
    } finally {
      setLoading(false);
    }
  };

  const readJobFromContract = async () => {
    if (!applyForm.jobId) {
      setResult("Enter a job ID to verify on-chain.");
      return;
    }

    setLoading(true);
    try {
      const data = await contractClient.getJob(applyForm.jobId);
      setResult(`On-chain job check for ID ${applyForm.jobId}:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPostJob = async (event) => {
    event.preventDefault();
    if (!postForm.title || !postForm.salary || !postForm.description) {
      setResult("Fill title, salary and full description before posting.");
      return;
    }

    if (!walletAddress) {
      setResult("Connect wallet first. The job employer will use your connected wallet address.");
      return;
    }

    setLoading(true);
    try {
      const data = await contractClient.createJob({
        sourceAccount: "alice",
        employer: walletAddress,
        title: postForm.title,
        description: postForm.description,
        location: postForm.location,
        required_skills: [postForm.nature, postForm.model, postForm.level],
        salary_min: Number(postForm.salary),
        salary_max: Number(postForm.salary)
      });

      const createdJobId = parseContractOutputValue(data.output);
      if (createdJobId) {
        setApplyForm((prev) => ({ ...prev, jobId: String(createdJobId) }));
        setResult(`Job posted on-chain with ID ${createdJobId}.\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      setResult(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="splash-page">
        <div className="splash-card">
          <h2 className="mobile-title small">Loading content...</h2>
        </div>
      </div>
    );
  }

  if (location.pathname === "/admin") {
    return (
      <AdminPage
        content={content}
        onSave={saveContent}
        onReset={resetContent}
        onBack={() => navigate("/")}
      />
    );
  }

  if (page === "splash") {
    return <SplashScreen brand={content.brand} onNext={() => goToPage("login")} />;
  }

  if (page === "login") {
    return (
      <LoginScreen
        subtitle={content.auth.subtitle}
        authNotice={authNotice}
        loginForm={loginForm}
        onLoginChange={onLoginChange}
        onSubmit={submitLogin}
        onBack={() => goToPage("splash")}
        onOpenForgot={() => goToPage("forgot")}
        onOpenRegister={() => goToPage("register")}
        providerStatus={providerStatus}
        onSocialLogin={socialLogin}
      />
    );
  }

  if (page === "register") {
    return (
      <RegisterScreen
        subtitle={content.auth.subtitle}
        authNotice={authNotice}
        registerForm={registerForm}
        onRegisterChange={onRegisterChange}
        onSubmit={submitRegister}
        onBack={() => goToPage("login")}
        providerStatus={providerStatus}
        onSocialLogin={socialLogin}
      />
    );
  }

  if (page === "forgot") {
    return (
      <ForgotScreen
        subtitle={content.auth.subtitle}
        authNotice={authNotice}
        forgotEmail={forgotEmail}
        setForgotEmail={setForgotEmail}
        onSubmit={submitForgot}
        onBack={() => goToPage("login")}
        onBackToLogin={() => goToPage("login")}
      />
    );
  }

  if (page === "otp") {
    return (
      <OtpScreen
        subtitle={content.auth.subtitle}
        authNotice={authNotice}
        otpDigits={otpDigits}
        otpTimer={otpTimer}
        onOtpChange={onOtpChange}
        onSubmit={submitOtp}
        onBack={() => goToPage("forgot")}
      />
    );
  }

  if (page === "reset") {
    return (
      <ResetScreen
        subtitle={content.auth.subtitle}
        authNotice={authNotice}
        resetForm={resetForm}
        onResetChange={onResetChange}
        onSubmit={submitReset}
        onBack={() => goToPage("otp")}
      />
    );
  }

  return (
    <div className="splash-page">
      <div className="mobile-app-card">
        <BottomNav tab={appTab} onTabChange={setAppTab} />

        <div className="page-content">
          {appTab === "home" ? (
            <HomeScreen
              homeData={content.home}
              userName={currentUser.name}
              onOpenNotifications={() => setAppTab("notifications")}
              onSelectJob={onSelectJobForApply}
              onSeeAllJobs={() => setAppTab("search")}
              popularJobs={filteredJobs.slice(0, 3)}
              recentJobs={filteredJobs.slice(3, 6).length ? filteredJobs.slice(3, 6) : filteredJobs.slice(0, 3)}
              result={result}
            />
          ) : null}

          {appTab === "search" ? (
            <SearchScreen
              searchData={content.search}
              onOpenFilter={() => setAppTab("filter")}
              onSelectJob={onSelectJobForApply}
              onBack={() => setAppTab("home")}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={filteredJobs}
            />
          ) : null}
          {appTab === "filter" ? (
            <FilterScreen
              filterData={content.filter}
              filterForm={filterForm}
              onFilterChange={onFilterChange}
              onBack={() => setAppTab("search")}
              onResetFilter={resetFilter}
              onApplyFilter={applyFilter}
            />
          ) : null}
          {appTab === "apply" ? (
            <ApplyJobScreen
              selectedJob={selectedJob}
              applyForm={applyForm}
              onApplyChange={onApplyChange}
              onSubmitApply={submitJobApply}
              onReadJob={readJobFromContract}
              loading={loading}
              walletAddress={walletAddress}
              onConnectWallet={connectWallet}
              onWalletAddressChange={onWalletAddressChange}
              onUseManualWallet={useManualWalletAddress}
              onBack={() => setAppTab("home")}
            />
          ) : null}
          {appTab === "notifications" ? <NotificationsScreen notifications={content.notifications} onBack={() => setAppTab("home")} /> : null}

          {appTab === "post" ? (
            <PostJobScreen
              postData={content.post}
              postForm={postForm}
              onPostChange={onPostChange}
              onSubmitPost={submitPostJob}
              loading={loading}
              onBack={() => setAppTab("home")}
            />
          ) : null}

          {appTab === "profile" ? (
            <ProfileScreen
              user={currentUser}
              walletStatus={walletStatus}
              walletAddress={walletAddress}
              onConnectWallet={connectWallet}
              onWalletAddressChange={onWalletAddressChange}
              onUseManualWallet={useManualWalletAddress}
              onCheckApi={checkHealth}
              loading={loading}
              onLogout={() => goToPage("login")}
              onBack={() => setAppTab("home")}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
