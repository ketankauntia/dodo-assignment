"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getButtonClass} from "@/lib/ui-utils";

interface UserSubscription {
  plan: string;
  plan_code: string;
  plan_status: string;
  plan_start_date?: any;
  plan_end_date?: any;
  payment_channel?: string;
  subscriptions?: any[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const status = searchParams.get("status");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (status === "success") {
      setShowSuccessMessage(true);
      console.log("Stripe checkout completed, session:", sessionId);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [status, sessionId]);

  const fetchUserSubscription = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserSubscription(userDoc.data() as UserSubscription);
      }
    } catch (error) {
      console.error("Error fetching user subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPlanDisplayName = (planCode: string) => {
    switch (planCode) {
      case "FREE":
        return "Free Plan";
      case "PRO_MONTH":
        return "Pro Monthly";
      case "PRO_YEAR":
        return "Pro Yearly";
      case "CREDITS_100":
        return "100 Credits";
      default:
        return planCode || "Unknown Plan";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50 border-green-200";
      case "canceled":
        return "text-red-600 bg-red-50 border-red-200";
      case "trialing":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "past_due":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Payment Successful!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your subscription has been upgraded. It may take a moment for changes to reflect.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="text-green-800 hover:text-green-900 text-sm font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">Hi {user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Email</span>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Account ID</span>
                <p className="text-gray-900 font-mono text-sm">{user.uid}</p>
              </div>
            </div>
          </div>

          {/* Subscription Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Details</h2>
            {userSubscription ? (
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Current Plan</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {getPlanDisplayName(userSubscription.plan_code)}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(userSubscription.plan_status)}`}>
                      {userSubscription.plan_status || "Active"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Start Date</span>
                    <p className="text-gray-900">{formatDate(userSubscription.plan_start_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">End Date</span>
                    <p className="text-gray-900">
                      {userSubscription.plan_end_date ? formatDate(userSubscription.plan_end_date) : "No expiration"}
                    </p>
                  </div>
                </div>

                {userSubscription.payment_channel && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Payment Method</span>
                    <p className="text-gray-900 capitalize">{userSubscription.payment_channel}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">
                <p>No subscription information available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Upgrade Card (only for free plan) */}
          {userSubscription?.plan === "free" || userSubscription?.plan_code === "FREE" ? (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">Upgrade Your Plan</h3>
              <p className="text-blue-100 mb-4">
                Get access to premium features with our Pro plans.
              </p>
              <button
                onClick={() => router.push("/pricing")}
                className={`bg-white text-blue-600 px-6 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors cursor-pointer`}
              >
                Upgrade to Pro
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-900 mb-2">Active Subscription</h3>
              <p className="text-green-700 mb-4">
                You&apos;re currently on the {getPlanDisplayName(userSubscription?.plan_code || "")} plan.
              </p>
              <button
                onClick={() => router.push("/pricing")}
                className={getButtonClass('success')}
              >
                Manage Subscription
              </button>
            </div>
          )}

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/pricing")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
              >
                → View All Plans
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
              >
                → Refresh Subscription Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
