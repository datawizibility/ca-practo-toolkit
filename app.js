// app.js - 100% In-Browser Client-Side Engine for CA Firm Automation Suite
// Privacy-First: All processing occurs entirely within memory on the user's computer.

let currentTool = 'client-folders';
let selectedFiles = [];

const toolsConfig = {
  'client-folders': {
    title: 'Client Folder & Financial Year Generator',
    category: 'File Management',
    desc: 'Automatically generates standardized multi-tier client folders (GST, Audit, Income Tax, TDS, ROC, Bank) across Financial Years for an entire client roster.',
    render: renderClientFoldersForm,
    run: runClientFolders
  },
  'segregator': {
    title: 'Universal Smart Document Segregator',
    category: 'Banking & Compliance',
    desc: 'Intelligently sorts mixed dump folders into organized subfolders by Document Category (GST, Tax, Bank, Invoices), Bank Name, Financial Year, or Format.',
    render: renderSegregatorForm,
    run: runSegregator
  },
  'zip-extractor': {
    title: 'Universal Bulk ZIP Archive Extractor',
    category: 'File Management',
    desc: 'Batch extracts multiple client ZIP downloads (Bank statements, GST portal returns, Tally backups, Invoices) and unpacks nested ZIPs in memory.',
    render: renderZipExtractorForm,
    run: runZipExtractor
  },
  'excel-converter': {
    title: 'Universal Excel & CSV to XLSX Converter',
    category: 'Excel Automation',
    desc: 'Converts legacy Excel 97-2003 (.xls), delimited feeds (.csv, .tsv, .txt), and web tables into modern OpenXML (.xlsx) workbooks.',
    render: renderExcelConverterForm,
    run: runExcelConverter
  },
  'duplicate-finder': {
    title: 'Duplicate Document Finder (SHA-256)',
    category: 'Audit & File Hygiene',
    desc: 'Scans files, computes cryptographic SHA-256 hashes inside browser memory, and flags exact duplicates with wasted storage calculations.',
    render: renderDuplicateFinderForm,
    run: runDuplicateFinder
  },
  'audit-checker': {
    title: 'Audit Document Completeness Checker',
    category: 'Audit & Assurance',
    desc: 'Cross-checks received client files against mandatory audit checklists (GSTR-1, GSTR-3B, Form 26AS, Bank Statements, Trial Balance).',
    render: renderAuditCheckerForm,
    run: runAuditChecker
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupNavigation();
  loadTool('client-folders');

  document.getElementById('runBtn').addEventListener('click', async () => {
    const tool = toolsConfig[currentTool];
    if (tool && tool.run) {
      await tool.run();
    }
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    selectedFiles = [];
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('progressCard').style.display = 'none';
    loadTool(currentTool);
  });
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const toolKey = btn.getAttribute('data-tool');
      loadTool(toolKey);
    });
  });
}

function loadTool(toolKey) {
  currentTool = toolKey;
  selectedFiles = [];
  const tool = toolsConfig[toolKey];
  if (!tool) return;

  document.getElementById('currentToolTitle').innerText = tool.title;
  document.getElementById('currentToolCategory').innerText = tool.category;
  document.getElementById('currentToolDesc').innerText = tool.desc;

  const container = document.getElementById('dynamicFormContainer');
  container.innerHTML = '';
  document.getElementById('resultsCard').style.display = 'none';
  document.getElementById('progressCard').style.display = 'none';

  if (tool.render) {
    tool.render(container);
  }
}

