// src/utils/blogContent.ts
import type { BlogItem } from '../types/patient';

const blogMemoryCache = new Map<string, BlogItem>();

export function cacheBlogItems(items: BlogItem[]): void {
  for (const item of items) {
    if (item?._id) {
      blogMemoryCache.set(item._id, item);
    }
  }
}

export function getCachedBlogItem(id: string): BlogItem | undefined {
  return blogMemoryCache.get(id);
}

export interface BlogCategoryOption {
  value: string;
  label: string;
  aliases?: string[];
}

export const BLOG_CATEGORY_OPTIONS: BlogCategoryOption[] = [
  { value: 'all', label: 'All Topics' },
  { value: 'health', label: 'Health Tips' },
  { value: 'herbs', label: 'Herbs & Remedies', aliases: ['herbs-spices'] },
  { value: 'diet', label: 'Diet & Nutrition' },
  { value: 'yoga', label: 'Yoga & Meditation' },
  { value: 'lifestyle', label: 'Lifestyle', aliases: ['daily-routine'] },
  { value: 'ayurveda basics', label: 'Ayurveda Basics', aliases: ['ayurveda-basics'] },
  { value: 'digestion', label: 'Digestion' },
  { value: 'immunity', label: 'Immunity Boosters' },
  { value: 'skin-hair', label: 'Skin & Hair', aliases: ['beauty-skincare'] },
  { value: 'mental-wellness', label: 'Mental Wellness' },
  { value: 'detox-panchakarma', label: 'Detox & Panchakarma' },
  { value: 'seasonal-care', label: 'Seasonal Care' },
  { value: 'home-remedies', label: 'Home Remedies' },
  { value: 'womens-health', label: "Women's Health" },
  { value: 'disease management', label: 'Disease Management', aliases: ['chronic-conditions'] },
  { value: 'wellness', label: 'Wellness' },
  { value: 'sleep-relaxation', label: 'Sleep & Relaxation' },
  { value: 'massage-oils', label: 'Oils & Massage' },
  { value: 'kids-family', label: 'Kids & Family' },
];

export interface ExtractedVideo {
  id: string;
  watchUrl: string;
  thumbnailUrl?: string;
  title?: string;
  source: 'youtube' | 'video';
}

export interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

export type BlogBlock =
  | { type: 'heading'; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { type: 'paragraph'; spans: InlineSpan[] }
  | { type: 'blockquote'; spans: InlineSpan[] }
  | { type: 'list-item'; ordered: boolean; index: number; spans: InlineSpan[] }
  | { type: 'image'; url: string; alt?: string }
  | { type: 'video'; video: ExtractedVideo };

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  hellip: '…',
};

export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, num) => {
      const code = Number(num);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtube-nocookie\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  return match ? match[1] : null;
}

export function resolveRemoteImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

export function isVideoBlog(item?: BlogItem | null): boolean {
  if (!item) return false;
  return (
    item.type === 'Video' ||
    Boolean(item.videos?.length) ||
    Boolean(item.embeds?.some((e) => e.type === 'youtube')) ||
    /<iframe|<video/i.test(item.description || '')
  );
}

