// src/components/blog/BlogRichContent.tsx
import React, { useMemo } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, Play } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import {
  BlogBlock,
  ExtractedVideo,
  InlineSpan,
  parseBlogHtml,
} from '../../utils/blogContent';

export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: Colors.cream,
      controlsColor: Colors.oliveDeep,
    });
  } catch {
    Linking.openURL(url).catch(() => {});
  }
}

export function VideoWatchCard({
  video,
  label = 'Watch Video',
}: {
  video: ExtractedVideo;
  label?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.videoCard}
      activeOpacity={0.85}
      onPress={() => openExternalUrl(video.watchUrl)}
      accessibilityRole="button"
      accessibilityLabel={video.title || label}
    >
      <View style={styles.videoThumbWrap}>
        {video.thumbnailUrl ? (
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.videoThumb}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.videoThumbFallback} />
        )}
        <View style={styles.videoOverlay}>
          <View style={styles.playCircle}>
            <Play size={22} color="#ffffff" fill="#ffffff" />
          </View>
        </View>
        <View style={styles.videoBadge}>
          <Text style={styles.videoBadgeText}>
            {video.source === 'youtube' ? 'YouTube Video' : 'Video'}
          </Text>
        </View>
      </View>
      <View style={styles.videoFooter}>
        <Text style={styles.videoTitle} numberOfLines={1}>
          {video.title || label}
        </Text>
        <View style={styles.videoCtaRow}>
          <Text style={styles.videoCtaText}>Play in Browser</Text>
          <ExternalLink size={13} color={Colors.oliveAction} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SpanText({
  spans,
  baseStyle,
}: {
  spans: InlineSpan[];
  baseStyle?: object;
}) {
  return (
    <Text style={[styles.paragraph, baseStyle]}>
      {spans.map((span, idx) => {
        const spanStyle = [
          span.bold && styles.bold,
          span.italic && styles.italic,
          span.code && styles.code,
          span.href && styles.link,
        ];

        if (span.href) {
          return (
            <Text
              key={idx}
              style={spanStyle}
              onPress={() => openExternalUrl(span.href!)}
            >
              {span.text}
            </Text>
          );
        }

        return (
          <Text key={idx} style={spanStyle}>
            {span.text}
          </Text>
        );
      })}
    </Text>
  );
}

export function BlogRichContent({ html }: { html: string }) {
  const blocks: BlogBlock[] = useMemo(() => parseBlogHtml(html), [html]);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const headingStyle =
              block.level === 1
                ? styles.h1
                : block.level === 2
                  ? styles.h2
                  : styles.h3;
            return <SpanText key={index} spans={block.spans} baseStyle={headingStyle} />;
          }

          case 'paragraph':
            return <SpanText key={index} spans={block.spans} />;

          case 'blockquote':
            return (
              <View key={index} style={styles.blockquote}>
                <SpanText spans={block.spans} baseStyle={styles.blockquoteText} />
              </View>
            );

          case 'list-item':
            return (
              <View key={index} style={styles.listRow}>
                <Text style={styles.listMarker}>
                  {block.ordered ? `${block.index}.` : '•'}
                </Text>
                <View style={styles.listContent}>
                  <SpanText spans={block.spans} baseStyle={styles.listText} />
                </View>
              </View>
            );

          case 'image':
            return (
              <View key={index} style={styles.imageWrap}>
                <Image
                  source={{ uri: block.url }}
                  style={styles.inlineImage}
                  resizeMode="cover"
                />
                {block.alt ? <Text style={styles.imageAlt}>{block.alt}</Text> : null}
              </View>
            );

          case 'video':
            return <VideoWatchCard key={index} video={block.video} />;

          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.ink,
  },
  h1: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginTop: 8,
  },
  h2: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '800',
    color: Colors.oliveDeep,
    marginTop: 6,
  },
  h3: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    color: Colors.inkStrong,
    marginTop: 4,
  },
  bold: {
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  italic: {
    fontStyle: 'italic',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: Colors.sagePale,
    color: Colors.oliveDeep,
    fontSize: 13,
  },
  link: {
    color: Colors.oliveAction,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.turmericGold,
    backgroundColor: Colors.creamTint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  blockquoteText: {
    fontStyle: 'italic',
    color: Colors.inkMuted,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  listMarker: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
    color: Colors.oliveAction,
    minWidth: 16,
  },
  listContent: {
    flex: 1,
  },
  listText: {
    fontSize: 15,
    lineHeight: 23,
  },
  imageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.sagePale,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inlineImage: {
    width: '100%',
    height: 200,
  },
  imageAlt: {
    fontSize: 12,
    color: Colors.inkMuted,
    padding: 8,
    textAlign: 'center',
  },
  videoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  videoThumbWrap: {
    position: 'relative',
    height: 185,
    backgroundColor: Colors.oliveDeep,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  videoThumbFallback: {
    flex: 1,
    backgroundColor: Colors.oliveDeep,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.oliveAction,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  videoBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(47,53,36,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  videoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  videoTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.inkStrong,
  },
  videoCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.oliveAction,
  },
});