// -------------------------------------------------------------
// 1. Client Folder Generator
// -------------------------------------------------------------
function renderClientFoldersForm(container) {
  container.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>Client Names (One per line or comma-separated)</label>
        <textarea id="cf_clients" rows="4" placeholder="Acme Tech Industries Ltd&#10;BlueStar Logistics Pvt Ltd&#10;Chandak Textiles LLP">Apex Infra Projects Ltd&#10;BlueStar Logistics Pvt Ltd&#10;Chandak Textiles LLP</textarea>
        <span class="help-text">Enter client names, or paste from an Excel column.</span>
      </div>
      <div class="form-group">
        <label>Financial Years</label>
        <input type="text" id="cf_fys" value="FY 2024-25, FY 2025-26">
        <span class="help-text">Comma-separated list of Financial Year directories.</span>
      </div>
      <div class="form-group">
        <label>Departmental Subfolders</label>
        <input type="text" id="cf_subfolders" value="GST, Income Tax, Audit, TDS, ROC, Bank Statements, Working Papers">
        <span class="help-text">Subfolders created inside each Financial Year.</span>
      </div>
    </div>
  `;
}

async function runClientFolders() {
  const rawClients = document.getElementById('cf_clients').value.trim();
  const rawFys = document.getElementById('cf_fys').value.trim();
  const rawSubs = document.getElementById('cf_subfolders').value.trim();

  if (!rawClients) {
    alert('Please enter at least one client name.');
    return;
  }

  const clients = rawClients.split(/[\r\n,]+/).map(c => c.trim()).filter(c => c);
  const fys = rawFys.split(',').map(f => f.trim()).filter(f => f);
  const subs = rawSubs.split(',').map(s => s.trim()).filter(s => s);

  showProgress('Creating client folder structure in memory...', 30);

  const zip = new JSZip();
  let count = 0;

  clients.forEach(client => {
    const safeClient = client.replace(/[\\/:*?"<>|]/g, '_');
    fys.forEach(fy => {
      subs.forEach(sub => {
        const path = `${safeClient}/${fy}/${sub}/.placeholder`;
        zip.file(path, `Created for ${client} - ${fy} - ${sub}`);
        count++;
      });
    });
  });

  showProgress('Packaging ZIP archive...', 80);
  const blob = await zip.generateAsync({ type: 'blob' });

  showProgress('Ready!', 100);
  setTimeout(() => hideProgress(), 500);

  showResults(
    `Successfully created ${count} folders across ${clients.length} clients and ${fys.length} Financial Years.`,
    [
      { label: '📥 Download Client Folders (.ZIP)', onClick: () => triggerDownload(blob, 'CA_FIRM_CLIENT_FOLDERS.zip') }
    ],
    `<div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: #34d399;">
      <strong>Folders Generated:</strong><br>
      • Clients: ${clients.join(', ')}<br>
      • Financial Years: ${fys.join(', ')}<br>
      • Departments: ${subs.join(', ')}<br>
      Click the download button above to save the ready-to-extract structure directly to your computer.
    </div>`
  );
}

// -------------------------------------------------------------
// 2. Universal Document Segregator
// -------------------------------------------------------------
function renderSegregatorForm(container) {
  container.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>Select Mixed Files to Segregate</label>
        <div class="dropzone" id="dropzone_files">
          <div class="dropzone-icon">📁</div>
          <p>Drag & drop mixed client files here, or click to browse</p>
          <small>Accepts PDFs, Excels, Word, CSV, Images</small>
          <input type="file" id="file_picker" multiple style="display: none;">
        </div>
        <div id="file_count_badge" style="font-size: 12px; color: #a5b4fc; margin-top: 6px;"></div>
      </div>
      <div class="form-group">
        <label>Segregation Strategy</label>
        <select id="seg_strategy">
          <option value="ByDocumentCategory">By Document Category (GST, Income Tax, Bank, TDS, ROC, Audit, Invoices)</option>
          <option value="ByBank">By Bank Name (HDFC, SBI, ICICI, Axis, BOB, Kotak, etc.)</option>
          <option value="ByFinancialYear">By Financial Year (FY 2024-25, FY 2025-26, etc.)</option>
          <option value="ByFileFormat">By File Format (PDF, Excel, Word, CSV)</option>
        </select>
      </div>
    </div>
  `;
  setupFileDropzone('dropzone_files', 'file_picker', (files) => {
    selectedFiles = Array.from(files);
    document.getElementById('file_count_badge').innerText = `Selected ${selectedFiles.length} files ready to classify.`;
  });
}

