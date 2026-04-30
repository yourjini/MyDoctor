declare module "heic-convert" {
  function convert(opts: {
    buffer: ArrayBuffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  }): Promise<ArrayBuffer>;
  export default convert;
}
