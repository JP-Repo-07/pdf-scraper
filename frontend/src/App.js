import React, { useState } from 'react';

function formatDisplayName(link) {
  let filename = link.split('/').pop();
  filename = decodeURIComponent(filename);
  filename = filename.replace(/\.pdf$/i, '');
  filename = filename.replace(/[^a-zA-Z0-9 ]/g, ' ');
  return filename.trim();
}

function formatFileName(link) {
  let filename = link.split('/').pop();
  filename = decodeURIComponent(filename);
  filename = filename.replace(/[^a-zA-Z0-9 ]/g, ' ');
  filename = filename.replace(/ /g, '_'); // underscores instead of spaces
  return filename.trim() + '.pdf';
}



function App() {
  const [url, setUrl] = useState('');
  const [pdfs, setPdfs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [prefix, setPrefix] = useState('');

  const scrapeSite = async () => {
    const res = await fetch(`http://localhost:3001/scrape?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    setPdfs(data.pdfLinks || []);
    setSelected([]);
  };

  const toggleSelect = (link) => {
    setSelected(prev =>
      prev.includes(link) ? prev.filter(l => l !== link) : [...prev, link]
    );
  };

  const downloadBundle = async () => {
    if (selected.length === 0) return;

    const urlList = selected.join(',');
    const response = await fetch(
      `http://localhost:3001/bundle?urls=${encodeURIComponent(urlList)}&prefix=${encodeURIComponent(prefix)}`
    );

    if (!response.ok) {
      alert("Failed to download bundle");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdfs_bundle.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };


  return (
    <div style={{ padding: '20px' }}>
      <h1>PDF Scraper</h1>
      <input
        type="text"
        placeholder="Enter website URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ width: '300px' }}
      />
      <button onClick={scrapeSite}>Scrape PDFs</button>

      {pdfs.length > 0 && (
        <>
          <input
            type="text"
            placeholder="Prefix for filenames"
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
            style={{ marginTop: '10px' }}
          />
          <button onClick={downloadBundle} style={{ marginLeft: '10px' }}>
            Download Bundle (ZIP)
          </button>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc' }}>Select</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc' }}>Display Name</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc' }}>File Name</th>
              </tr>
            </thead>
            <tbody>
              {pdfs.map((link, i) => {
                const isSelected = selected.includes(link);
                return (
                  <tr
                    key={i}
                    onClick={() => toggleSelect(link)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0f8ff' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                      <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                        {formatDisplayName(link)}
                      </a>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                      {formatFileName(link)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>


        </>
      )}
    </div>
  );
}

export default App;
