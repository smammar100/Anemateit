import { sites } from '#content';
import SearchClient from './SearchClient';

export default function Search() {
  const posts = sites.map((post) => ({
    title: post.title,
    tagline: post.tagline,
    id: post.slug,
  }));
  return <SearchClient posts={posts} />;
}