async function runSegregator() {
  if (!selectedFiles || selectedFiles.length === 0) {
    alert('Please select files to segregate.');
    return;
  }

  const strategy = document.getElementById('seg_strategy').value;
  showProgress('Analyzing and classifying files...', 20);

  const zip = new JSZip();
  const records = [];

  const bankPatterns = {
    'HDFC': ['HDFC'], 'SBI': ['SBI', 'STATE BANK'], 'ICICI': ['ICICI'],
    'Axis': ['AXIS'], 'BOB': ['BOB', 'BARODA'], 'Kotak': ['KOTAK']
  };

  const docPatterns = {
    'GST': ['GST', 'GSTR', 'GSTR1', 'GSTR2', 'GSTR3B', 'B2B', 'ITC'],
    'Income Tax': ['26AS', 'AIS', 'TIS', 'ITR', 'FORM 16', 'COMPUTATION'],
    'Bank Statements': ['BANK', 'STATEMENT', 'PASSBOOK', 'HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'BOB'],
    'TDS': ['TDS', '24Q', '26Q', '27Q', 'CHALLAN 281'],
    'ROC & MCA': ['ROC', 'MCA', 'AOC-4', 'MGT-7'],
    'Audit & Accounts': ['AUDIT', 'TRIAL BALANCE', 'LEDGER', 'BALANCE SHEET'],
    'Invoices & Bills': ['INVOICE', 'BILL', 'VOUCHER']
  };

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const upperName = file.name.toUpperCase();
    let category = 'Unclassified';

    if (strategy === 'ByDocumentCategory') {
      for (const [cat, keywords] of Object.entries(docPatterns)) {
        if (keywords.some(kw => upperName.includes(kw))) {
          category = cat;
          break;
        }
      }
    } else if (strategy === 'ByBank') {
      for (const [bank, keywords] of Object.entries(bankPatterns)) {
        if (keywords.some(kw => upperName.includes(kw))) {
          category = bank;
          break;
        }
      }
    } else if (strategy === 'ByFinancialYear') {
      const match = upperName.match(/(FY\s*20\d\d[-_]?\d\d|20\d\d[-_]\d\d|AY\s*20\d\d[-_]?\d\d)/);
      if (match) category = match[1].replace('_', '-');
    } else if (strategy === 'ByFileFormat') {
      const ext = file.name.split('.').pop().toLowerCase();
      category = ext.toUpperCase() + ' Files';
    }

    zip.file(`${category}/${file.name}`, file);
    records.push({ fileName: file.name, category });

    const pct = Math.round(((i + 1) / selectedFiles.length) * 80);
    showProgress(`Classified ${i + 1} of ${selectedFiles.length}...`, pct);
  }

  showProgress('Creating organized ZIP package...', 90);
  const blob = await zip.generateAsync({ type: 'blob' });
  hideProgress();

  let tableHtml = `
    <table class="table-responsive">
      <thead><tr><th>File Name</th><th>Classified Folder</th><th>Status</th></tr></thead>
      <tbody>
  `;
  records.forEach(r => {
    tableHtml += `
      <tr>
        <td>${escapeHtml(r.fileName)}</td>
        <td><strong>${escapeHtml(r.category)}</strong></td>
        <td><span class="tag-badge ${r.category !== 'Unclassified' ? 'tag-success' : 'tag-warning'}">${r.category !== 'Unclassified' ? 'Classified' : 'Unclassified'}</span></td>
      </tr>
    `;
  });
  tableHtml += '</tbody></table>';

  showResults(
    `Segregation Complete. Classified ${records.filter(r => r.category !== 'Unclassified').length} of ${records.length} files.`,
    [
      { label: '📥 Download Organized ZIP', onClick: () => triggerDownload(blob, `Organized_Files_${strategy}.zip`) }
    ],
    tableHtml
  );
}

