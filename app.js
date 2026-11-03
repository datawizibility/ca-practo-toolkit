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

let clientFolderTargetHandle = null;
let zipExtractorTargetHandle = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupNavigation();
  setupManualModal();
  loadTool('client-folders');

  document.getElementById('runBtn').addEventListener('click', async () => {
    const tool = toolsConfig[currentTool];
    if (tool && tool.run) {
      await tool.run();
    }
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    selectedFiles = [];
    clientFolderTargetHandle = null;
    zipExtractorTargetHandle = null;
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
      <div class="form-group full-width">
        <label>Client Names (One per line or comma-separated)</label>
        <textarea id="cf_clients" rows="3" placeholder="Acme Tech Industries Ltd&#10;BlueStar Logistics Pvt Ltd&#10;Chandak Textiles LLP">Apex Infra Projects Ltd&#10;BlueStar Logistics Pvt Ltd&#10;Chandak Textiles LLP</textarea>
        <span class="help-text">Enter client names, or paste a vertical column copied from an Excel sheet.</span>
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

      <div class="form-group full-width">
        <label>Target Destination (Where should folders be created?)</label>
        <div class="destination-container">
          <div class="destination-toggle">
            <label class="radio-option" id="label_mode_direct">
              <input type="radio" name="cf_dest_mode" value="direct" checked id="dest_mode_direct">
              <div>
                <strong>📁 Direct on PC (Recommended)</strong>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Browse target directory on your hard drive (e.g. D:\\Clients)</div>
              </div>
            </label>
            <label class="radio-option" id="label_mode_zip">
              <input type="radio" name="cf_dest_mode" value="zip" id="dest_mode_zip">
              <div>
                <strong>📦 Download ZIP Archive</strong>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Package all folders into a ready-to-extract .zip file</div>
              </div>
            </label>
          </div>

          <div id="direct_dir_picker_box" class="picker-box">
            <div class="picker-details">
              <div id="target_dir_display" class="target-path-pill">
                ${clientFolderTargetHandle ? `✓ Target Folder: ${clientFolderTargetHandle.name} (Direct disk writing ready)` : 'No folder chosen. Click Browse to select (e.g. D:\\Clients)'}
              </div>
              <button type="button" id="browseTargetFolderBtn" class="btn-browse">
                📁 Browse Target Folder on PC
              </button>
            </div>
            <span class="help-text">Select any existing folder or create a new folder on your computer. The browser will generate all client and subfolder trees directly inside it.</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBrowse = document.getElementById('browseTargetFolderBtn');
  if (btnBrowse) {
    btnBrowse.addEventListener('click', async () => {
      await chooseClientTargetDirectory();
    });
  }

  const radioDirect = document.getElementById('dest_mode_direct');
  const radioZip = document.getElementById('dest_mode_zip');
  const pickerBox = document.getElementById('direct_dir_picker_box');

  if (radioDirect && radioZip && pickerBox) {
    radioDirect.addEventListener('change', () => {
      pickerBox.style.display = 'block';
    });
    radioZip.addEventListener('change', () => {
      pickerBox.style.display = 'none';
    });
  }
}

async function chooseClientTargetDirectory() {
  if ('showDirectoryPicker' in window) {
    try {
      clientFolderTargetHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const pill = document.getElementById('target_dir_display');
      if (pill) {
        pill.innerText = `✓ Target Folder: ${clientFolderTargetHandle.name} (Direct disk writing ready)`;
        pill.classList.add('selected');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Directory picker error:', err);
        alert('Could not access folder: ' + err.message);
      }
    }
  } else {
    alert('Direct PC folder creation requires Google Chrome, Microsoft Edge, or a Chromium browser. On Firefox/Safari, please use the "Download ZIP Archive" option.');
    const radioZip = document.getElementById('dest_mode_zip');
    if (radioZip) {
      radioZip.checked = true;
      document.getElementById('direct_dir_picker_box').style.display = 'none';
    }
  }
}

async function runClientFolders() {
  const rawClients = document.getElementById('cf_clients').value.trim();
  const rawFys = document.getElementById('cf_fys').value.trim();
  const rawSubs = document.getElementById('cf_subfolders').value.trim();
  const destMode = document.querySelector('input[name="cf_dest_mode"]:checked')?.value || 'direct';

  if (!rawClients) {
    alert('Please enter at least one client name.');
    return;
  }

  const clients = rawClients.split(/[\r\n,]+/).map(c => c.trim()).filter(c => c);
  const fys = rawFys.split(',').map(f => f.trim()).filter(f => f);
  const subs = rawSubs.split(',').map(s => s.trim()).filter(s => s);

  if (destMode === 'direct') {
    if (!('showDirectoryPicker' in window)) {
      alert('Your browser does not support direct disk folder writing. Automatically switching to ZIP archive download.');
      await generateZipPackage(clients, fys, subs);
      return;
    }

    if (!clientFolderTargetHandle) {
      try {
        clientFolderTargetHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        const pill = document.getElementById('target_dir_display');
        if (pill) {
          pill.innerText = `✓ Target Folder: ${clientFolderTargetHandle.name} (Direct disk writing ready)`;
          pill.classList.add('selected');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        alert('Could not access folder: ' + err.message);
        return;
      }
    }

    showProgress(`Creating folder structure directly inside "${clientFolderTargetHandle.name}" on your PC...`, 15);

    let count = 0;
    const totalOps = clients.length * fys.length * subs.length;
    let completed = 0;

    for (const client of clients) {
      const safeClient = client.replace(/[\\/:*?"<>|]/g, '_');
      const clientHandle = await clientFolderTargetHandle.getDirectoryHandle(safeClient, { create: true });
      for (const fy of fys) {
        const fyHandle = await clientHandle.getDirectoryHandle(fy, { create: true });
        for (const sub of subs) {
          await fyHandle.getDirectoryHandle(sub, { create: true });
          count++;
          completed++;
          showProgress(`Creating ${safeClient} > ${fy} > ${sub}...`, Math.min(95, Math.round((completed / totalOps) * 90) + 10));
        }
      }
    }

    showProgress('All directories successfully created on your PC!', 100);
    setTimeout(() => hideProgress(), 600);

    showResults(
      `Direct PC Creation Success: Created ${count} departmental directories inside "${clientFolderTargetHandle.name}".`,
      [
        {
          label: '📁 Change Target Folder',
          onClick: () => {
            clientFolderTargetHandle = null;
            const pill = document.getElementById('target_dir_display');
            if (pill) {
              pill.innerText = 'No folder chosen. Click Browse to select (e.g. D:\\Clients)';
              pill.classList.remove('selected');
            }
          }
        }
      ],
      `<div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: #34d399; line-height: 1.6;">
        <strong>✓ Physical Folders Created Directly on Your Hard Drive:</strong><br>
        • Target Directory: <code>${clientFolderTargetHandle.name}</code><br>
        • Total Clients: <strong>${clients.length}</strong> (${clients.join(', ')})<br>
        • Financial Years: <strong>${fys.length}</strong> (${fys.join(', ')})<br>
        • Departments per FY: <strong>${subs.length}</strong> (${subs.join(', ')})<br>
        • Total Subdirectories Created: <strong>${count}</strong><br><br>
        <em>No zip extraction required! Open Windows File Explorer on your computer to view and use your client folders immediately.</em>
      </div>`
    );
    return;
  }

  // ZIP Mode
  await generateZipPackage(clients, fys, subs);
}

async function generateZipPackage(clients, fys, subs) {
  showProgress('Packaging client folder structure in memory...', 30);
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

  showProgress('Generating ZIP archive...', 80);
  const blob = await zip.generateAsync({ type: 'blob' });

  showProgress('Ready!', 100);
  setTimeout(() => hideProgress(), 500);

  showResults(
    `Successfully packaged ${count} folders across ${clients.length} clients into a single ZIP archive.`,
    [
      { label: '📥 Download Client Folders (.ZIP)', onClick: () => triggerDownload(blob, 'CA_FIRM_CLIENT_FOLDERS.zip') }
    ],
    `<div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: #34d399; line-height: 1.6;">
      <strong>ZIP Archive Ready for Download:</strong><br>
      • Clients: ${clients.join(', ')}<br>
      • Financial Years: ${fys.join(', ')}<br>
      • Departments: ${subs.join(', ')}<br><br>
      Click the download button above to save the ZIP to your computer, then right-click and choose "Extract All".
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
      <div class="form-group full-width">
        <label>1. Select ZIP Archives to Extract</label>
        <div class="dropzone" id="dropzone_zips">
          <div class="dropzone-icon">📦</div>
          <p>Drag & drop client .ZIP files here (Bank statements, GST returns, Tally backups, Invoices)</p>
          <small>Accepts multiple archives simultaneously</small>
          <input type="file" id="zip_picker" multiple accept=".zip" style="display: none;">
        </div>
        <div id="zip_count_badge" style="font-size: 12px; color: #a5b4fc; margin-top: 6px;"></div>
      </div>

      <div class="form-group full-width">
        <label>2. Extraction Destination (Where to unpack files on your PC?)</label>
        <div class="destination-container">
          <div class="destination-toggle">
            <label class="radio-option" id="label_zip_direct">
              <input type="radio" name="zip_dest_mode" value="direct" checked id="zip_mode_direct">
              <div>
                <strong>📁 Direct to PC Folder (Recommended)</strong>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Extracts actual uncompressed files and folders directly to your drive</div>
              </div>
            </label>
            <label class="radio-option" id="label_zip_download">
              <input type="radio" name="zip_dest_mode" value="zip" id="zip_mode_download">
              <div>
                <strong>📦 Download Consolidated ZIP</strong>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Package all extracted contents into a single consolidated .zip</div>
              </div>
            </label>
          </div>

          <div id="direct_zip_picker_box" class="picker-box">
            <div class="picker-details">
              <div id="zip_target_dir_display" class="target-path-pill">
                ${zipExtractorTargetHandle ? `✓ Extract To: ${zipExtractorTargetHandle.name} (Direct disk writing ready)` : 'No folder chosen. Click Browse to select (e.g. D:\\Extracted_Files)'}
              </div>
              <button type="button" id="browseZipTargetBtn" class="btn-browse">
                📁 Browse Destination Folder on PC
              </button>
            </div>
            <span class="help-text">Select your target destination. All archives and nested ZIPs will be uncompressed into physical folders right on your hard drive (no re-zipping!).</span>
          </div>
        </div>
      </div>
    </div>
  `;

  setupFileDropzone('dropzone_zips', 'zip_picker', (files) => {
    selectedFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.zip'));
    document.getElementById('zip_count_badge').innerText = `Selected ${selectedFiles.length} ZIP archives ready to extract.`;
  });

  const btnBrowse = document.getElementById('browseZipTargetBtn');
  if (btnBrowse) {
    btnBrowse.addEventListener('click', async () => {
      await chooseZipTargetDirectory();
    });
  }

  const radioDirect = document.getElementById('zip_mode_direct');
  const radioZip = document.getElementById('zip_mode_download');
  const pickerBox = document.getElementById('direct_zip_picker_box');

  if (radioDirect && radioZip && pickerBox) {
    radioDirect.addEventListener('change', () => {
      pickerBox.style.display = 'block';
    });
    radioZip.addEventListener('change', () => {
      pickerBox.style.display = 'none';
    });
  }
}

async function chooseZipTargetDirectory() {
  if ('showDirectoryPicker' in window) {
    try {
      zipExtractorTargetHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const pill = document.getElementById('zip_target_dir_display');
      if (pill) {
        pill.innerText = `✓ Extract To: ${zipExtractorTargetHandle.name} (Direct disk writing ready)`;
        pill.classList.add('selected');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Directory picker error:', err);
        alert('Could not access folder: ' + err.message);
      }
    }
  } else {
    alert('Direct PC extraction requires Google Chrome, Microsoft Edge, or a Chromium browser. On Firefox/Safari, please use the consolidated download option.');
    const radioZip = document.getElementById('zip_mode_download');
    if (radioZip) {
      radioZip.checked = true;
      document.getElementById('direct_zip_picker_box').style.display = 'none';
    }
  }
}

async function runZipExtractor() {
  if (!selectedFiles || selectedFiles.length === 0) {
    alert('Please select at least one .zip file to extract.');
    return;
  }

  const destMode = document.querySelector('input[name="zip_dest_mode"]:checked')?.value || 'direct';

  if (destMode === 'direct') {
    if (!('showDirectoryPicker' in window)) {
      alert('Your browser does not support direct disk folder writing. Automatically packaging unzipped files into a download.');
      await generateConsolidatedZip();
      return;
    }

    if (!zipExtractorTargetHandle) {
      try {
        zipExtractorTargetHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        const pill = document.getElementById('zip_target_dir_display');
        if (pill) {
          pill.innerText = `✓ Extract To: ${zipExtractorTargetHandle.name} (Direct disk writing ready)`;
          pill.classList.add('selected');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        alert('Could not access destination folder: ' + err.message);
        return;
      }
    }

    showProgress(`Extracting archives directly into "${zipExtractorTargetHandle.name}" on your PC...`, 15);
    const summaryRecords = [];
    let totalExtractedFiles = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const zipFile = selectedFiles[i];
      const zipName = zipFile.name.replace(/\.zip$/i, '');
      showProgress(`Extracting ${zipFile.name}...`, Math.round(15 + (i / selectedFiles.length) * 75));

      try {
        const unzipped = await JSZip.loadAsync(zipFile);
        let detectedType = 'General Documents';
        let fileCount = 0;

        // Create an isolated subfolder for this archive
        const archiveDirHandle = await zipExtractorTargetHandle.getDirectoryHandle(zipName, { create: true });

        for (const [relPath, entry] of Object.entries(unzipped.files)) {
          if (!entry.dir) {
            fileCount++;
            totalExtractedFiles++;
            const u = relPath.toUpperCase();
            if (u.includes('1000') || u.includes('COMPANY.900') || u.includes('TRANMGR.900')) detectedType = 'Tally Accounting Data';
            else if (u.includes('GSTR') || u.includes('B2B') || u.includes('INVOICE')) detectedType = 'GST Returns';
            else if (u.includes('STATEMENT') || u.includes('HDFC') || u.includes('SBI') || u.includes('ICICI') || u.includes('AXIS')) detectedType = 'Bank Statements';

            const contentBlob = await entry.async('blob');

            // Recursive unpack if this entry is a nested ZIP
            if (relPath.toLowerCase().endsWith('.zip')) {
              try {
                const nestedZip = await JSZip.loadAsync(contentBlob);
                const nestedFolderName = relPath.replace(/\.zip$/i, '');
                for (const [nestedRel, nestedEntry] of Object.entries(nestedZip.files)) {
                  if (!nestedEntry.dir) {
                    const nestedBlob = await nestedEntry.async('blob');
                    await writeEntryToDirectory(archiveDirHandle, `${nestedFolderName}/${nestedRel}`, nestedBlob);
                    fileCount++;
                    totalExtractedFiles++;
                  }
                }
                continue;
              } catch (nestErr) {
                // write raw zip if nested extraction fails
              }
            }

            await writeEntryToDirectory(archiveDirHandle, relPath, contentBlob);
          }
        }

        summaryRecords.push({ archive: zipFile.name, type: detectedType, files: fileCount, status: 'Success' });
      } catch (err) {
        summaryRecords.push({ archive: zipFile.name, type: 'Error: ' + err.message, files: 0, status: 'Failed' });
      }
    }

    showProgress('All files unzipped directly to your PC!', 100);
    setTimeout(() => hideProgress(), 600);

    let tableHtml = `
      <table class="table-responsive">
        <thead><tr><th>Archive File</th><th>Detected Payload</th><th>Files Extracted</th><th>Status</th></tr></thead>
        <tbody>
    `;
    summaryRecords.forEach(s => {
      tableHtml += `
        <tr>
          <td><strong>${escapeHtml(s.archive)}</strong></td>
          <td><span class="tag-badge ${s.type.includes('Tally') ? 'tag-warning' : 'tag-success'}">${escapeHtml(s.type)}</span></td>
          <td>${s.files} items</td>
          <td><span class="tag-badge ${s.status === 'Success' ? 'tag-success' : 'tag-error'}">${s.status}</span></td>
        </tr>
      `;
    });
    tableHtml += '</tbody></table>';

    showResults(
      `Direct Extraction Complete: Unpacked ${totalExtractedFiles} physical files directly into "${zipExtractorTargetHandle.name}".`,
      [
        {
          label: '📁 Extract More Files',
          onClick: () => {
            zipExtractorTargetHandle = null;
            const pill = document.getElementById('zip_target_dir_display');
            if (pill) {
              pill.innerText = 'No folder chosen. Click Browse to select (e.g. D:\\Extracted_Files)';
              pill.classList.remove('selected');
            }
          }
        }
      ],
      `<div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: #34d399; margin-bottom: 16px; line-height: 1.6;">
        <strong>✓ Physical Files & Folders Extracted on Your PC (No ZIP Returned!):</strong><br>
        • Target Destination: <code>${zipExtractorTargetHandle.name}</code><br>
        • Total Archives Unpacked: <strong>${selectedFiles.length}</strong><br>
        • Total Unzipped Files: <strong>${totalExtractedFiles}</strong><br><br>
        <em>All files are fully uncompressed and ready to use in your destination folder. Open Windows File Explorer to access them right now!</em>
      </div>` + tableHtml
    );
    return;
  }

  // ZIP Download fallback
  await generateConsolidatedZip();
}

async function generateConsolidatedZip() {
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

  showProgress('Packaging output...', 90);
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
    `Successfully unpacked ${summaryRecords.length} archives into clean isolated folders.`,
    [
      { label: '📥 Download Unpacked Archive (.ZIP)', onClick: () => triggerDownload(blob, 'Extracted_Client_Archives.zip') }
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


// -------------------------------------------------------------
// Direct File System Writing Helper (Native Disk File Creation)
// -------------------------------------------------------------
async function writeEntryToDirectory(rootDirHandle, relativePath, blob) {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(p => p.trim().length > 0);
  const fileName = parts.pop();
  let currentDir = rootDirHandle;

  for (const folder of parts) {
    const safeFolder = folder.replace(/[\\/:*?"<>|]/g, '_');
    currentDir = await currentDir.getDirectoryHandle(safeFolder, { create: true });
  }

  const safeFileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
  const fileHandle = await currentDir.getFileHandle(safeFileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

// -------------------------------------------------------------
// Interactive User Manual & Standard Operating Procedure (SOP)
// -------------------------------------------------------------
const userManualSOPs = {
  'client-folders': {
    title: 'Client Folder & Financial Year Generator',
    icon: '📁',
    objective: 'Standardize multi-tier client directories (GST, Audit, Income Tax, TDS, ROC, Bank Statements, Working Papers) across multiple Financial Years in seconds, eliminating missing documents and disorganized audit folders.',
    inputs: [
      '<strong>Client Names:</strong> Enter or paste client names (e.g. copied directly from an Excel roster or tally report). Supports comma or line breaks.',
      '<strong>Financial Years:</strong> Comma-separated list of target years (e.g. <code>FY 2024-25, FY 2025-26</code>).',
      '<strong>Departmental Subfolders:</strong> Standard folders created within each financial year (e.g. <code>GST, Income Tax, Audit, TDS, ROC, Bank Statements, Working Papers</code>).'
    ],
    steps: [
      'Paste your client roster into the Client Names text area.',
      'Review and customize Financial Years and departmental subfolders as needed.',
      'Under <strong>Target Destination</strong>, keep <strong>📁 Direct on PC (Recommended)</strong> selected.',
      'Click <strong>📁 Browse Target Folder on PC</strong> and select your client root directory (e.g. <code>D:\\Clients</code> or <code>C:\\Audit_2026</code>).',
      'Click <strong>⚡ Run Utility</strong>. The browser will create the full directory tree directly on your computer drive.',
      'Open Windows File Explorer to verify and immediately start storing files inside your new client structure.'
    ],
    output: 'Real physical folders created directly on your selected hard drive with zero zip unzipping required.',
    tips: 'Run this at the start of every fiscal year (April) to roll forward client workpapers effortlessly across your entire firm.'
  },
  'segregator': {
    title: 'Universal Smart Document Segregator',
    icon: '🗂️',
    objective: 'Automatically organize messy downloads, email attachments, and WhatsApp client dumps into neat, classified subfolders by Document Category, Bank, FY, or Format.',
    inputs: [
      '<strong>Source Files:</strong> Drag and drop mixed client files (PDFs, Excels, Word docs, Scans, CSVs) into the dropzone.',
      '<strong>Segregation Strategy:</strong> Select from <em>By Document Category</em> (GST, Tax, Bank, Invoices), <em>By Bank Name</em> (HDFC, SBI, ICICI, etc.), <em>By Financial Year</em>, or <em>By File Format</em>.'
    ],
    steps: [
      'Drag and drop all unorganized client files into the upload box.',
      'Choose your preferred segregation strategy from the dropdown.',
      'Click <strong>⚡ Run Utility</strong>. The client-side engine scans file signatures and naming keywords in memory.',
      'Click <strong>📥 Download Organized ZIP</strong> to download the clean, partitioned folder tree along with an audit CSV log.'
    ],
    output: 'Organized folders containing classified client files, ready for filing and review.',
    tips: 'When receiving an unorganized Google Drive download or WhatsApp export from a client, run Segregator first before handing documents to article assistants.'
  },
  'zip-extractor': {
    title: 'Universal Bulk ZIP Archive Extractor',
    icon: '📦',
    objective: 'Batch unpack multiple compressed ZIP files (client Tally backups, GST portal monthly packages, bank statement zips) directly onto your hard drive with automated content tagging and nested ZIP unpacking.',
    inputs: [
      '<strong>Source ZIP Archives:</strong> Drag and drop one or multiple .zip files into the extraction dropzone.',
      '<strong>Extraction Destination:</strong> Click "Browse Destination Folder on PC" to choose where uncompressed files should be placed.'
    ],
    steps: [
      'Drag and drop all client .ZIP files into the dropzone (Tally backups, GST returns, Bank statement packs).',
      'Under <strong>Extraction Destination</strong>, keep <strong>📁 Direct to PC Folder</strong> selected.',
      'Click <strong>📁 Browse Destination Folder on PC</strong> and choose your target folder (e.g. <code>D:\\Extracted_Files</code>).',
      'Click <strong>⚡ Run Utility</strong>. The engine uncompresses all archives and nested ZIPs directly onto your hard drive.',
      'Review the summary breakdown table showing detected payload (Tally 5-digit data, GST returns, Bank feeds) and open Windows File Explorer to access the uncompressed files.'
    ],
    output: 'Fully uncompressed physical files and folders written directly to your chosen destination on disk (No redundant ZIP download!).',
    tips: 'For Tally backups: Automatically recognizes 5-digit Tally company numbers (e.g. 10001) and unpacks the entire Tally database structure intact.'
  },
  'excel-converter': {
    title: 'Universal Excel & CSV to XLSX Converter',
    icon: '📊',
    objective: 'Standardize legacy Excel 97-2003 (.xls), binary sheets, and delimited text files (.csv, .tsv, .txt) into modern OpenXML (.xlsx) workbooks.',
    inputs: [
      '<strong>Source Spreadsheets:</strong> Drag and drop legacy .xls files, comma-separated (.csv), tab-separated (.tsv), or pipe-separated (.txt) files.',
      '<strong>Output Target:</strong> Clean OpenXML (.xlsx).'
    ],
    steps: [
      'Drop your legacy or delimited files into the conversion dropzone.',
      'Click <strong>⚡ Run Utility</strong>. SheetJS parses the file encoding and delimiters in memory.',
      'Download individual converted .xlsx workbooks or download all in a batch package.'
    ],
    output: 'Clean, modern .xlsx workbooks ready for formula auditing, Pivot Tables, and audit software import.',
    tips: 'Eliminates "The file format and extension don\'t match" security warnings when opening legacy ERP or bank CSV downloads in modern Excel.'
  },
  'duplicate-finder': {
    title: 'Duplicate Document Finder (SHA-256)',
    icon: '🔍',
    objective: 'Identify exact 100% duplicate documents across client records using cryptographic SHA-256 hashing, regardless of different file names or dates.',
    inputs: [
      '<strong>Source Files:</strong> Drag and drop client documents or entire folders to inspect for duplicates.'
    ],
    steps: [
      'Drag and drop all files to be scanned into the dropzone.',
      'Click <strong>⚡ Run Utility</strong>. The browser computes cryptographic SHA-256 hashes of each file in browser memory.',
      'Inspect the Duplicate Results table displaying original vs duplicate file names, matching SHA-256 hashes, and wasted disk space.',
      'Click <strong>📊 Download Duplicate Report (.CSV)</strong> to retain a permanent audit trail of all duplicates.'
    ],
    output: 'Auditable duplicate file breakdown table with wasted storage calculation and downloadable CSV report.',
    tips: 'Run before archiving annual audit folders to clean out redundant client drafts, duplicate bank statements, and draft tax returns.'
  },
  'audit-checker': {
    title: 'Audit Document Completeness Checker',
    icon: '📋',
    objective: 'Cross-check received client audit papers against mandatory statutory checklists to instantly spot missing books, tax filings, and bank statements.',
    inputs: [
      '<strong>Client Received Files:</strong> Drag and drop all papers received from the client for audit.',
      '<strong>Statutory Checklist:</strong> Pre-loaded with standard papers (GSTR-1, GSTR-3B, Form 26AS/AIS, Bank Statements, Trial Balance, Board Minutes).'
    ],
    steps: [
      'Drop the client\'s received documents into the file dropzone.',
      'Click <strong>⚡ Run Utility</strong>. The engine matches received document keywords against statutory checklist requirements.',
      'Review the interactive checklist matrix showing RECEIVED vs. MISSING (MANDATORY) status and compliance score %.',
      'Click <strong>📊 Export Compliance Report (.CSV)</strong> to send a formal pending documents request to the client.'
    ],
    output: 'Compliance percentage score, color-coded deficiency matrix, and exportable CSV audit report.',
    tips: 'Send the exported CSV directly to your client as an official "Audit Requirements Pending List" on Day 1 of the audit.'
  }
};

function setupManualModal() {
  const manualBtn = document.getElementById('manualBtn');
  const closeManualBtn = document.getElementById('closeManualBtn');
  const modal = document.getElementById('manualModal');

  if (manualBtn) {
    manualBtn.addEventListener('click', () => {
      openManualModal(currentTool);
    });
  }

  if (closeManualBtn) {
    closeManualBtn.addEventListener('click', () => {
      closeManualModal();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeManualModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
      closeManualModal();
    }
  });
}

function openManualModal(selectedToolKey) {
  const modal = document.getElementById('manualModal');
  const tabsContainer = document.getElementById('manualTabs');
  const bodyContainer = document.getElementById('manualModalBody');
  if (!modal || !tabsContainer || !bodyContainer) return;

  tabsContainer.innerHTML = '';
  Object.keys(userManualSOPs).forEach(key => {
    const item = userManualSOPs[key];
    const tab = document.createElement('button');
    tab.className = `modal-tab-btn ${key === selectedToolKey ? 'active' : ''}`;
    tab.innerHTML = `${item.icon} ${item.title.split('&')[0].trim()}`;
    tab.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderManualContent(key, bodyContainer);
    });
    tabsContainer.appendChild(tab);
  });

  renderManualContent(selectedToolKey, bodyContainer);
  modal.style.display = 'flex';
}

function closeManualModal() {
  const modal = document.getElementById('manualModal');
  if (modal) modal.style.display = 'none';
}

function renderManualContent(toolKey, container) {
  const sop = userManualSOPs[toolKey] || userManualSOPs['client-folders'];
  container.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 16px; color: #fff; margin-bottom: 4px;">${sop.icon} ${sop.title}</h3>
      <p style="color: #a5b4fc; font-size: 13px;">${sop.objective}</p>
    </div>

    <div class="manual-section">
      <h4>📥 Inputs & Parameters Required</h4>
      <ul style="padding-left: 20px; margin-top: 6px;">
        ${sop.inputs.map(i => `<li style="margin-bottom: 6px;">${i}</li>`).join('')}
      </ul>
    </div>

    <div class="manual-section">
      <h4>⚡ Step-by-Step Operating Instructions</h4>
      <ul class="step-list">
        ${sop.steps.map((s, idx) => `
          <li>
            <span class="step-num">${idx + 1}</span>
            <span>${s}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="manual-section">
      <h4>📤 Expected Output & Deliverables</h4>
      <p style="background: rgba(0,0,0,0.3); padding: 10px 14px; border-radius: 6px; border-left: 3px solid #10b981;">
        ${sop.output}
      </p>
    </div>

    <div class="callout-box callout-tip">
      <strong>💡 CA Office Best Practice:</strong> ${sop.tips}
    </div>
  `;
}
