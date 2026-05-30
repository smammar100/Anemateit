'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/fundations/elements/Button';
import { Close, Plus, ArrowUpRight } from '@/components/fundations/icons/Icons';

const ANIMATION_TYPES = [
  'Hover Effect',
  'Scroll Animation',
  'Text Effect',
  'Loading / Spinner',
  'Button / CTA',
  'Card Transition',
  'Page Transition',
  'Other',
];

const TOTAL_STEPS = 4;

const inputClass =
  'block w-full px-4 py-3 text-sm leading-tight bg-white transition duration-300 ease-in-out rounded-md text-base-700 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm';

type Props = {
  buttonClassName?: string;
};

export default function RequestAnimationModal({ buttonClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [url, setUrl] = useState('');
  const [details, setDetails] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const reset = () => {
    setStep(1);
    setName('');
    setSelectedType('');
    setUrl('');
    setDetails('');
    setDone(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const defaultButtonClass =
    'flex justify-center text-center font-medium items-center duration-500 ease-in-out transition-colors focus:outline-2 focus:outline-inset focus:outline-base-300 text-base-900 bg-base-50 hover:bg-base-100 h-8 px-4 py-3 text-xs rounded-lg whitespace-nowrap';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName ?? defaultButtonClass}
      >
        Request Animation
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-base-950/50 backdrop-blur transition-opacity"
            onClick={close}
          />

          <div className="relative w-full max-w-md bg-base-50 rounded-lg p-8 text-left align-middle shadow-xl">
            {step > 1 && !done && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="absolute top-3 left-3 text-base-400 hover:text-base-900 transition-colors size-7 flex items-center justify-center rounded-lg hover:bg-base-100"
                aria-label="Go back"
              >
                <svg viewBox="0 0 256 256" fill="currentColor" className="size-4" aria-hidden="true">
                  <path d="M228,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H216A12,12,0,0,1,228,128Z" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 text-base-400 hover:text-base-500 cursor-pointer"
              aria-label="Close"
            >
              <Close className="size-4" />
            </button>

            {done ? (
              <div className="flex flex-col items-center text-center gap-5 py-2">
                <div className="size-12 rounded-full bg-accent-600 flex items-center justify-center text-white">
                  <svg viewBox="0 0 256 256" fill="currentColor" className="size-5" aria-hidden="true">
                    <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,0,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" />
                  </svg>
                </div>
                <h2 className="text-base-900 text-xl font-medium">Request submitted</h2>
                <p className="text-base-600 text-sm leading-relaxed">
                  We&apos;ll review your idea. If we build it, you&apos;ll be credited as the
                  inspiration source.
                </p>
                <Button variant="default" size="base" className="w-full" onClick={close}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                {step === 1 && (
                  <div className="flex flex-col items-center text-center gap-5">
                    <div className="size-12 rounded-full bg-base-100 ring-1 ring-base-200 flex items-center justify-center text-base-500">
                      <Plus className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base-900 text-xl font-medium">
                        Which animation do you want?
                      </h2>
                      <p className="text-base-500 text-sm">Give your request a short title.</p>
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(2)}
                      placeholder="e.g. Liquid cursor trail"
                      className={inputClass}
                    />
                    <Button
                      variant="default"
                      size="base"
                      className="w-full disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={!name.trim()}
                      onClick={() => setStep(2)}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col items-center text-center gap-5">
                    <div className="space-y-1">
                      <h2 className="text-base-900 text-xl font-medium">What type of animation?</h2>
                      <p className="text-base-500 text-sm">Pick the closest category.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {ANIMATION_TYPES.map((t) => {
                        const active = selectedType === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedType(t)}
                            className={`px-3 py-3 rounded-lg text-xs font-medium text-left transition duration-300 ease-in-out ${
                              active
                                ? 'bg-white text-base-900 ring-2 ring-accent-500 shadow-sm'
                                : 'bg-white text-base-600 ring-1 ring-base-200 hover:text-base-900 hover:ring-base-300'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="default"
                      size="base"
                      className="w-full disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={!selectedType}
                      onClick={() => setStep(3)}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col items-center text-center gap-5">
                    <div className="space-y-1">
                      <h2 className="text-base-900 text-xl font-medium">Got a reference URL?</h2>
                      <p className="text-base-500 text-sm">
                        Link a site or post that nails the effect.
                      </p>
                    </div>
                    <input
                      autoFocus
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="www.example.com"
                      className={inputClass}
                    />
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="default"
                        size="base"
                        className="w-full"
                        onClick={() => setStep(4)}
                      >
                        Continue
                      </Button>
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="text-base-500 hover:text-base-900 text-sm py-1 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col items-center text-center gap-5">
                    <div className="space-y-1">
                      <h2 className="text-base-900 text-xl font-medium">Tell us more about it</h2>
                      <p className="text-base-500 text-sm">
                        Describe the motion, the feel, the timing.
                      </p>
                    </div>
                    <textarea
                      autoFocus
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Describe the animation, the feel, or anything that helps us build it..."
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                    <div className="flex flex-col gap-3 w-full">
                      <Button
                        variant="accent"
                        size="base"
                        className="w-full"
                        rightIcon={<ArrowUpRight className="size-4" />}
                        gap="xs"
                        onClick={() => setDone(true)}
                      >
                        Submit request
                      </Button>
                      <p className="text-base-500 text-xs leading-relaxed">
                        You&apos;ll be credited as the inspiration source if this animation gets
                        featured.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-1.5 mt-6">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i < step ? 'bg-base-900 w-6' : 'bg-base-200 w-4'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
