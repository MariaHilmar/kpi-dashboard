import type { ImgHTMLAttributes } from "react";

export default function MockImage({
  src,
  alt,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { src: string | { src: string } }) {
  const resolved = typeof src === "string" ? src : src.src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolved} alt={alt ?? ""} {...rest} />;
}
