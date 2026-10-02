"use client";

/** Turn an off-screen DOM node into a PNG: native share sheet on phones, download elsewhere. */
export async function saveNodeAsPng(node: HTMLElement, filename: string, title = "Pīzhù 批注") {
  const { toPng } = await import("html-to-image");
  const url = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const blob = await (await fetch(url)).blob();
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
