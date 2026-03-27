import React, { useState } from 'react';
import { Check, Zap, Crown, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { upgradePlanApi } from '../api';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    period: '',
    icon: Star,
    color: '#8888a0',
    gradient: 'linear-gradient(135deg, #8888a0, #55556a)',
    description: 'Everything you need to begin your fitness journey',
    features: [
      'Unlimited workout logging',
      'Goal tracking & deadlines',
      'Basic analytics dashboard',
      'Workout history',
      'Exercise library',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€9.99',
    period: '/month',
    icon: Zap,
    color: '#6c5ce7',
    gradient: 'linear-gradient(135deg, #6c5ce7, #00d2ff)',
    description: 'Advanced tools for dedicated athletes',
    popular: true,
    features: [
      'Everything in Starter',
      'Live weather widget on dashboard',
      'Smart AI calorie calculator',
      'Exercise autocomplete (10,000+ exercises)',
      'Workout streak tracking',
      'Advanced performance charts',
      'Weekly progress reports',
      'Priority support',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '€19.99',
    period: '/month',
    icon: Crown,
    color: '#ffa502',
    gradient: 'linear-gradient(135deg, #ffa502, #ff6b6b)',
    description: 'The ultimate performance platform',
    features: [
      'Everything in Pro',
      'AI-powered workout recommendations',
      'Nutrition tracking & macro planning',
      'Personal records & milestones',
      'Body composition tracking',
      'Custom workout programs',
      'Team & coach sharing',
      'Dedicated account manager',
    ],
  },
];

function Plans() {
  const { user, upgradePlan } = useAuth();
  const [loading, setLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpgrade = async (planId) => {
    if (planId === user?.plan || loading) return;
    setLoading(planId);
    try {
      const res = await upgradePlanApi(planId);
      upgradePlan(res.data.token, res.data.user);
      const name = PLANS.find(p => p.id === planId)?.name;
      showToast(`Welcome to ${name}! All features unlocked.`, 'success');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const currentPlanIdx = PLANS.findIndex(p => p.id === (user?.plan || 'starter'));

  return (
    <div>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Choose Your Plan</h2>
        <p style={{ fontSize: '15px' }}>
          Unlock the full power of FitTrack and take your training to the next level
        </p>
      </div>

      <div className="plans-grid">
        {PLANS.map((plan, idx) => {
          const isCurrent = user?.plan === plan.id || (!user?.plan && plan.id === 'starter');
          const isDowngrade = idx < currentPlanIdx;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`plan-card ${plan.popular ? 'plan-popular' : ''} ${isCurrent ? 'plan-active' : ''}`}
              style={{ '--plan-color': plan.color }}
            >
              {plan.popular && (
                <div className="plan-badge-popular">
                  <Sparkles size={12} /> Most Popular
                </div>
              )}
              {isCurrent && !plan.popular && (
                <div className="plan-badge-current">Your Plan</div>
              )}

              <div className="plan-icon" style={{ background: `${plan.color}18`, color: plan.color }}>
                <Icon size={22} />
              </div>

              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="plan-amount">{plan.price}</span>
                <span className="plan-period">{plan.period}</span>
              </div>
              <p className="plan-desc">{plan.description}</p>

              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i} className="plan-feature-item">
                    <Check size={13} style={{ color: plan.color, flexShrink: 0, marginTop: 1 }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`plan-btn ${isCurrent ? 'plan-btn-current' : 'plan-btn-upgrade'}`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || loading !== null}
                style={!isCurrent ? { background: plan.gradient } : {}}
              >
                {loading === plan.id ? (
                  <span className="spinner" />
                ) : isCurrent ? (
                  'Current Plan'
                ) : isDowngrade ? (
                  'Switch to ' + plan.name
                ) : (
                  <>
                    Upgrade to {plan.name}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="plans-note">
        <p>All plans include a 14-day free trial. No credit card required for Starter.</p>
        <p>Upgrade, downgrade, or cancel anytime.</p>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default Plans;
