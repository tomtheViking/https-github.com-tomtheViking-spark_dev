import React, { useState, useEffect } from "react";
import { Lock, Check, Shield, AlertTriangle, Loader2, Brain, Key, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

interface EnrollmentProps {
  onSuccess: (email: string, tenantId: string, role: string) => void;
}

export default function Enrollment({ onSuccess }: EnrollmentProps) {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  
  // Validation States
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [tenantInfo, setTenantInfo] = useState<{ tenantId: string; role: string } | null>(null);

  // Form States
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // UI helpers
  const [showTemp, setShowTemp] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Extract query parameters from URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") || "";
    const emailParam = params.get("email") || "";

    setToken(tokenParam);
    setEmail(emailParam);

    if (!tokenParam || !emailParam) {
      setIsValidating(false);
      setIsValid(false);
      setValidationError("Missing registration token or email. Please check your invitation link.");
      return;
    }

    // Call server to validate token
    const validateToken = async () => {
      try {
        const response = await fetch("/api/aws-ses/enroll/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: tokenParam, email: emailParam }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Verification failed.");
        }

        setTenantInfo({ tenantId: data.tenantId, role: data.role });
        setIsValid(true);
      } catch (err: any) {
        setValidationError(err.message || "Invitation verification failed.");
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!tempPassword.trim()) {
      setFormError("Please enter the temporary password sent in your email.");
      return;
    }

    if (!newPassword) {
      setFormError("Please enter a new permanent password.");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit password update and activate profile on backend
      const response = await fetch("/api/aws-ses/enroll/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          tempPassword: tempPassword.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete enrollment.");
      }

      setFormSuccess("Enrollment completed successfully! Logging you in...");

      // 2. Perform client-side Firebase Auth sign-in using the new permanent password
      try {
        await signInWithEmailAndPassword(auth, email, newPassword);
      } catch (authErr: any) {
        console.warn("Firebase email/password auth login failed during enrollment:", authErr);
        if (authErr.code === "auth/operation-not-allowed") {
          // Store a local mock user so the client-side session is logged in
          const localUser = {
            uid: "sandbox-uid-" + Math.random().toString(36).substring(2, 11),
            name: email.split("@")[0],
            displayName: email.split("@")[0],
            email: email,
            tenant_id: data.tenantId,
            role: data.role,
          };
          localStorage.setItem("spark_sandbox_user", JSON.stringify(localUser));
        } else {
          throw authErr;
        }
      }

      // 3. Trigger success callback to redirect to the authenticated dashboard
      setTimeout(() => {
        onSuccess(data.email, data.tenantId, data.role);
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || "An unexpected registration error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans" id="enrollment_page">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-2xl text-teal-400 shadow-lg flex items-center justify-center">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900 block">Spark Analytic</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Precision Revenue Science</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-bold font-display tracking-tight text-slate-950">
          Complete Workspace Enrollment
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-medium">
          Securely set up your permanent login credentials below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-200/60 rounded-3xl sm:px-10 space-y-6">
          
          {isValidating ? (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <span className="text-xs text-slate-500 font-semibold">Validating secure invitation token...</span>
            </div>
          ) : !isValid ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-3 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">Verification Failed</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {validationError || "This registration link is invalid, mismatching, or expired."}
              </p>
              <div className="pt-2 text-[10px] text-slate-400 font-mono">
                CODE: ENROLL_TOKEN_INVALID
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Tenant context header banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1.5 border border-slate-800 shadow-md">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-widest">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Verified Workspace</span>
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  Email: <span className="text-white font-bold">{email}</span>
                </div>
                <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono border-t border-slate-800">
                  <span>Tenant ID: <strong className="text-white">{tenantInfo?.tenantId}</strong></span>
                  <span>•</span>
                  <span>Role: <strong className="text-white">{tenantInfo?.role}</strong></span>
                </div>
              </div>

              {/* Temp Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Temporary Password</label>
                <div className="relative">
                  <input
                    type={showTemp ? "text" : "password"}
                    required
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Enter password from invite email"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3.5 py-2.5 pr-10 rounded-xl focus:outline-none transition-all font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTemp(!showTemp)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    {showTemp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">New Permanent Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3.5 py-2.5 pr-10 rounded-xl focus:outline-none transition-all font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Confirm Permanent Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3.5 py-2.5 pr-10 rounded-xl focus:outline-none transition-all font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-medium">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-teal-50 text-teal-800 text-xs rounded-xl border border-teal-100 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Complete registration</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
