document.addEventListener('DOMContentLoaded', function () {
    // --- Pengecekan Library Krusial ---
    if (!window.jspdf || !window.jspdf.jsPDF) {
        console.error("FATAL ERROR: Pustaka jsPDF tidak termuat!");
        alert("KESALAHAN KRITIS: Pustaka PDF (jsPDF) gagal dimuat. Aplikasi mungkin tidak berfungsi. Coba refresh atau periksa koneksi & adblocker.");
        document.querySelectorAll('.action-btn').forEach(btn => btn && (btn.disabled = true));
        return;
    }
    if (!window.html2canvas) {
        console.warn("Pustaka html2canvas tidak termuat. Pratinjau gambar di form mungkin tidak optimal.");
    }

    const {
        jsPDF
    } = window.jspdf;

    // Helper DOM
    function $(id) {
        const el = document.getElementById(id);
        if (!el) console.error(`FATAL DOM QUERY: Elemen dengan ID '${id}' tidak ditemukan.`);
        return el;
    }

    // Elements
    const form = $('bugReportForm');
    const apiKeyInput = $('apiKey');
    const toggleApiKeyVisibilityBtn = $('toggleApiKeyVisibility');
    const reportDateInput = $('reportDate');
    const reportIdInput = $('reportId');
    const addStepBtn = $('addStepBtn');
    const stepsContainer = $('stepsToReproduceContainer');
    const addReferenceBtn = $('addReferenceBtn');
    const referencesContainer = $('referencesContainer');
    const screenshotInput = $('screenshots');
    const screenshotPreviews = $('screenshotPreviews');
    const previewReportBtn = $('previewReportBtn');
    const downloadPdfBtn = $('downloadPdfBtn');
    const autoFillAllBtn = $('autoFillAllBtn');
    const htmlPreviewArea = $('htmlPreviewArea');
    const reportContentForHtmlPreview = $('reportContentForHtmlPreview');
    const closeHtmlPreviewBtn = $('closeHtmlPreview');
    const loadingIndicator = $('loadingIndicator');
    let uploadedScreenshotData = [];

    // Inisialisasi Tanggal & ID
    function initializeApp() {
        console.log("Pro MAX v7 (Error Free Focus) Report App Initialized.");
        try {
            const today = new Date();
            if (reportDateInput) reportDateInput.valueAsDate = today;
            if (reportIdInput) reportIdInput.value = `BUGREP-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${String(Date.now()).slice(-6)}`;
        } catch (e) {
            console.error("Error during app initialization (date/ID fields):", e);
        }
    }
    initializeApp();

    // Toggle API Key visibility
    if (toggleApiKeyVisibilityBtn && apiKeyInput) {
        toggleApiKeyVisibilityBtn.addEventListener('click', () => {
            apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
            toggleApiKeyVisibilityBtn.textContent = apiKeyInput.type === 'password' ? 'Tampilkan' : 'Sembunyikan';
        });
    }

    // Tombol tambah langkah
    function createRemoveButton(onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.classList.add('remove-btn', 'add-remove-btn');
        btn.textContent = 'Hapus';
        btn.onclick = onClick;
        return btn;
    }
    if (addStepBtn && stepsContainer) {
        addStepBtn.addEventListener('click', () => {
            const count = stepsContainer.children.length + 1;
            const group = document.createElement('div');
            group.classList.add('step-group');
            const area = document.createElement('textarea');
            area.name = 'steps[]';
            area.rows = 3;
            area.placeholder = `Langkah ${count}: ...`;
            group.append(area, createRemoveButton(() => group.remove()));
            stepsContainer.appendChild(group);
        });
    }

    // Tombol tambah referensi
    if (addReferenceBtn && referencesContainer) {
        addReferenceBtn.addEventListener('click', () => {
            const group = document.createElement('div');
            group.classList.add('reference-group');
            const url = document.createElement('input');
            url.type = 'url';
            url.name = 'referenceUrls[]';
            url.placeholder = 'URL Referensi';
            const desc = document.createElement('input');
            desc.type = 'text';
            desc.name = 'referenceDescs[]';
            desc.placeholder = 'Deskripsi Singkat';
            group.append(url, desc, createRemoveButton(() => group.remove()));
            referencesContainer.appendChild(group);
        });
    }

    // Upload screenshot preview
    if (screenshotInput && screenshotPreviews) {
        screenshotInput.addEventListener('change', function (e) {
            screenshotPreviews.innerHTML = '';
            uploadedScreenshotData = [];
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            loadingIndicator && (loadingIndicator.style.display = 'flex', loadingIndicator.querySelector('p').textContent = `Memproses ${files.length} gambar...`);
            let processed = 0;
            files.forEach((file, idx) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                        uploadedScreenshotData[idx] = {
                            name: file.name,
                            type: file.type,
                            dataUrl: ev.target.result
                        };
                        const img = document.createElement('img');
                        img.src = ev.target.result;
                        img.alt = `Pratinjau ${file.name}`;
                        screenshotPreviews.appendChild(img);
                    };
                    reader.onerror = () => console.error("Gagal membaca file:", file.name);
                    reader.onloadend = () => {
                        processed++;
                        if (processed === files.length) loadingIndicator.style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                } else {
                    console.warn(`File ${file.name} bukan gambar, dilewati.`);
                    uploadedScreenshotData[idx] = null;
                    processed++;
                    if (processed === files.length) loadingIndicator.style.display = 'none';
                }
            });
        });
    }

    // Utility HTML Escape & Markdown→HTML
    function escapeHtml(unsafe) {
        if (unsafe == null) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/`/g, "&#96;");
    }

    function simpleMarkdownToHtml(md) {
        if (typeof md !== 'string') return '';
        let html = escapeHtml(md);
        html = html.replace(/\*\*(.*?)\*\*|\_\_(.*?)\_\_/gs, '<strong>$1$2</strong>');
        html = html.replace(/\*(.*?)\*|\_(.*?)\_/gs, '<em>$1$2</em>');
        return html.replace(/\n/g, '<br>');
    }

    // AI Buttons (Gemini)
    document.querySelectorAll('.ai-generate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const basePrompt = btn.dataset.promptBase;
            const titleEl = document.getElementById('reportTitle');
            const titleVal = (titleEl && titleEl.value.trim()) || "sebuah kerentanan keamanan web umum";
            const fullPrompt = `${basePrompt} "${titleVal}". Jawaban harus dalam Bahasa Indonesia yang formal, sangat teknis, sangat detail, dan profesional...`;
            callGeminiAPI(fullPrompt, targetId);
        });
    });

    // Auto-fill semua section via AI
    if (autoFillAllBtn) {
        autoFillAllBtn.addEventListener('click', async () => {
            const titleEl = document.getElementById('reportTitle');
            const titleVal = titleEl ? titleEl.value.trim() : '';
            if (!titleVal) return alert("Mohon isi Judul Laporan dahulu untuk konteks AI.");
            const sections = [{
                    id: 'problemDescription',
                    promptBase: 'Berikan deskripsi masalah umum untuk kerentanan berikut: '
                },
                {
                    id: 'identifiedIssue',
                    promptBase: 'Berikan deskripsi teknis spesifik untuk masalah yang diidentifikasi terkait: '
                },
                {
                    id: 'affectedDemographics',
                    promptBase: 'Jelaskan basis demografi/pengguna yang terpengaruh dan potensi dampak bisnis signifikan untuk masalah: '
                },
                {
                    id: 'recommendedRemediation',
                    promptBase: 'Berikan rekomendasi perbaikan teknis yang sangat detail...: '
                }
            ];
            loadingIndicator && (loadingIndicator.style.display = 'flex');
            for (let i = 0; i < sections.length; i++) {
                const sec = sections[i];
                loadingIndicator && (loadingIndicator.querySelector('p').textContent = `AI mengisi ${i+1}/${sections.length}: ${sec.id}...`);
                const prompt = `${sec.promptBase} "${titleVal}". Jawaban harus dalam Bahasa Indonesia yang formal...`;
                await callGeminiAPI(prompt, sec.id);
                if (i < sections.length - 1) await new Promise(r => setTimeout(r, 1800));
            }
            loadingIndicator && (loadingIndicator.style.display = 'none');
            alert("Pengisian otomatis oleh AI selesai. Mohon periksa dan sesuaikan hasilnya.");
        });
    }

    async function callGeminiAPI(prompt, targetId) {
        const key = apiKeyInput ? apiKeyInput.value.trim() : '';
        if (!key || key === "MASUKKAN_API_KEY_ANDA_DISINI") {
            return alert("Kunci API Gemini belum diisi atau tidak valid.");
        }
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return alert(`Elemen target dengan ID '${targetId}' tidak ditemukan.`);
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;
        let origLoading = loadingIndicator && loadingIndicator.querySelector('p').textContent;
        loadingIndicator && (loadingIndicator.style.display = 'flex', loadingIndicator.querySelector('p').textContent = `AI sedang memproses: ${targetId}...`);
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({
                    error: {
                        message: res.statusText
                    }
                }));
                throw new Error(`Error ${res.status}: ${errData.error?.message || 'Unknown API error'}`);
            }
            const data = await res.json();
            const text = data.candidates ?. [0] ?.content ?.parts ?. [0] ?.text;
            if (!text) throw new Error("Struktur respons API tidak dikenali.");
            // hapus markdown **, *, _
            targetEl.value = text.replace(/\*\*(.*?)\*\*/gs, '$1').replace(/\*(.*?)\*/gs, '$1').replace(/\_(.*?)\_/gs, '$1');
        } catch (err) {
            console.error("Gemini API Error:", err);
            alert(`Gagal mengambil data dari AI: ${err.message}`);
        } finally {
            loadingIndicator && (loadingIndicator.querySelector('p').textContent = origLoading, loadingIndicator.style.display = 'none');
        }
    }

    // Ambil data form
    function getFormData() {
        const data = {};

        function getEl(id) {
            const e = $(id);
            return e ? e.value.trim() : '';
        }

        function getElRaw(id) {
            const e = $(id);
            return e ? e.value : '';
        }
        data.reporterName = getEl('reporterName');
        data.reporterEmail = getEl('reporterEmail');
        data.reporterOrganization = getEl('reporterOrganization');
        data.reportDate = getEl('reportDate');
        data.reportId = getEl('reportId');
        data.reportTitle = getEl('reportTitle');
        data.problemDescription = getElRaw('problemDescription');
        data.identifiedIssue = getElRaw('identifiedIssue');
        data.affectedUrls = getElRaw('affectedUrls');
        data.riskSeverity = getEl('riskSeverity');
        data.exploitDifficulty = getEl('exploitDifficulty');
        data.cvssScore = getEl('cvssScore');
        data.cvssVector = getEl('cvssVector');
        data.affectedDemographics = getElRaw('affectedDemographics');
        data.recommendedRemediation = getElRaw('recommendedRemediation');
        data.steps = stepsContainer ?
            Array.from(stepsContainer.querySelectorAll('textarea[name="steps[]"]'))
            .map(a => a.value.trim()).filter(v => v) : [];
        const urls = referencesContainer ?
            Array.from(referencesContainer.querySelectorAll('input[name="referenceUrls[]"]')).map(i => i.value.trim()).filter(v => v) : [];
        const descs = referencesContainer ?
            Array.from(referencesContainer.querySelectorAll('input[name="referenceDescs[]"]')).map(i => i.value.trim()) : [];
        data.referenceUrls = urls;
        data.referenceDescs = urls.map((u, i) => descs[i] || '');
        return data;
    }

    // Preview HTML aman
    if (previewReportBtn && htmlPreviewArea && reportContentForHtmlPreview && closeHtmlPreviewBtn) {
        previewReportBtn.addEventListener('click', generateSecureHtmlPreview);
        closeHtmlPreviewBtn.addEventListener('click', () => htmlPreviewArea.style.display = 'none');
    }

    function generateSecureHtmlPreview() {
        loadingIndicator && (loadingIndicator.style.display = 'flex', loadingIndicator.querySelector('p').textContent = 'Membuat pratinjau konten...');
        const data = getFormData();
        let html = `<h1>${escapeHtml(data.reportTitle)||'Laporan Belum Berjudul'}</h1>`;
        html += `<p><strong>Pelapor:</strong> ${escapeHtml(data.reporterName)||'N/A'} (${escapeHtml(data.reporterEmail)||'N/A'})</p>`;
        if (data.reporterOrganization) html += `<p><strong>Organisasi:</strong> ${escapeHtml(data.reporterOrganization)}</p>`;
        let formattedDate = 'N/A';
        try {
            formattedDate = data.reportDate ?
                new Date(data.reportDate + 'T00:00:00Z')
                .toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC'
                }) :
                'N/A';
        } catch {}
        html += `<p><strong>Tanggal:</strong> ${formattedDate} | <strong>ID:</strong> ${escapeHtml(data.reportId)||'N/A'}</p><hr>`;

        function addHtmlSection(title, content, md = false) {
            return `<h2>${escapeHtml(title)}</h2><div class="markdown-block">` +
                (md ? simpleMarkdownToHtml(content) : escapeHtml(content).replace(/\n/g, '<br>')) +
                `</div>`;
        }
        html += addHtmlSection("Deskripsi Masalah", data.problemDescription, true);
        html += addHtmlSection("Masalah Spesifik yang Diidentifikasi", data.identifiedIssue, true);
        html += `<h2>URL/Area yang Terpengaruh</h2><ul>${
            (data.affectedUrls||"").split('\n').filter(u=>u.trim()).map(u=>`<li>${escapeHtml(u)}</li>`).join('') || '<li>N/A</li>'
        }</ul>`;
        html += `<h2>Analisis Risiko</h2><p><strong>Tingkat Risiko:</strong> ${escapeHtml(data.riskSeverity)}</p>` +
            `<p><strong>Kesulitan Eksploitasi:</strong> ${escapeHtml(data.exploitDifficulty)}</p>` +
            `<p><strong>Skor CVSS:</strong> ${escapeHtml(data.cvssScore)||'N/A'}</p>` +
            `<p><strong>Vektor CVSS:</strong> ${escapeHtml(data.cvssVector)||'N/A'}</p>`;
        html += `<h2>Langkah-langkah untuk Mereproduksi</h2><ol>` +
            (data.steps.length ? data.steps.map(s => `<li>${simpleMarkdownToHtml(s)}</li>`).join('') : '<li>N/A</li>') +
            `</ol>`;
        html += addHtmlSection("Dampak (Basis Pengguna & Bisnis)", data.affectedDemographics, true);
        html += addHtmlSection("Rekomendasi Perbaikan Teknis", data.recommendedRemediation, true);
        html += `<h2>Referensi</h2><ul>` +
            (data.referenceUrls.length ?
                data.referenceUrls.map((u, i) => `<li><a href="${escapeHtml(u)}" target="_blank">${escapeHtml(u)}</a>${data.referenceDescs[i]?' - '+escapeHtml(data.referenceDescs[i]):''}</li>`).join('') :
                '<li>N/A</li>') +
            `</ul>`;
        html += `<h2>Tangkapan Layar</h2>` +
            (uploadedScreenshotData.length ?
                uploadedScreenshotData.map((shot, i) =>
                    shot && shot.dataUrl ?
                    `<p><strong>Gambar ${i+1}:</strong> ${escapeHtml(shot.name)}</p><img src="${shot.dataUrl}" alt="${escapeHtml(shot.name)}">` :
                    ''
                ).join('') :
                "<p>Tidak ada.</p>");
        reportContentForHtmlPreview.innerHTML = html;
        htmlPreviewArea.style.display = 'block';
        htmlPreviewArea.scrollIntoView({
            behavior: 'smooth'
        });
        loadingIndicator && (loadingIndicator.style.display = 'none');
    }

    // --- PDF SETTINGS & Helpers ---
    const PDF_SETTINGS = {
        MARGIN_TOP: 72,
        MARGIN_BOTTOM: 72,
        MARGIN_LEFT: 65,
        MARGIN_RIGHT: 65,
        A4_WIDTH: 595.28,
        A4_HEIGHT: 841.89,
        FONT_SIZES: {
            pageHeader: 8.5,
            title: 20,
            h1: 16,
            h2: 13,
            h3: 11,
            body: 10.5,
            small: 8,
            caption: 9
        },
        LINE_HEIGHT_NORMAL: 1.45,
        LINE_HEIGHT_HEADING: 1.3,
        COLORS: {
            primary: '#C62828',
            text: '#263238',
            headingMain: '#A12020',
            headingSub: '#455A64',
            secondaryText: '#546E7A',
            line: '#B0BEC5',
            link: '#0D47A1'
        },
        FONTS: {
            default: 'Helvetica',
            bold: 'Helvetica-Bold',
            italic: 'Helvetica-Oblique',
            boldItalic: 'Helvetica-BoldOblique',
            times: 'Times-Roman',
            timesBold: 'Times-Bold',
            timesItalic: 'Times-Oblique',
            timesBoldItalic: 'Times-BoldOblique'
        }
    };
    PDF_SETTINGS.CONTENT_WIDTH = PDF_SETTINGS.A4_WIDTH - PDF_SETTINGS.MARGIN_LEFT - PDF_SETTINGS.MARGIN_RIGHT;
    PDF_SETTINGS.CONTENT_HEIGHT = PDF_SETTINGS.A4_HEIGHT - PDF_SETTINGS.MARGIN_TOP - PDF_SETTINGS.MARGIN_BOTTOM;

    let currentY_pdf, pdfDoc_global, currentPage_pdf;

    function pdfCheckAndAddPage(neededHeight = PDF_SETTINGS.FONT_SIZES.body * PDF_SETTINGS.LINE_HEIGHT_NORMAL) {
        if (!pdfDoc_global) return;
        if (currentY_pdf + neededHeight > PDF_SETTINGS.A4_HEIGHT - PDF_SETTINGS.MARGIN_BOTTOM) {
            pdfDoc_global.addPage();
            currentPage_pdf++;
            currentY_pdf = PDF_SETTINGS.MARGIN_TOP;
            pdfAddReportHeader();
        }
    }

    function pdfAddReportHeader() {
        if (currentPage_pdf <= 1 || !pdfDoc_global) return;
        pdfDoc_global.setFont(PDF_SETTINGS.FONTS.default, 'italic');
        pdfDoc_global.setFontSize(PDF_SETTINGS.FONT_SIZES.pageHeader);
        pdfDoc_global.setTextColor(PDF_SETTINGS.COLORS.secondaryText);
        const titleEl = document.getElementById('reportTitle');
        const titleVal = (titleEl && titleEl.value.trim()) || "Laporan Kerentanan";
        const truncated = titleVal.substring(0, 80) + (titleVal.length > 80 ? '...' : '');
        pdfDoc_global.text(truncated, PDF_SETTINGS.MARGIN_LEFT, PDF_SETTINGS.MARGIN_TOP * 0.6);
        pdfDoc_global.setDrawColor(PDF_SETTINGS.COLORS.line);
        pdfDoc_global.setLineWidth(0.5);
        const yLine = PDF_SETTINGS.MARGIN_TOP * 0.6 + PDF_SETTINGS.FONT_SIZES.pageHeader * 0.5 + 3;
        pdfDoc_global.line(PDF_SETTINGS.MARGIN_LEFT, yLine, PDF_SETTINGS.A4_WIDTH - PDF_SETTINGS.MARGIN_RIGHT, yLine);
    }

    // === PERBAIKAN pdfDrawStyledLine (baris ~290) ===
    function pdfDrawStyledLine(line, x, y, {
        fontSize,
        baseFontFamily,
        baseFontStyle,
        color
    }) {
        if (!pdfDoc_global) return;
        let currentX = x;
        pdfDoc_global.setFontSize(fontSize);
        // setTextColor array RGB atau hex string
        if (Array.isArray(color)) {
            pdfDoc_global.setTextColor(color[0], color[1], color[2]);
        } else {
            pdfDoc_global.setTextColor(color);
        }
        pdfDoc_global.setFont(baseFontFamily, baseFontStyle);

        const mdRegex = /(\*\*(.*?)\*\*|\*(.*?)\*|\_(.*?)\_)/g;
        let lastIndex = 0,
            m;
        while ((m = mdRegex.exec(line)) !== null) {
            if (m.index > lastIndex) {
                const plain = line.substring(lastIndex, m.index);
                pdfDoc_global.setFont(baseFontFamily, baseFontStyle);
                pdfDoc_global.text(plain, currentX, y);
                currentX += pdfDoc_global.getStringUnitWidth(plain) * fontSize / pdfDoc_global.internal.scaleFactor;
            }
            const content = m[2] || m[3] || m[4] || '';
            let style = baseFontStyle;
            if (m[2] !== undefined) { // bold
                style = baseFontStyle.includes('Oblique') ? 'boldItalic' : 'bold';
            } else if (m[3] !== undefined || m[4] !== undefined) { // italic
                style = baseFontStyle.includes('Bold') ? 'boldItalic' : 'italic';
            }
            pdfDoc_global.setFont(baseFontFamily, style);
            pdfDoc_global.text(content, currentX, y);
            currentX += pdfDoc_global.getStringUnitWidth(content) * fontSize / pdfDoc_global.internal.scaleFactor;
            lastIndex = m.index + m[0].length;
        }
        if (lastIndex < line.length) {
            const rest = line.substring(lastIndex);
            pdfDoc_global.setFont(baseFontFamily, baseFontStyle);
            pdfDoc_global.text(rest, currentX, y);
        }
    }

    // PDF wrapped text pakai default font yang benar
    function pdfAddWrappedText(text, x, _ignoreY, maxWidth, opts = {}) {
        const {
            fontSize = PDF_SETTINGS.FONT_SIZES.body,
                fontStyle = 'normal',
                fontFamily = PDF_SETTINGS.FONTS.default,
                lineHeightFactor = PDF_SETTINGS.LINE_HEIGHT_NORMAL,
                color = PDF_SETTINGS.COLORS.text,
                textAlign = 'left',
                isLink = false, url = '',
                prefixForList = ''
        } = opts;

        if (!pdfDoc_global) return;
        const textToSplit = String(text || "N/A").replace(/\r\n|\r/g, '\n');
        const lineHeight = fontSize * lineHeightFactor;
        pdfDoc_global.setFont(fontFamily, fontStyle);
        pdfDoc_global.setFontSize(fontSize);

        let lines;
        if (prefixForList) {
            const first = textToSplit.split('\n')[0];
            const rest = textToSplit.substring(first.length + (textToSplit.includes('\n') ? 1 : 0));
            lines = pdfDoc_global.splitTextToSize(prefixForList + first, maxWidth);
            if (rest) {
                const indentSize = pdfDoc_global.getStringUnitWidth(prefixForList) * fontSize / pdfDoc_global.internal.scaleFactor;
                const other = pdfDoc_global.splitTextToSize(rest, maxWidth - indentSize);
                lines = [...lines, ...other.map(l => ' '.repeat(Math.ceil(prefixForList.length / 1.8)) + l)];
            }
        } else {
            lines = pdfDoc_global.splitTextToSize(textToSplit, maxWidth);
        }

        lines.forEach((ln) => {
            pdfCheckAndAddPage(lineHeight);
            let lineX = x;
            if (textAlign !== 'left') {
                const plainLn = ln.replace(/\*\*|\*|\_/g, '');
                const w = pdfDoc_global.getStringUnitWidth(plainLn) * fontSize / pdfDoc_global.internal.scaleFactor;
                if (textAlign === 'center') lineX = x + (maxWidth - w) / 2;
                else if (textAlign === 'right') lineX = x + (maxWidth - w);
                lineX = Math.max(x, lineX);
            }
            pdfDrawStyledLine(ln, lineX, currentY_pdf, {
                fontSize,
                baseFontFamily: fontFamily,
                baseFontStyle: fontStyle,
                color
            });
            if (isLink && url && lines.length === 1 && ln.trim() === textToSplit.trim() && !prefixForList) {
                const w = pdfDoc_global.getStringUnitWidth(ln) * fontSize / pdfDoc_global.internal.scaleFactor;
                try {
                    pdfDoc_global.link(lineX, currentY_pdf - lineHeight + fontSize * 0.15, w, lineHeight, {
                        url
                    });
                } catch (e) {
                    console.warn("Gagal buat link PDF:", e);
                }
            }
            currentY_pdf += lineHeight;
        });
    }

    // Heading juga pakai default font
    function pdfAddHeading(level, text) {
        let fontSize, marginTop, marginBottom, color, fontFamily = PDF_SETTINGS.FONTS.default,
            fontStyle = 'normal',
            addLine;
        const baseLH = PDF_SETTINGS.FONT_SIZES.body * PDF_SETTINGS.LINE_HEIGHT_HEADING;
        text = String(text || "Tanpa Judul").replace(/\*\*(.*?)\*\*|\*(.*?)\*|\_(.*?)\_/g, '$1$2$3');

        switch (level) {
            case 0:
                fontSize = PDF_SETTINGS.FONT_SIZES.title;
                fontStyle = 'bold';
                color = PDF_SETTINGS.COLORS.primary;
                marginTop = 0;
                marginBottom = fontSize * 0.7;
                addLine = {
                    width: 1.5,
                    color: PDF_SETTINGS.COLORS.primary
                };
                pdfCheckAndAddPage(fontSize * PDF_SETTINGS.LINE_HEIGHT_HEADING + marginBottom + 5);
                pdfAddWrappedText(text, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                    fontSize,
                    fontFamily,
                    fontStyle,
                    color,
                    textAlign: 'center',
                    lineHeightFactor: PDF_SETTINGS.LINE_HEIGHT_HEADING
                });
                break;
            case 1:
                fontSize = PDF_SETTINGS.FONT_SIZES.h1;
                fontStyle = 'bold';
                color = PDF_SETTINGS.COLORS.headingMain;
                marginTop = baseLH * 1.3;
                marginBottom = fontSize * 0.4;
                addLine = {
                    width: 1,
                    color: PDF_SETTINGS.COLORS.headingMain
                };
                pdfCheckAndAddPage(marginTop + fontSize * PDF_SETTINGS.LINE_HEIGHT_HEADING + marginBottom + 5);
                currentY_pdf += marginTop;
                pdfAddWrappedText(text, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                    fontSize,
                    fontFamily,
                    fontStyle,
                    color,
                    lineHeightFactor: PDF_SETTINGS.LINE_HEIGHT_HEADING
                });
                break;
            case 2:
                fontSize = PDF_SETTINGS.FONT_SIZES.h2;
                fontStyle = 'bold';
                color = PDF_SETTINGS.COLORS.headingSub;
                marginTop = baseLH * 1.1;
                marginBottom = fontSize * 0.35;
                addLine = {
                    width: 0.7,
                    color: PDF_SETTINGS.COLORS.secondaryText
                };
                pdfCheckAndAddPage(marginTop + fontSize * PDF_SETTINGS.LINE_HEIGHT_HEADING + marginBottom + 4);
                currentY_pdf += marginTop;
                pdfAddWrappedText(text, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                    fontSize,
                    fontFamily,
                    fontStyle,
                    color,
                    lineHeightFactor: PDF_SETTINGS.LINE_HEIGHT_HEADING
                });
                break;
            case 3:
                fontSize = PDF_SETTINGS.FONT_SIZES.h3;
                fontStyle = 'italic';
                color = PDF_SETTINGS.COLORS.text;
                marginTop = baseLH * 0.9;
                marginBottom = fontSize * 0.3;
                addLine = {
                    width: 0.5,
                    color: PDF_SETTINGS.COLORS.line,
                    dotted: true
                };
                pdfCheckAndAddPage(marginTop + fontSize * PDF_SETTINGS.LINE_HEIGHT_HEADING + marginBottom + 3);
                currentY_pdf += marginTop;
                pdfAddWrappedText(text, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                    fontSize,
                    fontFamily,
                    fontStyle,
                    color,
                    lineHeightFactor: PDF_SETTINGS.LINE_HEIGHT_HEADING
                });
                break;
        }

        currentY_pdf += marginBottom;
        if (addLine && level < 3) {
            if (typeof addLine.color === 'string') pdfDoc_global.setDrawColor(addLine.color);
            else pdfDoc_global.setDrawColor(addLine.color[0], addLine.color[1], addLine.color[2]);
            pdfDoc_global.setLineWidth(addLine.width);
            if (addLine.dotted) pdfDoc_global.setLineDashPattern([1.5, 1.5], 0);
            const yLine = currentY_pdf - marginBottom * 0.3;
            pdfDoc_global.line(PDF_SETTINGS.MARGIN_LEFT, yLine, PDF_SETTINGS.MARGIN_LEFT + PDF_SETTINGS.CONTENT_WIDTH, yLine);
            if (addLine.dotted) pdfDoc_global.setLineDashPattern([], 0);
            currentY_pdf += addLine.width + 3;
        }
        currentY_pdf += PDF_SETTINGS.FONT_SIZES.body * 0.5;
    }

    // Generate & Download PDF
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', async () => {
            console.log("Pro MAX v7 PDF Generation Started.");
            loadingIndicator && (loadingIndicator.style.display = 'flex', loadingIndicator.querySelector('p').textContent = "Mempersiapkan PDF Profesional...");
            try {
                pdfDoc_global = new jsPDF({
                    orientation: 'p',
                    unit: 'pt',
                    format: 'a4'
                });
                currentY_pdf = PDF_SETTINGS.MARGIN_TOP;
                currentPage_pdf = 1;
                const data = getFormData();
                const defaultFont = PDF_SETTINGS.FONTS.default;

                pdfAddHeading(0, data.reportTitle || "Laporan Kerentanan Tidak Berjudul");

                const smallH = PDF_SETTINGS.FONT_SIZES.small * PDF_SETTINGS.LINE_HEIGHT_NORMAL;
                pdfCheckAndAddPage(smallH * 5);
                let infoStart = currentY_pdf;
                pdfAddWrappedText(`ID Laporan: ${data.reportId||'N/A'}`, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                    fontSize: PDF_SETTINGS.FONT_SIZES.small,
                    color: PDF_SETTINGS.COLORS.secondaryText,
                    fontFamily: defaultFont
                });
                let fmtDate = 'N/A';
                try {
                    fmtDate = data.reportDate ?
                        new Date(data.reportDate + 'T00:00:00Z')
                        .toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            timeZone: 'UTC'
                        }) :
                        'N/A';
                } catch {}
                pdfAddWrappedText(`Tanggal: ${fmtDate}`, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                    fontSize: PDF_SETTINGS.FONT_SIZES.small,
                    color: PDF_SETTINGS.COLORS.secondaryText,
                    fontFamily: defaultFont
                });
                currentY_pdf += PDF_SETTINGS.FONT_SIZES.body * 0.3;
                pdfAddWrappedText(`Pelapor: ${data.reporterName||'N/A'}`, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                    fontStyle: 'bold',
                    fontFamily: defaultFont
                });
                pdfAddWrappedText(`Email: ${data.reporterEmail||'N/A'}`, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                    color: PDF_SETTINGS.COLORS.link,
                    isLink: true,
                    url: `mailto:${data.reporterEmail}`,
                    fontFamily: defaultFont
                });
                if (data.reporterOrganization) {
                    pdfAddWrappedText(`Organisasi: ${data.reporterOrganization}`, PDF_SETTINGS.MARGIN_LEFT, currentY_pdf, PDF_SETTINGS.CONTENT_WIDTH, {
                        fontFamily: defaultFont
                    });
                }
                pdfDoc_global.setDrawColor(PDF_SETTINGS.COLORS.line);
                pdfDoc_global.setLineWidth(0.5);
                pdfDoc_global.rect(PDF_SETTINGS.MARGIN_LEFT - 7, infoStart - 7, PDF_SETTINGS.CONTENT_WIDTH + 14, currentY_pdf - infoStart + 7);
                currentY_pdf += PDF_SETTINGS.FONT_SIZES.body * 1.5;

                const sections = [{
                        title: "1. Deskripsi Masalah",
                        contentKey: "problemDescription"
                    },
                    {
                        title: "2. Masalah Spesifik yang Diidentifikasi",
                        contentKey: "identifiedIssue"
                    },
                    {
                        title: "3. URL/Area yang Terpengaruh",
                        type: "list",
                        contentKey: "affectedUrls",
                        splitChar: '\n'
                    },
                    {
                        title: "4. Analisis Risiko",
                        type: "risk"
                    },
                    {
                        title: "5. Langkah-langkah untuk Mereproduksi",
                        type: "ordered-list",
                        contentKey: "steps"
                    },
                    {
                        title: "6. Dampak (Basis Pengguna & Bisnis)",
                        contentKey: "affectedDemographics"
                    },
                    {
                        title: "7. Rekomendasi Perbaikan Teknis",
                        contentKey: "recommendedRemediation"
                    },
                    {
                        title: "8. Referensi",
                        type: "references"
                    },
                    {
                        title: "9. Lampiran Tangkapan Layar",
                        type: "screenshots"
                    }
                ];

                for (const sec of sections) {
                    if (!pdfDoc_global) break;
                    pdfAddHeading(1, sec.title);
                    const lineH = PDF_SETTINGS.FONT_SIZES.body * PDF_SETTINGS.LINE_HEIGHT_NORMAL;
                    const indent = 18;
                    const opts = {
                        fontFamily: defaultFont
                    };

                    if (sec.type === 'list' || sec.type === 'ordered-list') {
                        const raw = sec.splitChar ?
                            (data[sec.contentKey] || "").split(sec.splitChar) :
                            data[sec.contentKey] || [];
                        const items = raw.map(i => i.trim()).filter(Boolean);
                        if (items.length) {
                            items.forEach((it, idx) => {
                                pdfCheckAndAddPage(lineH * 1.5);
                                const pre = sec.type === 'ordered-list' ? `${idx+1}. ` : '• ';
                                pdfAddWrappedText(it, PDF_SETTINGS.MARGIN_LEFT + indent, 0, PDF_SETTINGS.CONTENT_WIDTH - indent, {
                                    ...opts,
                                    prefixForList: pre
                                });
                            });
                        } else {
                            pdfAddWrappedText("N/A", PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, opts);
                        }
                    } else if (sec.type === 'risk') {
                        pdfCheckAndAddPage(lineH * 5);
                        pdfAddWrappedText(`Tingkat Risiko: ${data.riskSeverity||'N/A'}`, PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, {
                            ...opts,
                            fontStyle: 'bold'
                        });
                        pdfAddWrappedText(`Kesulitan Eksploitasi: ${data.exploitDifficulty||'N/A'}`, PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, opts);
                        pdfAddWrappedText(`Skor CVSS: ${data.cvssScore||'N/A'}`, PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, opts);
                        pdfAddWrappedText(`Vektor CVSS: ${data.cvssVector||'N/A'}`, PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, opts);
                    } else if (sec.type === 'references') {
                        const urls = data.referenceUrls || [];
                        const descs = data.referenceDescs || [];
                        if (urls.length && urls.some(u => u.trim())) {
                            urls.forEach((u, i) => {
                                if (u.trim()) {
                                    const txt = `• ${escapeHtml(u)}${descs[i]?' ('+escapeHtml(descs[i])+')':''}`;
                                    pdfCheckAndAddPage(lineH * 1.5);
                                    pdfAddWrappedText(txt, PDF_SETTINGS.MARGIN_LEFT + indent, 0, PDF_SETTINGS.CONTENT_WIDTH - indent, {
                                        ...opts,
                                        color: PDF_SETTINGS.COLORS.link,
                                        isLink: true,
                                        url: u
                                    });
                                }
                            });
                        } else {
                            pdfAddWrappedText("N/A", PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, opts);
                        }
                    } else if (sec.type === 'screenshots') {
                        if (uploadedScreenshotData.length) {
                            for (let i = 0; i < uploadedScreenshotData.length; i++) {
                                const shot = uploadedScreenshotData[i];
                                if (shot && shot.dataUrl) {
                                    pdfAddHeading(2, `Lampiran Gambar ${i+1}: ${escapeHtml(shot.name)}`);
                                    try {
                                        const props = pdfDoc_global.getImageProperties(shot.dataUrl);
                                        let w = PDF_SETTINGS.CONTENT_WIDTH * 0.9;
                                        let h = props.height * w / props.width;
                                        const maxH = PDF_SETTINGS.CONTENT_HEIGHT * 0.7;
                                        if (h > maxH) {
                                            h = maxH;
                                            w = props.width * h / props.height;
                                        }
                                        const x = PDF_SETTINGS.MARGIN_LEFT + (PDF_SETTINGS.CONTENT_WIDTH - w) / 2;
                                        pdfCheckAndAddPage(h + PDF_SETTINGS.FONT_SIZES.caption * 2.5);
                                        pdfDoc_global.addImage(shot.dataUrl, props.fileType || 'PNG', x, currentY_pdf, w, h);
                                        currentY_pdf += h + PDF_SETTINGS.FONT_SIZES.caption * 1.2;
                                    } catch (e) {
                                        console.error("Error adding image to PDF:", e);
                                        pdfAddWrappedText(`[Gagal memuat gambar: ${escapeHtml(shot.name)}]`, PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, {
                                            ...opts,
                                            color: PDF_SETTINGS.COLORS.primary
                                        });
                                    }
                                }
                            }
                        } else {
                            pdfAddWrappedText("Tidak ada tangkapan layar.", PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, opts);
                        }
                    } else {
                        const txt = data[sec.contentKey] || "N/A";
                        pdfAddWrappedText(txt, PDF_SETTINGS.MARGIN_LEFT, 0, PDF_SETTINGS.CONTENT_WIDTH, opts);
                    }
                    currentY_pdf += PDF_SETTINGS.FONT_SIZES.body * 0.7;
                }

                // Footer dengan total halaman
                if (typeof pdfDoc_global.putTotalPages === 'function') {
                    const alias = '{pdfDocTotalPages}';
                    const num = pdfDoc_global.internal.getNumberOfPages();
                    for (let i = 1; i <= num; i++) {
                        pdfDoc_global.setPage(i);
                        pdfDoc_global.setFont(PDF_SETTINGS.FONTS.default, 'normal');
                        pdfDoc_global.setFontSize(PDF_SETTINGS.FONT_SIZES.small);
                        pdfDoc_global.setTextColor(PDF_SETTINGS.COLORS.secondaryText);
                        const txt = `Halaman ${i} dari ${alias}`;
                        const w = pdfDoc_global.getStringUnitWidth(txt) * pdfDoc_global.getFontSize() / pdfDoc_global.internal.scaleFactor;
                        pdfDoc_global.text(txt, PDF_SETTINGS.A4_WIDTH - PDF_SETTINGS.MARGIN_RIGHT - w, PDF_SETTINGS.A4_HEIGHT - PDF_SETTINGS.MARGIN_BOTTOM / 2 + 15);
                    }
                    pdfDoc_global.putTotalPages(alias);
                }

                // Save file
                let filename = (data.reportTitle || 'Laporan_Kerentanan_ProMAX_v7')
                    .replace(/[^a-z0-9_.-]/gi, '_').substring(0, 70) + '.pdf';
                pdfDoc_global.save(filename);

            } catch (err) {
                console.error("Kesalahan saat membuat PDF:", err);
                alert("Terjadi kesalahan saat membuat PDF: " + err.message);
            } finally {
                loadingIndicator && (loadingIndicator.style.display = 'none');
                console.log("Pro MAX v7 PDF Generation Process Finished.");
            }
        });
    } else {
        console.error("Tombol Download PDF tidak ditemukan!");
    }
});