export function getBlogTags(item?: BlogItem | null): string[] {
  if (!item) return [];
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags.map((t) => t.trim()).filter(Boolean);
  }
  if (typeof item.category === 'string' && item.category.trim()) {
    return item.category
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function getBlogAuthor(item?: BlogItem | null): string {
  if (!item) return 'Ayurvedic Expert';
  if (item.authorName && item.authorName.trim()) return item.authorName.trim();
  if (item.user?.name && item.user.name.trim()) return item.user.name.trim();
  return 'Ayurvedic Expert';
}

export function formatBlogDate(dateStr?: string, fallback = 'Recent'): string {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function stripHtmlPreview(html?: string, maxLen = 110): string {
  if (!html) return 'Explore Ayurvedic insights and clinical guidance.';
  const text = decodeHtmlEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 'Watch or read this Ayurvedic wellness feature.';
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text;
}

export function extractBlogVideos(item: BlogItem): ExtractedVideo[] {
  const results: ExtractedVideo[] = [];
  const seen = new Set<string>();

  const addVideo = (video: ExtractedVideo) => {
    if (seen.has(video.watchUrl)) return;
    seen.add(video.watchUrl);
    results.push(video);
  };

  for (const embed of item.embeds || []) {
    if (embed.type === 'youtube' && embed.embedCode) {
      const ytId = extractYouTubeId(embed.embedCode) || embed.embedCode.trim();
      if (ytId) {
        addVideo({
          id: `yt-${ytId}`,
          watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          source: 'youtube',
        });
      }
    } else if (embed.url) {
      const ytId = extractYouTubeId(embed.url);
      addVideo({
        id: ytId ? `yt-${ytId}` : `embed-${results.length}`,
        watchUrl: ytId ? `https://www.youtube.com/watch?v=${ytId}` : embed.url,
        thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined,
        source: ytId ? 'youtube' : 'video',
      });
    }
  }

  for (const v of item.videos || []) {
    if (!v.url) continue;
    const ytId = extractYouTubeId(v.url);
    addVideo({
      id: ytId ? `yt-${ytId}` : `vid-${results.length}`,
      watchUrl: ytId ? `https://www.youtube.com/watch?v=${ytId}` : v.url,
      thumbnailUrl:
        resolveRemoteImageUrl(v.thumbnail) ||
        (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined),
      title: v.title,
      source: ytId ? 'youtube' : 'video',
    });
  }

  const html = item.description || '';
  const srcRegex = /<(?:iframe|video|source)[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = srcRegex.exec(html)) !== null) {
    const rawUrl = decodeHtmlEntities(match[1]);
    const ytId = extractYouTubeId(rawUrl);
    if (ytId) {
      addVideo({
        id: `yt-${ytId}`,
        watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        source: 'youtube',
      });
    } else if (/^https?:\/\//i.test(rawUrl)) {
      addVideo({
        id: `html-vid-${results.length}`,
        watchUrl: rawUrl,
        source: 'video',
      });
    }
  }

  return results;
}

export function getBlogCardThumbnail(item: BlogItem): string | null {
  const direct = resolveRemoteImageUrl(item.image);
  if (direct) return direct;
  const videos = extractBlogVideos(item);
  return videos.find((v) => v.thumbnailUrl)?.thumbnailUrl || null;
}

function parseInlineSpans(htmlFragment: string): InlineSpan[] {
  const normalized = htmlFragment.replace(/<br\s*\/?>/gi, '\n');
  const tokenRegex = /(<\/?(?:strong|b|em|i|code|a)(?:\s+[^>]*)?>)|(<[^>]+>)|([^<]+)/gi;
  const spans: InlineSpan[] = [];

  let bold = false;
  let italic = false;
  let code = false;
  let href: string | undefined;

  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(normalized)) !== null) {
    const tagToken = m[1];
    const otherTag = m[2];
    const textToken = m[3];

    if (tagToken) {
      const lower = tagToken.toLowerCase();
      if (lower.startsWith('<strong') || lower === '<b>') bold = true;
      else if (lower === '</strong>' || lower === '</b>') bold = false;
      else if (lower.startsWith('<em') || lower === '<i>') italic = true;
      else if (lower === '</em>' || lower === '</i>') italic = false;
      else if (lower.startsWith('<code')) code = true;
      else if (lower === '</code>') code = false;
      else if (lower.startsWith('<a')) {
        const hrefMatch = tagToken.match(/href=["']([^"']+)["']/i);
        href = hrefMatch ? decodeHtmlEntities(hrefMatch[1]) : undefined;
      } else if (lower === '</a>') {
        href = undefined;
      }
      continue;
    }

    if (otherTag) {
      continue;
    }

    if (textToken) {
      const decoded = decodeHtmlEntities(textToken).replace(/[ \t\r\f]+/g, ' ');
      if (decoded) {
        spans.push({
          text: decoded,
          bold,
          italic,
          code,
          href,
        });
      }
    }
  }

  // Trim leading/trailing space across the first/last span
  if (spans.length > 0) {
    spans[0].text = spans[0].text.replace(/^\s+/, '');
    spans[spans.length - 1].text = spans[spans.length - 1].text.replace(/\s+$/, '');
  }

  return spans.filter((s) => s.text.length > 0);
}

