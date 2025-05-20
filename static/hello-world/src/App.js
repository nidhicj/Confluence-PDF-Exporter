import React, { useEffect, useState } from 'react';
import { invoke, view } from '@forge/bridge';

function App() {
  const [contentId, setContentId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch page contentId when app loads
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const context = await view.getContext();
        console.log("🔍 Full context:", context);
        const pageId = context?.extension?.content?.id;
        if (!pageId) throw new Error("Page ID not found in context.");
        setContentId(pageId);
        console.log("✅ Found contentId:", pageId);
      } catch (error) {
        console.error("❌ Failed to get context:", error);
        alert("Unable to retrieve page context. Please reload the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, []);

  // PDF export handler
  const handleExport = async () => {
    if (!contentId) {
      alert("❌ Page ID not found.");
      return;
    }

    try {
      console.log("📤 Sending contentId to backend:", contentId);
      const res = await invoke('export-page', { contentId });
      console.log("📤 Got something like res:", res);
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;

      if (!parsed.filepath) {
        console.error("❌ No 'filepath' returned from backend:", parsed);
        alert("Something went wrong. Please try again later.");
        return;
      }

      const downloadUrl = `https://confluence-pdf-exporter.onrender.com${parsed.filepath}`;
      console.log("📥 Initiating download from:", downloadUrl);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = "confluence-page.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("❌ PDF export failed:", err);
      alert("Failed to generate and download PDF. Please check the logs or try again.");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h3>Export Page as PDF</h3>
      {loading ? (
        <p>Loading page context...</p>
      ) : (
        <button onClick={handleExport}>
          Download PDF
        </button>
      )}
    </div>
  );
}

export default App;
