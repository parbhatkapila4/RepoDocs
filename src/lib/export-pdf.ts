"use client";

const MAX_CAPTURE_HEIGHT_PX = 15000;
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;
const PDF_PAGE_WIDTH_MM = 210;
const PDF_PAGE_HEIGHT_MM = 295;

function markdownToPrintHtml(md: string): string {
  let html = md
    .replace(
      /^#### (.*$)/gim,
      '<h4 style="font-size: 14pt; font-weight: bold; margin: 10pt 0 6pt 0; color: rgb(0, 0, 0);">$1</h4>'
    )
    .replace(
      /^### (.*$)/gim,
      '<h3 style="font-size: 16pt; font-weight: bold; margin: 12pt 0 8pt 0; color: rgb(0, 0, 0);">$1</h3>'
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 style="font-size: 20pt; font-weight: bold; margin: 14pt 0 10pt 0; color: rgb(0, 0, 0);">$1</h2>'
    )
    .replace(
      /^# (.*$)/gim,
      '<h1 style="font-size: 24pt; font-weight: bold; margin: 16pt 0 12pt 0; border-bottom: 1px solid rgb(204, 204, 204); padding-bottom: 8pt; color: rgb(0, 0, 0);">$1</h1>'
    )
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, (_match, _lang, code) => {
      return `<pre style="background-color: rgb(245, 245, 245); padding: 12pt; border-radius: 4pt; font-family: monospace; font-size: 10pt; border: 1px solid rgb(221, 221, 221); margin: 8pt 0; overflow-x: auto;"><code style="color: rgb(0, 0, 0);">${code.trim()}</code></pre>`;
    })
    .replace(
      /`([^`\n]+)`/gim,
      '<code style="background-color: rgb(245, 245, 245); padding: 2pt 4pt; border-radius: 3pt; font-family: monospace; font-size: 11pt; color: rgb(0, 0, 0);">$1</code>'
    )
    .replace(
      /\*\*(.*?)\*\*/gim,
      '<strong style="font-weight: bold;">$1</strong>'
    )
    .replace(
      /(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/gim,
      '<em style="font-style: italic;">$1</em>'
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/gim,
      '<a href="$2" style="color: rgb(0, 102, 204); text-decoration: underline;">$1</a>'
    )
    .replace(
      /^---$/gim,
      '<hr style="border: none; border-top: 1px solid rgb(204, 204, 204); margin: 16pt 0;">'
    )
    .replace(
      /^> (.*$)/gim,
      '<blockquote style="border-left: 4px solid rgb(204, 204, 204); padding-left: 12pt; margin: 8pt 0; color: rgb(102, 102, 102); font-style: italic;">$1</blockquote>'
    )
    .replace(
      /^[\*\-\+] (.+)$/gim,
      '<li style="margin: 4pt 0; color: rgb(0, 0, 0);">$1</li>'
    )
    .replace(
      /^\d+\. (.+)$/gim,
      '<li style="margin: 4pt 0; color: rgb(0, 0, 0);">$1</li>'
    )
    .replace(
      /\n\n+/gim,
      '</p><p style="margin: 8pt 0; color: rgb(0, 0, 0);">'
    )
    .replace(/\n/gim, "<br>");

  html = html.replace(/(<li[^>]*>.*?<\/li>)/gim, (_match, content) => {
    if (!content.includes("<ul") && !content.includes("<ol")) {
      return `<ul style="margin: 8pt 0; padding-left: 24pt; color: rgb(0, 0, 0);">${content}</ul>`;
    }
    return content;
  });

  if (!html.trim().startsWith("<")) {
    html = `<p style="margin: 8pt 0; color: rgb(0, 0, 0);">${html}</p>`;
  }

  return html;
}

const PRINT_DOCUMENT_TEMPLATE = (htmlContent: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: ${PAGE_WIDTH_PX}px;
        padding: 40px;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12pt;
        line-height: 1.6;
        color: rgb(0, 0, 0);
        background-color: rgb(255, 255, 255);
      }
      h1, h2, h3, h4, h5, h6, p, code, pre, li { color: rgb(0, 0, 0); }
      p { margin: 8pt 0; }
      a { color: rgb(0, 102, 204); }
      table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
      th, td { border: 1px solid rgb(221, 221, 221); padding: 6pt; color: rgb(0, 0, 0); }
      th { background-color: rgb(245, 245, 245); font-weight: bold; }
    </style>
  </head>
  <body>${htmlContent}</body>
</html>`;

export async function exportMarkdownToPdf({
  markdown,
  fileName,
}: {
  markdown: string;
  fileName: string;
}): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.width = `${PAGE_WIDTH_PX}px`;
  iframe.style.height = `${PAGE_HEIGHT_PX}px`;
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const removeIframe = () => {
    if (iframe.parentNode) {
      try {
        document.body.removeChild(iframe);
      } catch {
        // ignore
      }
    }
  };

  try {
    const iframeDoc =
      iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error(
        "Could not access iframe document. PDF export may be blocked in this environment."
      );
    }

    const htmlContent = markdownToPrintHtml(markdown);
    iframeDoc.open();
    iframeDoc.write(PRINT_DOCUMENT_TEMPLATE(htmlContent));
    iframeDoc.close();

    await new Promise((resolve) => setTimeout(resolve, 500));

    const captureHeight = Math.min(
      iframeDoc.body.scrollHeight,
      MAX_CAPTURE_HEIGHT_PX
    );

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: PAGE_WIDTH_PX,
      height: captureHeight,
      windowHeight: captureHeight,
    });

    let imgData: string;
    try {
      imgData = canvas.toDataURL("image/png");
    } catch {
      throw new Error(
        "PDF export failed: canvas export not allowed. Try downloading as Markdown."
      );
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgHeight = (canvas.height * PDF_PAGE_WIDTH_MM) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, PDF_PAGE_WIDTH_MM, imgHeight);
    heightLeft -= PDF_PAGE_HEIGHT_MM;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, PDF_PAGE_WIDTH_MM, imgHeight);
      heightLeft -= PDF_PAGE_HEIGHT_MM;
    }

    pdf.save(fileName);
  } finally {
    removeIframe();
  }
}
