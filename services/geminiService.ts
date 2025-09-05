import { GoogleGenAI } from "@google/genai";
import { AdStyle, ImageData, MediaObjective } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const objectiveToAspectRatio: Record<MediaObjective, "1:1" | "3:4" | "4:3" | "9:16" | "16:9"> = {
  [MediaObjective.InstagramPost]: '1:1',
  [MediaObjective.LinkedInPost]: '1:1',
  [MediaObjective.Poster]: '3:4',
  [MediaObjective.FacebookPost]: '4:3',
  [MediaObjective.InstagramStory]: '9:16',
  [MediaObjective.TikTokReel]: '9:16',
  [MediaObjective.Widescreen]: '16:9',
};

// Helper function to get text description from an image
const getImageDescription = async (image: ImageData, prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
        { text: prompt },
      ],
    },
  });
  return response.text;
};

export const generateAdCreative = async (
  productImage: ImageData,
  style: AdStyle,
  mediaObjective: MediaObjective,
  secondaryImage: ImageData | null
): Promise<{ imageUrl: string, adCopy: string }> => {
  try {
    // 1. Get description of the product image
    const productDescription = await getImageDescription(
      productImage,
      "Concisely describe the main subject of this image for a photorealistic AI image generator. Focus on what it is, its color, and key visual attributes. For example: 'A sleek, matte black wireless headphone'."
    );

    // 2. Get description of the style image, if it exists
    let styleDescription = "";
    if (secondaryImage) {
      styleDescription = await getImageDescription(
        secondaryImage,
        "Describe the style, mood, environment, and color palette of this image."
      );
    }
    
    // 3. Construct the master prompt for the image generation model
    let masterPrompt = `A professional, photorealistic advertisement image of ${productDescription}. The overall aesthetic should be ${style.toLowerCase()}.`;
    if (styleDescription) {
      masterPrompt += ` The scene, lighting, and background should be inspired by this description: ${styleDescription}.`;
    }
    masterPrompt += " The product should be the clear focus. Do not include any text in the image.";

    // 4. Generate the ad image
    const imageResponse = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: masterPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: objectiveToAspectRatio[mediaObjective],
      },
    });

    const generatedImage = imageResponse.generatedImages?.[0];
    if (!generatedImage?.image?.imageBytes) {
      throw new Error("Image generation failed to return an image.");
    }
    const imageUrl = `data:image/png;base64,${generatedImage.image.imageBytes}`;

    // 5. Generate the ad copy
    const adCopyPrompt = `You are a social media marketing expert. Based on an ad featuring "${productDescription}" with a "${style}" style, write a short, engaging caption for a social media post. Include 3-5 relevant hashtags. Keep the tone appropriate for the style.`;
    const adCopyResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: adCopyPrompt,
    });
    const adCopy = adCopyResponse.text;

    return { imageUrl, adCopy };

  } catch (error) {
    console.error("Error generating ad creative:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes('deadline') || errorMessage.includes('timeout')) {
        throw new Error("The request timed out. Please try again.");
    }
    if (errorMessage.includes('API key')) {
        throw new Error("Invalid API key. Please check your configuration.");
    }
    throw new Error("Failed to generate ad creative. The model may be busy or the request could not be processed.");
  }
};