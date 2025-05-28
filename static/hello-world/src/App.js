import React, { useEffect, useState, useRef } from 'react';
import { invoke, view } from '@forge/bridge';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";


function App() {
  const [contentId, setContentId] = useState(null);
  const [spaceKey, setSpaceKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef();

  const [transformedHtml, setTransformedHtml] = useState("");
  const [error, setError]               = useState(null);


  // console.log("🔍 App loaded new Code");
  // Fetch page contentId when app loads
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const context = await view.getContext();
        console.log("🔍 Full context:", context);
        const pageId = context?.extension?.content?.id;
        const spaceKey = context?.extension?.space?.key;
        
        if ((!pageId) && (!spaceKey) ) throw new Error("Page ID or SpaceKey not found in context.");
        
        setContentId(pageId);
        setSpaceKey(spaceKey);

        console.log("✅ Found contentId and spaceKey", pageId, spaceKey);
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
   
  
    console.log("📤 Sending contentId and spaceKey to backend:", contentId, spaceKey);
    try {
    // 2. Fetch transformed HTML
    const result = await invoke(
      "exportHandler",
      { contentId }
    );
    console.log("▶ raw invoke result:", result);
    setTransformedHtml(result.transformedHtml || "");
    setError(result.error);
    console.log("📤 Frontend Transformed HTML - labababab:", transformedHtml);
    console.log("📤 Frontend Error:",error);
    if (error) {
      alert(error);
      return;
    }

    // 3. Inject into hidden div
    console.log("containerRef", containerRef);  
    containerRef.current.innerHTML = transformedHtml;

    // 4. Render to canvas
    const canvas = await html2canvas(containerRef.current, {
      scale: 2,           // higher resolution
      useCORS: true,      // if images are cross-origin
    });

    // 5. Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight =
      (canvas.height * pdfWidth) / canvas.width;containerRef.current.innerHTML = transformedHtml;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // 6. Trigger download
    pdf.save(`page-${contentId}.pdf`);

    // 7. Clean up
    containerRef.current.innerHTML = "";
    }catch (err) {
      console.error("[UI] ❌ invoke threw:", err);
      setError(err.message);
    }
  }
  
  useEffect(() => {
    if (containerRef.current && transformedHtml) {
      containerRef.current.innerHTML = transformedHtml;
    }
  }, [transformedHtml]);
  

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
       <div ref={containerRef}></div>
    </div>
  );
  
};


export default App;