export function parseBlogHtml(html: string): BlogBlock[] {
  if (!html || !html.trim()) return [];

  const cleaned = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');

  const blocks: BlogBlock[] = [];
  let orderedCounter = 0;
  let inOrderedList = false;

  // Walk top-level/meaningful tags sequentially, tracking <ol>/<ul> context
  const seqRegex =
    /<(\/?)(ol|ul)\b[^>]*>|<(h1|h2|h3|h4|p|blockquote|li)\b[^>]*>([\s\S]*?)<\/\3>|<(img)\b([^>]*?)\/?>|<(iframe|video)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\7>)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushLooseText = (raw: string) => {
    const spans = parseInlineSpans(raw);
    if (spans.length > 0) {
      blocks.push({ type: 'paragraph', spans });
    }
  };

  while ((match = seqRegex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      const between = cleaned.slice(lastIndex, match.index);
      if (between.replace(/<[^>]+>/g, '').trim()) {
        pushLooseText(between);
      }
    }
    lastIndex = seqRegex.lastIndex;

    const listSlash = match[1];
    const listTag = match[2]?.toLowerCase();
    const textTag = match[3]?.toLowerCase();
    const textInner = match[4];
    const imgTag = match[5];
    const imgAttrs = match[6];
    const mediaTag = match[7]?.toLowerCase();
    const mediaAttrs = match[8];
    const mediaInner = match[9];

    if (listTag) {
      if (listTag === 'ol') {
        inOrderedList = listSlash !== '/';
        if (!listSlash) orderedCounter = 0;
      } else if (listTag === 'ul' && !listSlash) {
        inOrderedList = false;
      }
      continue;
    }

    if (textTag && textInner !== undefined) {
      // Extract any nested images inside <p>
      const imgInInner = textInner.match(/<img\b([^>]*?)\/?>/gi);
      const spans = parseInlineSpans(textInner);

      if (textTag === 'h1') {
        if (spans.length) blocks.push({ type: 'heading', level: 1, spans });
      } else if (textTag === 'h2') {
        if (spans.length) blocks.push({ type: 'heading', level: 2, spans });
      } else if (textTag === 'h3' || textTag === 'h4') {
        if (spans.length) blocks.push({ type: 'heading', level: 3, spans });
      } else if (textTag === 'blockquote') {
        if (spans.length) blocks.push({ type: 'blockquote', spans });
      } else if (textTag === 'li') {
        if (spans.length) {
          orderedCounter += 1;
          blocks.push({
            type: 'list-item',
            ordered: inOrderedList,
            index: orderedCounter,
            spans,
          });
        }
      } else if (spans.length) {
        blocks.push({ type: 'paragraph', spans });
      }

      if (imgInInner) {
        for (const tag of imgInInner) {
          const srcM = tag.match(/src=["']([^"']+)["']/i);
          const altM = tag.match(/alt=["']([^"']*)["']/i);
          const url = resolveRemoteImageUrl(srcM?.[1]);
          if (url) {
            blocks.push({ type: 'image', url, alt: altM ? decodeHtmlEntities(altM[1]) : undefined });
          }
        }
      }
      continue;
    }

    if (imgTag && imgAttrs !== undefined) {
      const srcM = imgAttrs.match(/src=["']([^"']+)["']/i);
      const altM = imgAttrs.match(/alt=["']([^"']*)["']/i);
      const url = resolveRemoteImageUrl(srcM?.[1]);
      if (url) {
        blocks.push({ type: 'image', url, alt: altM ? decodeHtmlEntities(altM[1]) : undefined });
      }
      continue;
    }

    if (mediaTag && mediaAttrs !== undefined) {
      const combined = `${mediaAttrs} ${mediaInner || ''}`;
      const srcM = combined.match(/src=["']([^"']+)["']/i);
      const rawUrl = srcM ? decodeHtmlEntities(srcM[1]) : '';
      const ytId = extractYouTubeId(rawUrl);
      if (ytId) {
        blocks.push({
          type: 'video',
          video: {
            id: `inline-yt-${ytId}-${blocks.length}`,
            watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            source: 'youtube',
          },
        });
      } else if (/^https?:\/\//i.test(rawUrl)) {
        blocks.push({
          type: 'video',
          video: {
            id: `inline-vid-${blocks.length}`,
            watchUrl: rawUrl,
            source: 'video',
          },
        });
      }
    }
  }

  if (lastIndex < cleaned.length) {
    const tail = cleaned.slice(lastIndex);
    if (tail.replace(/<[^>]+>/g, '').trim()) {
      pushLooseText(tail);
    }
  }

  // Fallback if HTML had no recognized tags at all
  if (blocks.length === 0) {
    const fallbackText = stripHtmlPreview(cleaned, 5000);
    if (fallbackText) {
      blocks.push({ type: 'paragraph', spans: [{ text: fallbackText }] });
    }
  }

  return blocks;
}
