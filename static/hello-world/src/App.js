import React, { useEffect, useState } from 'react';
import { invoke, view } from '@forge/bridge';

function App() {
  const [contentId, setContentId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get contentId on component load
  useEffect(() => {
  view.getContext()
    .then((context) => {
      console.log("🔍 Full context:", context);
      const pageId = context?.extension?.content?.id;
      console.log("✅ Found contentId:", pageId);
      setContentId(pageId);
    })
    .catch((err) => {
      console.error("❌ Failed to get context:", err);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);



  const handleExport = async () => {
  if (!contentId) {
    alert("❌ Page ID not found.");
    return;
  }

  try {
    const res = await fetch('/api/export-page', {
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
        <p>Loading...</p>
      ) : (
        <button onClick={handleExport}>
          Download PDF
        </button>
      )}
    </div>
  );
}

export default App;
