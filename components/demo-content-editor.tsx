"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
const textSelector = "h1,h2,h3,p,a,button,li,figcaption";
function textNodes(doc: Document) {
  return Array.from(doc.querySelectorAll(textSelector)).filter(
    (node) => node.children.length === 0 && node.textContent?.trim(),
  );
}
export function DemoContentEditor({
  html,
  onApply,
}: {
  html: string;
  onApply: (html: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false),
    [copy, setCopy] = useState<string[]>([]),
    [images, setImages] = useState<string[]>([]),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  function begin() {
    const doc = new DOMParser().parseFromString(html, "text/html");
    setCopy(textNodes(doc).map((node) => node.textContent || ""));
    setImages(
      Array.from(doc.querySelectorAll("img")).map(
        (node) => node.getAttribute("src") || "",
      ),
    );
    setOpen(true);
  }
  async function apply() {
    if (saving) return;
    setSaving(true);
    setError("");
    if (
      images.some((src) => {
        if (
          /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(
            src,
          )
        )
          return false;
        try {
          const url = new URL(src);
          return (
            url.protocol !== "https:" || Boolean(url.username || url.password)
          );
        } catch {
          return true;
        }
      })
    ) {
      setError(
        "Use a complete HTTPS image URL or an embedded PNG, JPEG, or WebP image.",
      );
      setSaving(false);
      return;
    }
    const doc = new DOMParser().parseFromString(html, "text/html");
    textNodes(doc).forEach((node, index) => {
      node.textContent = copy[index] ?? node.textContent;
    });
    doc.querySelectorAll("img").forEach((node, index) => {
      node.setAttribute("src", images[index] || "");
      node.removeAttribute("srcset");
    });
    try {
      if (await onApply("<!doctype html>\n" + doc.documentElement.outerHTML))
        setOpen(false);
      else
        setError(
          "Changes were not saved. Retry from the workspace save notice.",
        );
    } catch {
      setError(
        "Changes could not be saved. Retry from the workspace save notice.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {open ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between gap-3">
            <h3 className="font-bold">Edit website copy and images</h3>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Discard edits
            </Button>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Changes create a saved version and require a fresh review before
            sharing. Only add facts and imagery you have permission to use.
          </p>
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {copy.map((text, index) => (
              <label className="block" key={index}>
                <span className="field-label">Text {index + 1}</span>
                <textarea
                  maxLength={4000}
                  className="field-input"
                  value={text}
                  onChange={(e) =>
                    setCopy((current) =>
                      current.map((value, i) =>
                        i === index ? e.target.value : value,
                      ),
                    )
                  }
                />
              </label>
            ))}
            {images.map((src, index) => (
              <label className="block" key={index}>
                <span className="field-label">Image {index + 1} URL</span>
                <input
                  className="field-input"
                  value={src}
                  onChange={(e) =>
                    setImages((current) =>
                      current.map((value, i) =>
                        i === index ? e.target.value : value,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button loading={saving} onClick={() => void apply()}>
            Save content changes
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Make it yours</h3>
            <p className="text-sm text-slate-500">
              Correct copy or replace an image without another AI call.
            </p>
          </div>
          <Button variant="outline" onClick={begin}>
            Edit copy & images
          </Button>
        </div>
      )}
    </div>
  );
}
