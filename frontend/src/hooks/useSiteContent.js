import React from "react";
import { defaultContent } from "../data/defaultContent";

const STORAGE_KEY = "jobfinder_site_content_v1";
const API_BASE = "http://localhost:4000/api";

export function useSiteContent() {
  const [isReady, setIsReady] = React.useState(false);
  const [content, setContent] = React.useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultContent;
      return JSON.parse(raw);
    } catch {
      return defaultContent;
    }
  });

  React.useEffect(() => {
    const fetchRemoteContent = async () => {
      try {
        const response = await fetch(`${API_BASE}/content`);
        const data = await response.json();
        if (data.ok && data.content) {
          setContent(data.content);
        }
      } catch {
        // Keep local fallback content when API is unavailable.
      } finally {
        setIsReady(true);
      }
    };

    fetchRemoteContent();
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  }, [content]);

  const saveContent = async (nextContent) => {
    const response = await fetch(`${API_BASE}/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: nextContent })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to save content.");
    }

    setContent(data.content || nextContent);
  };

  const resetContent = async () => {
    await saveContent(defaultContent);
  };

  return { content, saveContent, resetContent, isReady };
}
