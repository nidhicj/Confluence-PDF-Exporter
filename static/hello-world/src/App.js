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
    const res = await fetch("https://confluence-pdf-exporter.onrender.com/knockPDF/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contentId })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ PDF generation failed:", errorText);
      alert("Failed to generate PDF: " + res.statusText);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url);
  } catch (err) {
    console.error("❌ Unexpected error during export:", err);
    alert("Something went wrong during PDF export.");
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
