declare module 'bwip-js' {
  interface RenderOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: string;
    textsize?: number;
    padding?: number;
    paddingwidth?: number;
    paddingheight?: number;
    backgroundcolor?: string;
    barcolor?: string;
    textcolor?: string;
    rotate?: 'N' | 'R' | 'L' | 'I';
    monochrome?: boolean;
  }

  function toCanvas(canvas: HTMLCanvasElement, opts: RenderOptions): HTMLCanvasElement;
  function toSVG(opts: RenderOptions): string;

  export default { toCanvas, toSVG };
  export { toCanvas, toSVG, RenderOptions };
}