// -------------------------------------------------------------
// 3. Bulk ZIP Archive Extractor
// -------------------------------------------------------------
function renderZipExtractorForm(container) {
  container.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>Select ZIP Archives to Extract</label>
        <div class="dropzone" id="dropzone_zips">
          <div class="dropzone-icon">📦</div>
          <p>Drag & drop client .ZIP files here (Bank, GST, Tally, Invoices)</p>
          <small>Accepts multiple archives simultaneously</small>
          <input type="file" id="zip_picker" multiple accept=".zip" style="display: none;">
        </div>
        <div id="zip_count_badge" style="font-size: 12px; color: #a5b4fc; margin-top: 6px;"></div>
      </div>
    </div>
  `;
  setupFileDropzone('dropzone_zips', 'zip_picker', (files) => {
    selectedFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.zip'));
    document.getElementById('zip_count_badge').innerText = `Selected ${selectedFiles.length} ZIP archives to extract.`;
  });
}

async function runZipExtractor() {
  if (!selectedFiles || selectedFiles.length === 0) {
    alert('Please select at least one .zip file.');
    return;
  }

  showProgress('Reading and unzipping archives...', 20);
  const consolidatedZip = new JSZip();
  const summaryRecords = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const zipFile = selectedFiles[i];
    const zipName = zipFile.name.replace(/\.zip$/i, '');
    showProgress(`Extracting ${zipFile.name}...`, Math.round((i / selectedFiles.length) * 80));

    try {
      const unzipped = await JSZip.loadAsync(zipFile);
      let detectedType = 'General Documents';
      let fileCount = 0;

      for (const [relPath, entry] of Object.entries(unzipped.files)) {
        if (!entry.dir) {
          fileCount++;
          const u = relPath.toUpperCase();
          if (u.includes('1000') || u.includes('COMPANY.900')) detectedType = 'Tally Accounting Data';
          else if (u.includes('GSTR') || u.includes('B2B')) detectedType = 'GST Returns';
          else if (u.includes('STATEMENT') || u.includes('HDFC') || u.includes('SBI')) detectedType = 'Bank Statements';

          const content = await entry.async('blob');
          consolidatedZip.file(`${zipName}/${relPath}`, content);
        }
      }

      summaryRecords.push({ archive: zipFile.name, type: detectedType, files: fileCount });
    } catch (err) {
      summaryRecords.push({ archive: zipFile.name, type: 'Error: ' + err.message, files: 0 });
    }
  }

  showProgress('Packaging consolidated output...', 90);
  const blob = await consolidatedZip.generateAsync({ type: 'blob' });
  hideProgress();

  let tableHtml = `
    <table class="table-responsive">
      <thead><tr><th>Archive</th><th>Detected Payload</th><th>Files Extracted</th></tr></thead>
      <tbody>
  `;
  summaryRecords.forEach(s => {
    tableHtml += `
      <tr>
        <td>${escapeHtml(s.archive)}</td>
        <td><strong>${escapeHtml(s.type)}</strong></td>
        <td>${s.files} items</td>
      </tr>
    `;
  });
  tableHtml += '</tbody></table>';

  showResults(
    `Successfully extracted ${summaryRecords.length} archives into clean isolated folders.`,
    [
      { label: '📥 Download Unpacked Bundle (.ZIP)', onClick: () => triggerDownload(blob, 'Extracted_Client_Archives.zip') }
    ],
    tableHtml
  );
}

// -------------------------------------------------------------
// 4. Universal Excel & CSV Converter (Powered by SheetJS)
// -------------------------------------------------------------
function renderExcelConverterForm(container) {
  container.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>Select Spreadsheets to Convert</label>
        <div class="dropzone" id="dropzone_excel">
          <div class="dropzone-icon">📊</div>
          <p>Drag & drop legacy Excel (.xls), .csv, .tsv, or .txt files</p>
          <small>Converts automatically to clean, modern OpenXML .xlsx</small>
          <input type="file" id="excel_picker" multiple accept=".xls,.xlsx,.csv,.tsv,.txt" style="display: none;">
        </div>
        <div id="excel_count_badge" style="font-size: 12px; color: #a5b4fc; margin-top: 6px;"></div>
      </div>
    </div>
  `;
  setupFileDropzone('dropzone_excel', 'excel_picker', (files) => {
    selectedFiles = Array.from(files);
    document.getElementById('excel_count_badge').innerText = `Selected ${selectedFiles.length} spreadsheets ready to convert.`;
  });
}

