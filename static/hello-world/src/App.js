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
      const res = await invoke("export-page", { contentId });
      const blob = new Blob([res], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (err) {
      console.error("❌ PDF export failed:", err);
      alert("Something went wrong.");
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
