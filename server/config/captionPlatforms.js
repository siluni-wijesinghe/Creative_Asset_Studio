// Platform behavior lives in normal code, not in the AI.
// These numbers are OUR prototype presets, not official platform rules.
// Change them here and the whole app follows.
export const captionPlatforms = {
  instagram: {
    name: "Instagram",
    maxChars: 600,   // caption + hashtags together
    hashtags: 8,     // most hashtags we will keep
    emoji: "Use up to 2 emojis.",
    style:
      "Short, visual and conversational. Start with a hook that draws attention. Lead with the most appealing visible detail.",
  },
  facebook: {
    name: "Facebook",
    maxChars: 500,
    hashtags: 0,     // no hashtags on Facebook
    emoji: "Use up to 2 emojis.",
    style:
      "Friendly and community-minded. 1-3 short sentences. May end with a simple, gentle question.",
  },
};