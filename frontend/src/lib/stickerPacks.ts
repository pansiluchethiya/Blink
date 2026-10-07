export interface BuiltInSticker {
  id: string;
  src: string;
  alt: string;
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: BuiltInSticker[];
}

const CDN = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72";

function twemoji(codepoint: string, alt: string): BuiltInSticker {
  return { id: codepoint.toLowerCase(), src: `${CDN}/${codepoint.toLowerCase()}.png`, alt };
}

export const STICKER_PACKS: StickerPack[] = [
  {
    id: "twemoji-smileys",
    name: "Smileys",
    stickers: [
      twemoji("1f602", "😂"),
      twemoji("1f60d", "😍"),
      twemoji("1f622", "😢"),
      twemoji("1f621", "😡"),
      twemoji("1f44d", "👍"),
      twemoji("1f44e", "👎"),
      twemoji("1f64f", "🙏"),
      twemoji("2764", "❤️"),
      twemoji("1f60e", "😎"),
      twemoji("1f62d", "😭"),
      twemoji("1f631", "😱"),
      twemoji("1f389", "🎉"),
      twemoji("1f525", "🔥"),
      twemoji("1f44c", "👌"),
      twemoji("1f44f", "👏"),
      twemoji("1f606", "😆"),
      twemoji("1f609", "😉"),
      twemoji("1f62e", "😮"),
      twemoji("1f630", "😰"),
      twemoji("1f614", "😔"),
      twemoji("1f618", "😘"),
      twemoji("1f61c", "😜"),
      twemoji("1f923", "🤣"),
      twemoji("1f49c", "💜"),
    ],
  },
];
