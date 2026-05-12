const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const PAGE_WIDTH = 816;
        const PAGE_HEIGHT = 1056;
        await page.setViewport({ width: PAGE_WIDTH, height: PAGE_HEIGHT });
        const filePath = 'file://' + path.resolve(__dirname, 'index.html');
        console.log('Loading:', filePath);
        await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.emulateMediaType('screen');
        await page.addStyleTag({
            content: `
                * { transition: none !important; animation: none !important; }
                .reveal { opacity: 1 !important; transform: none !important; }
                body { overflow: hidden; }
                section {
                    width: ${PAGE_WIDTH}px !important;
                    height: ${PAGE_HEIGHT}px !important;
                    min-height: ${PAGE_HEIGHT}px !important;
                    max-height: ${PAGE_HEIGHT}px !important;
                    overflow: hidden !important;
                    padding: 50px 8% !important;
                }
                h1 { font-size: 2.8rem !important; margin-bottom: 1.2rem !important; }
                h2 { font-size: 1.8rem !important; margin-bottom: 1.2rem !important; }
                .grid { gap: 0.8rem !important; }
                .card { padding: 1.2rem !important; }
                .card h3 { font-size: 0.85rem !important; margin-bottom: 0.4rem !important; }
                .card p { font-size: 0.75rem !important; line-height: 1.3 !important; }
                .value-bar { padding: 1rem 1.5rem !important; margin-bottom: 0.6rem !important; }
                .value-header { margin-bottom: 0 !important; padding-bottom: 0 !important; border-bottom: none !important; }
                .value-header h3 { font-size: 1.1rem !important; }
                .value-unit { font-size: 1.1rem !important; }
                .proposal-card { padding: 2rem !important; }
                .proposal-list { margin: 1rem 0 !important; }
                .proposal-list li { padding: 0.5rem 0 !important; font-size: 0.9rem !important; }
                .btn-cta { padding: 1rem 3rem !important; font-size: 1rem !important; }
                .section-tag { margin-bottom: 0.8rem !important; }
            `
        });
        await new Promise(r => setTimeout(r, 500));
        const sectionCount = await page.$$eval('section', secs => secs.length);
        console.log(`Found ${sectionCount} slides`);
        const screenshots = [];
        for (let i = 0; i < sectionCount; i++) {
            await page.evaluate((idx, h) => {
                window.scrollTo(0, idx * h);
            }, i, PAGE_HEIGHT);
            await new Promise(r => setTimeout(r, 200));
            const screenshotBuffer = await page.screenshot({
                type: 'png',
                clip: { x: 0, y: i * PAGE_HEIGHT, width: PAGE_WIDTH, height: PAGE_HEIGHT }
            });
            screenshots.push(screenshotBuffer);
            console.log(`  Captured slide ${i + 1}/${sectionCount}`);
        }
        const pdfPages = [];
        for (let i = 0; i < screenshots.length; i++) {
            const imgPage = await browser.newPage();
            await imgPage.setViewport({ width: PAGE_WIDTH, height: PAGE_HEIGHT });
            const base64 = screenshots[i].toString('base64');
            await imgPage.setContent(`
                <html>
                <head><style>
                    * { margin: 0; padding: 0; }
                    body { width: ${PAGE_WIDTH}px; height: ${PAGE_HEIGHT}px; overflow: hidden; background: #000; }
                    img { width: 100%; height: 100%; object-fit: cover; display: block; }
                </style></head>
                <body><img src="data:image/png;base64,${base64}" /></body>
                </html>
            `, { waitUntil: 'load' });
            const pdfBuffer = await imgPage.pdf({
                printBackground: true,
                width: `${PAGE_WIDTH}px`,
                height: `${PAGE_HEIGHT}px`,
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
                pageRanges: '1'
            });
            pdfPages.push(pdfBuffer);
            await imgPage.close();
        }
        const { PDFDocument } = require('pdf-lib');
        const mergedPdf = await PDFDocument.create();
        for (const pdfBytes of pdfPages) {
            const doc = await PDFDocument.load(pdfBytes);
            const [copiedPage] = await mergedPdf.copyPages(doc, [0]);
            mergedPdf.addPage(copiedPage);
        }
        const mergedBytes = await mergedPdf.save();
        const outputPath = path.resolve(__dirname, 'proposta_altas_horas_vertical.pdf');
        require('fs').writeFileSync(outputPath, mergedBytes);
        console.log(`\n✅ PDF FINAL gerado com sucesso: ${outputPath}`);
        await browser.close();
    } catch (e) {
        console.error('Erro:', e);
        process.exit(1);
    }
})();
