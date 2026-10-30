import { z } from "zod";

export const BlockTypeEnum = z.enum([
  "heading",
  "text",
  "image",
  "gallery",
  "banner",
  "bullet_list",
  "image_text",
  "text_image",
  "video",
]);

export type BlockType = z.infer<typeof BlockTypeEnum>;

export const HeadingBlockSchema = z.object({
  id: z.string(),
  type: z.literal("heading"),
  content: z.string().min(1, "Heading text is required"),
  level: z.enum(["h1", "h2", "h3"]).default("h2"),
});

export const TextBlockSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  content: z.string().min(1, "Text content is required"),
});

export const ImageBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  url: z.string().url("Valid image URL is required"),
  alt: z.string().optional().default(""),
  caption: z.string().optional().default(""),
});

export const GalleryBlockSchema = z.object({
  id: z.string(),
  type: z.literal("gallery"),
  images: z.array(
    z.object({
      url: z.string().url(),
      alt: z.string().optional().default(""),
      caption: z.string().optional().default(""),
    })
  ).min(1, "At least one image is required for gallery"),
});

export const BannerBlockSchema = z.object({
  id: z.string(),
  type: z.literal("banner"),
  imageUrl: z.string().url("Banner image URL is required"),
  title: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  link: z.string().optional().default(""),
});

export const BulletListBlockSchema = z.object({
  id: z.string(),
  type: z.literal("bullet_list"),
  items: z.array(z.string().min(1, "Item cannot be empty")).min(1, "At least one list item is required"),
});

export const ImageTextBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image_text"),
  imageUrl: z.string().url("Image URL is required"),
  alt: z.string().optional().default(""),
  heading: z.string().optional().default(""),
  text: z.string().min(1, "Text content is required"),
  imagePosition: z.enum(["left", "right"]).default("left"),
});

export const TextImageBlockSchema = z.object({
  id: z.string(),
  type: z.literal("text_image"),
  imageUrl: z.string().url("Image URL is required"),
  alt: z.string().optional().default(""),
  heading: z.string().optional().default(""),
  text: z.string().min(1, "Text content is required"),
  imagePosition: z.enum(["left", "right"]).default("right"),
});

export const VideoBlockSchema = z.object({
  id: z.string(),
  type: z.literal("video"),
  videoUrl: z.string().url("Valid video URL is required"),
  caption: z.string().optional().default(""),
});

export const DetailBlockSchema = z.discriminatedUnion("type", [
  HeadingBlockSchema,
  TextBlockSchema,
  ImageBlockSchema,
  GalleryBlockSchema,
  BannerBlockSchema,
  BulletListBlockSchema,
  ImageTextBlockSchema,
  TextImageBlockSchema,
  VideoBlockSchema,
]);

export const ProductDetailsSchema = z.object({
  blocks: z.array(DetailBlockSchema),
});

export type DetailBlock = z.infer<typeof DetailBlockSchema>;
export type ProductDetailsPayload = z.infer<typeof ProductDetailsSchema>;