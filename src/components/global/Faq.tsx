import Text from '@/components/fundations/elements/Text';
import Wrapper from '@/components/fundations/containers/Wrapper';
import { Plus } from '@/components/fundations/icons/Icons';

const faqs = [
  {
    question: 'What exactly do I get when I "copy the prompt"?',
    answer:
      "A self-contained prompt: the animation, its props, the AI's mental model, and the tweak knobs. Paste it into your tool — the effect lands in your stack.",
  },
  {
    question: 'Which AI coding tools is Anemate.dev built for?',
    answer:
      'First-class: Claude Code, Cursor, v0, Lovable, Bolt. The prompts are tool-agnostic, so anything that can read structure and emit React should work.',
  },
  {
    question: 'Do I need to know React to use these animations?',
    answer:
      'No. The AI handles the React. If you do write your own, the output stays clean — named props, single file, no surprise dependencies.',
  },
  {
    question: 'Can I use the animations in commercial or client work?',
    answer:
      'Free is personal use only. Pro covers commercial and client work — SaaS, agency projects, paid templates. Details on each animation page.',
  },
  {
    question: 'Why prompts instead of a copy-paste code snippet?',
    answer:
      'Snippets break the moment your stack differs from the demo. A prompt encodes intent — the AI fits the effect to your conventions, your styling system, your file structure.',
  },
  {
    question: 'How often are new animations added?',
    answer:
      'New entries land every week. Pro gets them on ship day; free sees a rotating selection.',
  },
  {
    question: 'What if the AI tool gets it wrong on the first try?',
    answer:
      'Every prompt ships with troubleshooting notes — common failure modes and how to nudge the model. The source video is the ground truth.',
  },
  {
    question: 'Can I tweak the animation after it lands in my code?',
    answer:
      "Yes. Each prompt calls out the safe tweak knobs — duration, easing, distance, stagger — and what's structural.",
  },
  {
    question: 'Do you accept submissions?',
    answer:
      'Yes. The submit page covers what we look for. We pick motion that holds up in real product UI, not demo reels.',
  },
  {
    question: 'Can I share a prompt with my team?',
    answer:
      "On Pro, yes — your seat covers your team for client and commercial work. Sharing free prompts publicly isn't allowed; linking to the animation page always is.",
  },
];

export default function Faq() {
  return (
    <section>
      <Wrapper variant="standard" className="py-12">
        <div className="text-center">
          <Text
            tag="h2"
            variant="displayLG"
            className="text-base-900 font-display font-thin"
          >
            Frequently Asked Questions
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            Everything you need to know about Anemate.dev.
          </Text>
        </div>
        <Wrapper variant="narrow" className="mt-12">
          <div>
            {faqs.map((faq, i) => (
              <details key={i} className="group cursor-pointer">
                <summary className="text-sm leading-normal text-base-900 font-medium flex items-center justify-between w-full px-8 py-4 text-left select-none hover:text-accent-500 focus:text-accent-500">
                  {faq.question}
                  <Plus className="size-4 duration-300 ease-out transform group-open:-rotate-45" />
                </summary>
                <div className="py-4 px-8">
                  <Text tag="p" variant="textSM" className="text-base-600 text-balance">
                    {faq.answer}
                  </Text>
                </div>
              </details>
            ))}
          </div>
        </Wrapper>
      </Wrapper>
    </section>
  );
}
