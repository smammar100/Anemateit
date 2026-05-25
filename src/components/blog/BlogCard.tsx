import Link from 'next/link';
import Image from 'next/image';
import Text from '@/components/fundations/elements/Text';
import type { Post } from '#content';

export default function BlogCard({ post }: { post: Post }) {
  const url = `/blog/posts/${post.slug}`;
  const pubDate = post.pubDate.slice(0, 10);
  return (
    <article className="relative group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300">
      <Link href={url} title={post.title} className="absolute inset-0 z-10" />
      <div className="p-8 bg-base-50 rounded-lg">
        <Image
          width={500}
          height={500}
          src={post.image.url}
          alt={post.image.alt || post.title}
          loading="lazy"
          className="object-cover aspect-[8/5] w-full object-top rounded shadow"
        />
      </div>
      <div className="mt-4">
        <Text
          tag="p"
          variant="textXS"
          className="text-base-600 uppercase font-medium flex items-center gap-2"
        >
          <time dateTime={pubDate}>{pubDate}</time>
          <span aria-hidden="true" className="pointer-events-none">·</span>
          <span>{post.tags.join(', ')}</span>
        </Text>
        <Text
          tag="h3"
          variant="textSM"
          className="text-base-900 font-medium text-balance mt-2"
        >
          {post.title}
        </Text>
      </div>
    </article>
  );
}
