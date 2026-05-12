const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const PAGE_WIDTH = 1920;
        const PAGE_HEIGHT = 1080;
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
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 0 10% !important;
                }
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
        const outputPath = path.resolve(__dirname, 'proposta_altas_horas_desktop.pdf');
        require('fs').writeFileSync(outputPath, mergedBytes);
        console.log(`\n✅ PDF DESKTOP gerado com sucesso: ${outputPath}`);
        await browser.close();
    } catch (e) {
        console.error('Erro:', e);
        process.exit(1);
    }
})();
