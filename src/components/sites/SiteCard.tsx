import Link from 'next/link';
import Image from 'next/image';
import Text from '@/components/fundations/elements/Text';
import type { Site } from '#content';

export default function SiteCard({ post }: { post: Site }) {
  const url = `/sites/site/${post.slug}`;
  return (
    <div className="group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300 group">
      <div className="relative p-8 bg-base-50 rounded-lg">
        <Image
          width={900}
          height={900}
          src={post.thumbnail.url}
          alt={post.thumbnail.alt}
          className="object-cover aspect-[8/5] w-full object-top rounded shadow"
        />
        <Link href={url} title={post.title}>
          <span className="absolute inset-0"></span>
        </Link>
      </div>
      <div className="flex items-center mt-2 gap-2">
        <Text tag="h3" variant="textSM" className="text-base-600 capitalize">
          {post.title}
        </Text>
      </div>
    </div>
  );
}
