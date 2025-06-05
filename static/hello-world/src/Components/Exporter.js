import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import img from '../assets/me.jpg'; 
import { useEffect } from 'react';
// import { useState } from 'react';


const Exporter = () => {
  const contentRef = useRef(null);

  useEffect(() => {
    // runs once after mount
    const el = contentRef.current;
    console.log('Found element:', el);
    // …do whatever you needed document.querySelector for…
  }, []);

  const generatePDF = async (content) => {
   


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
  };


  return (
    <div>
      {/* Hidden header image */}
      <div style={{ display: 'none' }}> 
        <img
          ref={headerImageRef}
          src={img}
          alt="Header"
        />
      </div>

      {/* Content to be exported */}
      <div data-testid="content-container-component" ref={contentRef} >
        <h1>{contentRef}</h1>
        <p>Your content goes here...</p>
        {/* Add more content as needed */}
      </div>

      <button onClick={() => {
          <  Exporter>  </Exporter>
           
        }}
      >Export to PDF</button>
    </div>
  );
};

export default Exporter;