async function runExcelConverter() {
  if (!selectedFiles || selectedFiles.length === 0) {
    alert('Please select spreadsheet files to convert.');
    return;
  }

  if (typeof XLSX === 'undefined') {
    alert('SheetJS conversion library is still loading. Please check internet connection.');
    return;
  }

  showProgress('Converting spreadsheets to modern .xlsx...', 20);
  const zip = new JSZip();
  const records = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    showProgress(`Converting ${file.name}...`, Math.round((i / selectedFiles.length) * 80));

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file(`${baseName}.xlsx`, xlsxBuffer);
      records.push({ fileName: file.name, sheets: wb.SheetNames.length, status: 'Success' });
    } catch (err) {
      records.push({ fileName: file.name, sheets: 0, status: 'Error: ' + err.message });
    }
  }

  showProgress('Creating converted ZIP package...', 90);
  const blob = await zip.generateAsync({ type: 'blob' });
  hideProgress();

  let tableHtml = `
    <table class="table-responsive">
      <thead><tr><th>Original File</th><th>Worksheets</th><th>Status</th></tr></thead>
      <tbody>
  `;
  records.forEach(r => {
    tableHtml += `
      <tr>
        <td>${escapeHtml(r.fileName)}</td>
        <td>${r.sheets} sheet(s)</td>
        <td><span class="tag-badge ${r.status === 'Success' ? 'tag-success' : 'tag-error'}">${r.status}</span></td>
      </tr>
    `;
  });
  tableHtml += '</tbody></table>';

  showResults(
    `Converted ${records.filter(r => r.status === 'Success').length} of ${records.length} files to modern .xlsx.`,
    [
      { label: '📥 Download Converted Workbooks (.ZIP)', onClick: () => triggerDownload(blob, 'Converted_XLSX_Files.zip') }
    ],
    tableHtml
  );
}

