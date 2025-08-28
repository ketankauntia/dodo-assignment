"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getButtonClass } from "@/lib/ui-utils";

interface UserPlan {
  plan: string;
  plan_code: string;
  plan_status: string;
  plan_end_date?: any;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Fetch user plan data from Firestore
  useEffect(() => {
    if (user) {
      fetchUserPlan();
    } else {
      setUserPlan(null);
    }
  }, [user]);

  const fetchUserPlan = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserPlan(userDoc.data() as UserPlan);
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      await signUp(email, password);
      setMessage("Account created successfully!");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      setMessage(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setMessage("");
    
    try {
      await signIn(email, password);
      setMessage("Signed in successfully!");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      setMessage(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setMessage("Signed out successfully!");
    } catch (error: any) {
      setMessage(error.message || "Failed to sign out");
    }
  };

  const formatPlanDisplay = () => {
    if (!userPlan) return "Loading plan...";
    
    if (userPlan.plan === "free" || userPlan.plan_code === "FREE") {
      return "You are on Free Plan";
    }
    
    if (userPlan.plan_end_date) {
      const endDate = new Date(userPlan.plan_end_date.seconds * 1000);
      const planName = userPlan.plan_code === "PRO_MONTH" ? "Pro Monthly" : "Pro Yearly";
      return `You are on ${planName} until ${endDate.toLocaleDateString()}`;
    }
    
    return `You are on ${userPlan.plan_code || userPlan.plan} Plan`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {!user ? (
            <>
              {/* Login/Signup Form */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
                <p className="text-gray-600">Sign in to your account or create a new one</p>
              </div>

              <form className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    onClick={handleSignIn}
                    disabled={loading}
                    className={`flex-1 ${getButtonClass('primary', loading)}`}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={loading}
                    className={`flex-1 ${getButtonClass('secondary', loading)}`}
                  >
                    {loading ? "Creating..." : "Sign Up"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* User Info Display */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Welcome back!</p>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Account Information</h3>
                  <p className="text-lg text-gray-900">{user.email}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Plan</h3>
                  <p className="text-lg font-semibold text-blue-900">{formatPlanDisplay()}</p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className={`flex-1 ${getButtonClass('primary')}`}
                  >
                    Upgrade Plan
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className={`flex-1 ${getButtonClass('danger')}`}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Message Display */}
          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              message.includes("success") || message.includes("Success")
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
