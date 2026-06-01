import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useBillingStatus, usePlans, useSubscribe } from '@/hooks/useBilling';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { PlanBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatMoney, formatDate } from '@/lib/utils';

export function BillingPage() {
  const { data: status, isLoading: loadingStatus } = useBillingStatus();
  const { data: plans, isLoading: loadingPlans } = usePlans();
  const subscribeMutation = useSubscribe();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const isLoading = loadingStatus || loadingPlans;

  return (
    <div>
      <PageHeader title="Billing & Plans" />

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {/* Current plan card */}
            {status && (
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-surface-900">Current Plan</h2>
                  <PlanBadge plan={status.plan} />
                </div>

                <div className="flex items-center gap-2">
                  {status.is_active ? (
                    <CheckCircle className="h-5 w-5 text-paid" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-pending" />
                  )}
                  <span className={`text-sm font-semibold ${status.is_active ? 'text-paid' : 'text-pending'}`}>
                    {status.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {status.plan_expiry && (
                  <p className="text-sm text-surface-700">
                    {status.is_active ? 'Expires' : 'Expired'}: {formatDate(status.plan_expiry)}
                  </p>
                )}

                {status.plan === 'TRIAL' && status.is_trial_expired && (
                  <div className="bg-pending-light rounded-xl p-3">
                    <p className="text-sm text-pending-dark font-semibold">Trial expired</p>
                    <p className="text-sm text-pending-dark mt-0.5">Upgrade to continue using FeeFlow.</p>
                  </div>
                )}
              </Card>
            )}

            {/* Billing period toggle */}
            <div className="bg-surface-100 rounded-xl p-1 flex">
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className={`flex-1 min-h-tap rounded-lg text-sm font-semibold transition-colors ${
                  selectedPeriod === 'monthly' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPeriod('yearly')}
                className={`flex-1 min-h-tap rounded-lg text-sm font-semibold transition-colors ${
                  selectedPeriod === 'yearly' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-600'
                }`}
              >
                Yearly <span className="text-paid text-xs font-bold ml-1">Save 20%</span>
              </button>
            </div>

            {/* Plans */}
            {plans && (
              <div className="space-y-3">
                {plans.map((plan) => {
                  if (plan.id === 'TRIAL') return null;
                  const price = selectedPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
                  const isCurrentPlan = status?.plan === plan.id;

                  return (
                    <Card key={plan.id} className={`p-4 ${isCurrentPlan ? 'border-brand-500 bg-brand-50' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-base font-bold text-surface-900">{plan.name}</p>
                          <p className="text-sm text-surface-700">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-surface-900">{formatMoney(price)}</p>
                          <p className="text-xs text-surface-500">/{selectedPeriod === 'monthly' ? 'mo' : 'yr'}</p>
                        </div>
                      </div>

                      <p className="text-sm text-surface-700 mb-3">
                        Up to {plan.student_limit} students
                      </p>

                      {isCurrentPlan ? (
                        <div className="w-full min-h-tap rounded-xl bg-brand-100 text-brand-700 font-semibold text-sm flex items-center justify-center">
                          Current Plan
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="full"
                          loading={subscribeMutation.isPending}
                          onClick={() => subscribeMutation.mutate({ plan: plan.id as 'STARTER' | 'GROWTH', period: selectedPeriod })}
                        >
                          Upgrade to {plan.name}
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-surface-500 text-center pb-4">
              Payments powered by Razorpay. Cancel anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