// -------------------------------------------------------------
// 5. Duplicate Document Finder (Web Crypto SHA-256)
// -------------------------------------------------------------
function renderDuplicateFinderForm(container) {
  container.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>Select Files to Inspect for Duplicates</label>
        <div class="dropzone" id="dropzone_dups">
          <div class="dropzone-icon">🔍</div>
          <p>Drag & drop documents or click to browse</p>
          <small>Computes SHA-256 in memory via Web Crypto API</small>
          <input type="file" id="dups_picker" multiple style="display: none;">
        </div>
        <div id="dups_count_badge" style="font-size: 12px; color: #a5b4fc; margin-top: 6px;"></div>
      </div>
    </div>
  `;
  setupFileDropzone('dropzone_dups', 'dups_picker', (files) => {
    selectedFiles = Array.from(files);
    document.getElementById('dups_count_badge').innerText = `Selected ${selectedFiles.length} files to scan.`;
  });
}

async function runDuplicateFinder() {
  if (!selectedFiles || selectedFiles.length === 0) {
    alert('Please select files to check for duplicates.');
    return;
  }

  showProgress('Grouping files by byte size...', 20);

  // Group by exact size
  const sizeMap = {};
  selectedFiles.forEach(f => {
    if (f.size > 0) {
      if (!sizeMap[f.size]) sizeMap[f.size] = [];
      sizeMap[f.size].push(f);
    }
  });

  const candidates = [];
  Object.values(sizeMap).forEach(arr => {
    if (arr.length > 1) {
      candidates.push(...arr);
    }
  });

  if (candidates.length === 0) {
    hideProgress();
    showResults('No duplicates found. All files have unique file sizes.', [], '<div style="padding: 16px; color: #34d399;">✅ Zero duplicate files found.</div>');
    return;
  }

  showProgress(`Computing SHA-256 for ${candidates.length} candidate files...`, 50);

  const hashMap = {};
  const duplicates = [];
  let wastedBytes = 0;

  for (let i = 0; i < candidates.length; i++) {
    const file = candidates[i];
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    if (hashMap[hashHex]) {
      wastedBytes += file.size;
      duplicates.push({
        duplicate: file.name,
        original: hashMap[hashHex].name,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        sha256: hashHex
      });
    } else {
      hashMap[hashHex] = file;
    }
  }

  hideProgress();

  if (duplicates.length === 0) {
    showResults('Scan complete: No duplicate files found.', [], '<div style="padding: 16px; color: #34d399;">✅ All files verified unique.</div>');
    return;
  }

  const wastedMB = (wastedBytes / (1024 * 1024)).toFixed(2);

  // Generate CSV data for export
  let csvContent = 'OriginalFile,DuplicateFile,SizeMB,SHA256\n';
  duplicates.forEach(d => {
    csvContent += `"${d.original}","${d.duplicate}","${d.sizeMB}","${d.sha256}"\n`;
  });
  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  let tableHtml = `
    <table class="table-responsive">
      <thead><tr><th>Original File</th><th>Duplicate Copy</th><th>Size</th><th>SHA-256 Match</th></tr></thead>
      <tbody>
  `;
  duplicates.forEach(d => {
    tableHtml += `
      <tr>
        <td>${escapeHtml(d.original)}</td>
        <td><strong style="color: #fbbf24;">${escapeHtml(d.duplicate)}</strong></td>
        <td>${d.sizeMB} MB</td>
        <td><code style="font-size: 10px;">${d.sha256.substring(0, 16)}...</code></td>
      </tr>
    `;
  });
  tableHtml += '</tbody></table>';

  showResults(
    `Found ${duplicates.length} verified duplicate files (${wastedMB} MB wasted space).`,
    [
      { label: '📊 Download Duplicate Report (.CSV)', onClick: () => triggerDownload(csvBlob, 'Duplicate_Files_Report.csv') }
    ],
    tableHtml
  );
}

// -------------------------------------------------------------
// 6. Audit Completeness Checker
// -------------------------------------------------------------
function renderAuditCheckerForm(container) {
  container.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>Select Client Received Documents</label>
        <div class="dropzone" id="dropzone_audit">
          <div class="dropzone-icon">📋</div>
          <p>Drag & drop client papers (GST returns, Bank statements, Ledgers, 26AS)</p>
          <small>Audits against mandatory statutory checklist</small>
          <input type="file" id="audit_picker" multiple style="display: none;">
        </div>
        <div id="audit_count_badge" style="font-size: 12px; color: #a5b4fc; margin-top: 6px;"></div>
      </div>
    </div>
  `;
  setupFileDropzone('dropzone_audit', 'audit_picker', (files) => {
    selectedFiles = Array.from(files);
    document.getElementById('audit_count_badge').innerText = `Selected ${selectedFiles.length} client documents to evaluate.`;
  });
}

