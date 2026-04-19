
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { pricingPlans } from '@/data/pricingData';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const getSavings = (plan: typeof pricingPlans[0]) => {
    if (!plan.price.annual) return null;
    const monthly = parseFloat(plan.price.monthly.replace('$', ''));
    const annual = parseFloat(plan.price.annual.replace('$', ''));
    const saved = Math.round((monthly - annual) * 12);
    return saved > 0 ? saved : null;
  };

  return (
    <section id="pricing" className="py-24 bg-[#12141C]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Choose the plan that best fits your trading needs. All plans include our core platform features.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center p-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
            <button
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-crypto-purple text-white shadow-lg shadow-crypto-purple/30'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-crypto-purple text-white shadow-lg shadow-crypto-purple/30'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white/20 text-white'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => {
            const price = billingCycle === 'annual' && plan.price.annual
              ? plan.price.annual
              : plan.price.monthly;
            const savings = getSavings(plan);

            return (
              <div
                key={index}
                className={`bg-white/5 backdrop-blur-sm border rounded-xl overflow-hidden animate-on-scroll ${
                  plan.highlighted
                    ? 'border-crypto-purple relative shadow-xl shadow-crypto-purple/10'
                    : 'border-white/10'
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {plan.highlighted && (
                  <div className="bg-crypto-purple text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-xl font-semibold mb-2 text-white">{plan.name}</h3>
                  <div className="mb-1">
                    <span className="text-3xl md:text-4xl font-bold text-white">{price}</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>

                  {/* Annual savings callout */}
                  {billingCycle === 'annual' && savings ? (
                    <p className="text-green-400 text-sm mb-4 font-medium">
                      You save ${savings}/year
                    </p>
                  ) : (
                    <p className="text-gray-600 text-sm mb-4">
                      {plan.price.annual ? `$${Math.round((parseFloat(plan.price.monthly.replace('$','')) - parseFloat(plan.price.annual.replace('$',''))) * 12)} saved annually` : ' '}
                    </p>
                  )}

                  <p className="text-gray-400 mb-6">{plan.description}</p>

                  <Button
                    className={`w-full mb-6 ${
                      plan.highlighted
                        ? 'bg-crypto-purple hover:bg-crypto-dark-purple'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>

                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-4">What's included:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-crypto-purple mr-3 shrink-0" />
                          <span className="text-gray-400 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
