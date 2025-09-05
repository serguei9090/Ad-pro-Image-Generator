export enum AdStyle {
  Minimalist = "Minimalist & Clean",
  Bold = "Bold & Modern",
  Luxury = "Luxury & Elegant",
  Natural = "Natural & Organic",
  Futuristic = "Tech & Futuristic",
  Vintage = "Vintage & Retro",
}

export enum MediaObjective {
  InstagramPost = "Instagram Post (Square)",
  InstagramStory = "Instagram Story (Portrait)",
  FacebookPost = "Facebook Post (Landscape)",
  TikTokReel = "TikTok / Reel (Portrait)",
  LinkedInPost = "LinkedIn Post (Square)",
  Poster = "Poster (Portrait)",
  Widescreen = "Widescreen (16:9)",
}

export interface ImageData {
  base64: string;
  mimeType: string;
}