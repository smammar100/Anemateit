import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import Faq from '@/components/global/Faq';

const plans = [
  {
    name: 'Free',
    description: 'Browse the library. Copy prompts for personal projects.',
    priceStatic: '$0',
    features: [
      { label: 'Prompts', value: 'Free animations, no limits' },
      { label: 'Previews', value: 'Full video + code samples' },
      { label: 'License', value: 'Personal use only' },
      { label: 'Support', value: 'Community Discord' },
    ],
  },
  {
    name: 'Pro',
    description: 'Every prompt. Commercial use.',
    priceMonthly: '$9',
    features: [
      { label: 'Prompts', value: 'The full library' },
      { label: 'License', value: 'Client & commercial work' },
      { label: 'Updates', value: 'New drops weekly' },
      { label: 'Downloads', value: 'Ship-ready source files' },
      { label: 'Support', value: 'Priority replies' },
    ],
  },
];

export default function PricingPage() {
  return (
    <SiteShell>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="text-balance max-w-3xl mx-auto text-center">
            <Text
              tag="h1"
              variant="displayLG"
              className="text-base-900 font-display font-light"
            >
              <span className="block">Access the full library.</span>
              <span className="block">Use it like a pro.</span>
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              One paste, every animation. Unlock the full prompt library and ship motion
              that lands in Claude Code, Cursor, v0, Lovable, and Bolt.
            </Text>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-12">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="flex flex-col h-full justify-between bg-base-50 rounded-lg p-8"
              >
                <div className="flex flex-col gap-8">
                  <div className="space-y-3">
                    <Text
                      tag="p"
                      variant="displaySM"
                      className="text-base-900 text-balance font-display font-light"
                    >
                      {plan.name}
                    </Text>
                    <Text tag="p" variant="textSM" className="text-base-600">
                      {plan.description}
                    </Text>
                  </div>
                  <div>
                    {plan.priceStatic ? (
                      <Text
                        tag="p"
                        variant="displayLG"
                        className="text-base-900 font-display font-light"
                      >
                        {plan.priceStatic}
                      </Text>
                    ) : (
                      <Text tag="p" variant="displayLG" className="text-base-900">
                        <span className="tracking-tighter font-display font-light">
                          {plan.priceMonthly ?? ''}
                        </span>
                        {plan.priceMonthly && (
                          <span className="text-lg ml-1 text-base-700">/month</span>
                        )}
                      </Text>
                    )}
                  </div>
                  <ul className="divide-y divide-base-200 mt-4">
                    {plan.features.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center justify-between py-3 text-base-800"
                      >
                        <Text tag="span" variant="textBase" className="text-base-800">
                          {item.label}
                        </Text>
                        <Text tag="span" variant="textSM" className="text-base-500">
                          {item.value}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button size="base" variant="default" type="submit" className="w-fit mt-8">
                  Get started
                </Button>
              </div>
            ))}
          </div>
        </Wrapper>
      </section>
      <Faq />
    </SiteShell>
  );
}
