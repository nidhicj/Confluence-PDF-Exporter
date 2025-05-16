import { invoke } from '@forge/bridge';

const ExportButton = () => {
  const handleExport = async () => {
    const res = await invoke('exportPdf', { contentId: YOUR_CONTENT_ID_HERE });
    const blob = new Blob([res], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url);
  };

  return <button onClick={handleExport}>Export PDF</button>;
};

export default ExportButton;
