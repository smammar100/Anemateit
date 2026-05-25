import SiteShell from '@/components/global/SiteShell';
import Link from 'next/link';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';

export default function SignUpPage() {
  return (
    <SiteShell hideNavigation hideFooter>
      <div className="flex h-dvh">
        <div className="w-full max-w-md py-24 lg:py-48 mx-auto">
          <div className="text-center">
            <Text
              tag="h1"
              variant="displayLG"
              className="text-base-900 font-display font-light"
            >
              Sign up
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Create your account below. We promise not to make you confirm your email three
              times (unless you really want to).
            </Text>
          </div>
          <form className="mt-10 space-y-4">
            <div className="w-full">
              <label htmlFor="email" className="text-sm font-medium text-base-500 mb-1 block">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                inputMode="email"
                className="block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
              />
            </div>
            <div className="w-full">
              <label htmlFor="password" className="text-sm font-medium text-base-500 mb-1 block">
                Password
              </label>
              <input
                required
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                aria-required="true"
                className="block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-base-500 mb-1 block"
              >
                Confirm Password
              </label>
              <input
                required
                id="confirm-password"
                name="confirm-password"
                type="password"
                placeholder="••••••••"
                aria-required="true"
                className="block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button size="base" variant="accent" gap="sm" type="submit">
                Create account
              </Button>
              <Button size="base" variant="muted" gap="sm" type="button">
                Sign up with Google
              </Button>
            </div>
          </form>
          <Text
            tag="p"
            variant="textXS"
            className="mt-4 font-medium text-center text-base-500"
          >
            Already have an account?{' '}
            <Link href="/signin" className="font-medium text-accent-500 hover:text-base-500">
              Sign in
            </Link>
          </Text>
        </div>
      </div>
    </SiteShell>
  );
}
