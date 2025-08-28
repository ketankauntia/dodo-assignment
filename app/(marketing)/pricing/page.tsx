'use client';

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PLAN_CATALOG, PlanCode } from '../../../lib/planCatalog';

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePlanSelect = async (planCode: PlanCode) => {
    if (!user) {
      alert('Please sign in first');
      return;
    }

    if (planCode === 'FREE') {
      alert('You are already on the free plan');
      return;
    }

    setLoading(planCode);

    try {
      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ planCode }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Select the perfect plan for your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {PLAN_CATALOG.map((plan) => (
            <div
              key={plan.code}
              className={`bg-white rounded-lg shadow-lg p-6 ${
                plan.code === 'PRO_YEAR' ? 'ring-2 ring-blue-500 relative' : ''
              }`}
            >
              {plan.code === 'PRO_YEAR' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {plan.label}
                </h3>

                {plan.type === 'free' && (
                  <>
                    <div className="text-3xl font-bold text-gray-900 mb-2">Free</div>
                    <p className="text-gray-600 mb-6">Perfect for getting started</p>
                    <ul className="text-sm text-gray-600 mb-6 space-y-2">
                      <li>✓ Basic features</li>
                      <li>✓ Limited usage</li>
                      <li>✓ Community support</li>
                    </ul>
                  </>
                )}

                {plan.type === 'subscription' && (
                  <>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      ${plan.code === 'PRO_MONTH' ? '29' : '290'}
                      <span className="text-lg text-gray-600">
                        /{plan.code === 'PRO_MONTH' ? 'month' : 'year'}
                      </span>
                    </div>
                    {plan.code === 'PRO_YEAR' && (
                      <p className="text-green-600 font-medium mb-4">Save 17%</p>
                    )}
                    <p className="text-gray-600 mb-6">Everything you need to scale</p>
                    <ul className="text-sm text-gray-600 mb-6 space-y-2">
                      <li>✓ All features included</li>
                      <li>✓ Unlimited usage</li>
                      <li>✓ Priority support</li>
                      <li>✓ Advanced analytics</li>
                    </ul>
                  </>
                )}

                {plan.type === 'one_time' && (
                  <>
                    <div className="text-3xl font-bold text-gray-900 mb-2">$10</div>
                    <p className="text-gray-600 mb-6">One-time purchase</p>
                    <ul className="text-sm text-gray-600 mb-6 space-y-2">
                      <li>✓ 100 additional credits</li>
                      <li>✓ Never expires</li>
                      <li>✓ Instant activation</li>
                    </ul>
                  </>
                )}

                <button
                  onClick={() => handlePlanSelect(plan.code)}
                  disabled={loading === plan.code || plan.code === 'FREE'}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    plan.code === 'FREE'
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.code === 'PRO_YEAR'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } ${loading === plan.code ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.code ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </div>
                  ) : plan.code === 'FREE' ? (
                    'Current Plan'
                  ) : (
                    `Get ${plan.label}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!user && (
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Sign in to choose a plan</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