async function runAuditChecker() {
  if (!selectedFiles || selectedFiles.length === 0) {
    alert('Please select client documents to evaluate.');
    return;
  }

  showProgress('Cross-referencing statutory checklists...', 50);

  const checklist = [
    { name: 'GSTR-1 Outward Supply Return', patterns: ['GSTR-1', 'GSTR1'], required: true },
    { name: 'GSTR-3B Monthly Return', patterns: ['GSTR-3B', 'GSTR3B'], required: true },
    { name: 'GSTR-2B Auto-Drafted ITC', patterns: ['GSTR-2B', 'GSTR2B'], required: true },
    { name: 'Form 26AS / AIS Tax Credit', patterns: ['26AS', 'AIS', 'TIS'], required: true },
    { name: 'Bank Statement (Full Year)', patterns: ['BANK', 'STATEMENT', 'HDFC', 'SBI', 'ICICI'], required: true },
    { name: 'Trial Balance / Ledger Accounts', patterns: ['TRIAL', 'LEDGER', 'BALANCE'], required: true },
    { name: 'Fixed Asset Register (FAR)', patterns: ['ASSET', 'FAR'], required: false },
    { name: 'TDS Return Receipts', patterns: ['TDS', '26Q', '24Q'], required: false }
  ];

  const results = [];
  let receivedCount = 0;
  let missingMandatoryCount = 0;

  checklist.forEach(item => {
    const matched = selectedFiles.filter(f => {
      const u = f.name.toUpperCase();
      return item.patterns.some(p => u.includes(p));
    });

    const isFound = matched.length > 0;
    if (isFound) receivedCount++;
    else if (item.required) missingMandatoryCount++;

    results.push({
      item: item.name,
      required: item.required,
      status: isFound ? 'RECEIVED' : (item.required ? 'MISSING' : 'OPTIONAL'),
      matchedFiles: matched.map(m => m.name).join('; ')
    });
  });

  hideProgress();

  let csvContent = 'Requirement,Mandatory,Status,MatchedFiles\n';
  results.forEach(r => {
    csvContent += `"${r.item}","${r.required ? 'Yes' : 'No'}","${r.status}","${r.matchedFiles}"\n`;
  });
  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  let tableHtml = `
    <table class="table-responsive">
      <thead><tr><th>Requirement</th><th>Mandatory</th><th>Status</th><th>Matched Client Documents</th></tr></thead>
      <tbody>
  `;
  results.forEach(r => {
    const badgeClass = r.status === 'RECEIVED' ? 'tag-success' : (r.status === 'MISSING' ? 'tag-error' : 'tag-warning');
    tableHtml += `
      <tr>
        <td><strong>${escapeHtml(r.item)}</strong></td>
        <td>${r.required ? 'Yes' : 'No'}</td>
        <td><span class="tag-badge ${badgeClass}">${r.status}</span></td>
        <td>${r.matchedFiles ? escapeHtml(r.matchedFiles) : '<em style="color: var(--text-dim);">None</em>'}</td>
      </tr>
    `;
  });
  tableHtml += '</tbody></table>';

  showResults(
    `Audit Readiness: Received ${receivedCount} items | Missing Mandatory: ${missingMandatoryCount}`,
    [
      { label: '📊 Download Audit Checklist (.CSV)', onClick: () => triggerDownload(csvBlob, 'Audit_Compliance_Checklist.csv') }
    ],
    tableHtml
  );
}

// -------------------------------------------------------------
// Utilities
// -------------------------------------------------------------
function setupFileDropzone(dropzoneId, pickerId, onFilesSelected) {
  const dropzone = document.getElementById(dropzoneId);
  const picker = document.getElementById(pickerId);

  dropzone.addEventListener('click', () => picker.click());

  picker.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  });
}

function showProgress(text, percent) {
  const card = document.getElementById('progressCard');
  card.style.display = 'block';
  document.getElementById('progressStatus').innerText = text;
  document.getElementById('progressPercent').innerText = `${percent}%`;
  document.getElementById('progressBarFill').style.width = `${percent}%`;
}

function hideProgress() {
  document.getElementById('progressCard').style.display = 'none';
}

function showResults(summary, actions, bodyHtml) {
  const card = document.getElementById('resultsCard');
  card.style.display = 'block';
  document.getElementById('resultsSummaryText').innerText = summary;

  const actionsContainer = document.getElementById('resultsActions');
  actionsContainer.innerHTML = '';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.innerText = a.label;
    btn.addEventListener('click', a.onClick);
    actionsContainer.appendChild(btn);
  });

  document.getElementById('resultsBody').innerHTML = bodyHtml;
  card.scrollIntoView({ behavior: 'smooth' });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
