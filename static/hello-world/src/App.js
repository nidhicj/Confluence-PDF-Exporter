import { useEffect, useState, useRef } from 'react';
import { invoke, view } from '@forge/bridge';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import img from './assets/me.jpg'; 


function App() {
  
  const [loading, setLoading] = useState(true);
  const [pageId, setContentId] = useState(null);
  const [spaceKey, setSpaceKey] = useState(null);
  console.log("App component rendered");
  const contentRef = useRef(null);
  const headerImageRef = useRef(null);

  useEffect(() => {
    // runs once after mount
    const el = contentRef.current;
    console.log('Found element:', el);
    // …do whatever you needed document.querySelector for…

    const fetchContext = async () => {
      try {
        const context = await view.getContext();
        console.log("🔍 Full context:", context);
        const pageId = context?.extension?.content?.id;
        const spaceKey = context?.extension?.space?.key;
        
        if ((!pageId) && (!spaceKey) ) throw new Error("Page ID or SpaceKey not found in context.");
        
        setContentId(pageId);
        setSpaceKey(spaceKey);

        console.log("✅ Found pageId and spaceKey", pageId, spaceKey);
      } catch (error) {
        console.error("❌ Failed to get context:", error);
        alert("Unable to retrieve page context. Please reload the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchContext();

  }, []);

  const generatePDF = async (content) => {
    
    console.log("content:", content);
    
    const result = await invoke(
      "exportHandler",
      { pageId }
    );
    console.log("▶ raw invoke result:", result);

    
  };
  

  return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div data-testid="content-container-component" ref={contentRef} >
          <h3>Export Page as PDF</h3>
            {loading ? (
          <p>Loading page context...</p>
            ) : (
          <button onClick={() => {
              generatePDF(contentRef.current);
            }}>
            Download PDF
          </button>
        )}
          <div style={{ display: 'none' }}> 
            <img
              ref={headerImageRef}
              src={img}
              alt="Header"
              />
          </div>
        </div>
      </div>
    );
  
};


export default App;

/*
// Convert header image to base64
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = headerImg.src;

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const headerData = canvas.toDataURL('image/png');

      // Capture the content as a canvas
      const contentCanvas = await html2canvas(content, { scale: 2 });
      const contentData = contentCanvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate the number of pages
      const imgProps = pdf.getImageProperties(contentData);
      const pdfWidth = pageWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = pdfHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(contentData, 'PNG', 0, position, pdfWidth, pdfHeight);
      pdf.addImage(headerData, 'PNG', 10, 10, 200, 50);
      heightLeft -= pageHeight;

      // Add remaining pages
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(contentData, 'PNG', 0, position, pdfWidth, pdfHeight);
        pdf.addImage(headerData, 'PNG', 10, 10, 200, 50);
        heightLeft -= pageHeight;
      }

      pdf.save('document.pdf');
    };
*/