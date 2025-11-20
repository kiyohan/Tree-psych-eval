import jsPDF from 'jspdf';

/**
 * Generates and downloads a psychology report in a specific two-column format,
 * rendering the raw model interpretation directly under "Test Results".
 *
 * @param {object} caseData - The full case object.
 */
export const generatePdfReport = (caseData) => {
    // --- 1. Configuration & Setup ---
    const MARGIN = 50;
    const FONT_SIZES = { title: 18, header: 13, body: 11, small: 9 };
    const LINE_HEIGHT = 1.4;

    const doc = new jsPDF('p', 'pt', 'a4');
    const contentWidth = doc.internal.pageSize.getWidth() - MARGIN * 2;
    let cursorY = MARGIN;

    // --- Helper Functions for Clean Code ---
    const addPageIfNeeded = (spaceNeeded) => {
        if (cursorY + spaceNeeded > doc.internal.pageSize.getHeight() - MARGIN) {
            doc.addPage();
            cursorY = MARGIN;
            addFooter();
        }
    };

    const addFooter = () => {
        doc.setFontSize(FONT_SIZES.small);
        doc.setTextColor(108, 117, 125);
        const pageStr = `Page ${doc.internal.getCurrentPageInfo().pageNumber}`;
        doc.text(pageStr, doc.internal.pageSize.getWidth() - MARGIN, doc.internal.pageSize.getHeight() - 30);
    };

    // This function handles rendering text with **bold** markdown.
    const addFormattedText = (text, size, indent = 0) => {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        
        addPageIfNeeded(lines.length * size * LINE_HEIGHT);

        for (const line of lines) {
            let currentX = MARGIN + indent;
            const parts = line.split('**');

            parts.forEach((part, index) => {
                const isBold = index % 2 === 1;
                doc.setFont(undefined, isBold ? 'bold' : 'normal');
                doc.text(part, currentX, cursorY);
                currentX += doc.getTextWidth(part);
            });

            cursorY += size * LINE_HEIGHT;
        }
        doc.setFont(undefined, 'normal');
    };

    // This function renders the entire raw model output, preserving its structure.
    const renderRawInterpretation = (rawText) => {
        if (!rawText || typeof rawText !== 'string') {
            addFormattedText('No interpretation was generated for this case.', FONT_SIZES.body);
            return;
        }

        const textLines = rawText.split(/\r\n|\n|\r/);

        for (const line of textLines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('###')) {
                cursorY += FONT_SIZES.body * 0.5; // Space before heading
                const headingText = trimmedLine.replace(/###\s*/, '');
                addFormattedText(`**${headingText}**`, FONT_SIZES.body);

            } else if (trimmedLine.startsWith('*')) {
                const indent = 20;
                const bulletSymbol = '• ';
                const content = trimmedLine.substring(1).trim();
                const bulletContentWidth = contentWidth - indent - doc.getTextWidth(bulletSymbol);
                const wrappedLines = doc.splitTextToSize(content, bulletContentWidth);

                addPageIfNeeded(wrappedLines.length * FONT_SIZES.body * LINE_HEIGHT);
                
                doc.setFontSize(FONT_SIZES.body);
                doc.setFont(undefined, 'normal');
                // Use a temporary cursor variable to handle multi-line bullets properly
                let bulletCursorY = cursorY;
                doc.text(bulletSymbol, MARGIN + indent, bulletCursorY);

                // Pass the content to addFormattedText, which handles wrapping and cursor updates
                addFormattedText(content, FONT_SIZES.body, indent + doc.getTextWidth(bulletSymbol));

            } else if (trimmedLine.length > 0) {
                addFormattedText(trimmedLine, FONT_SIZES.body);
            }
        }
    };
    
    // Renders a simple, bold section title without a line.
    const addSectionTitle = (title) => {
        addPageIfNeeded(30);
        cursorY += 20; // Add space before the title
        doc.setFontSize(FONT_SIZES.header);
        doc.setFont(undefined, 'bold');
        doc.text(title, MARGIN, cursorY);
        cursorY += FONT_SIZES.header * LINE_HEIGHT;
    };

    // --- 2. Build the Document ---
    addFooter();

    // Main Title
    doc.setFontSize(FONT_SIZES.title);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0); // Set text to black
    doc.text('Psychology Assessment Report', doc.internal.pageSize.getWidth() / 2, cursorY, { align: 'center' });
    cursorY += 40;

    // Subject Details Section (Two-Column Layout)
    const childName = caseData.drawing?.childName || 'N/A';
    const childId = caseData.drawing?.childId || 'N/A';
    const childAge = caseData.drawing?.childAge || 'N/A';
    const childClass = caseData.drawing?.childClass || 'N/A'; // New field
    const rightColumnX = MARGIN + 320;

    doc.setFontSize(FONT_SIZES.body);
    doc.setFont(undefined, 'normal');
    
    // First row
    doc.text(`Child’s name: ${childName}`, MARGIN, cursorY);
    doc.text(`Age: ${childAge} years`, rightColumnX, cursorY);
    cursorY += FONT_SIZES.body * LINE_HEIGHT;
    
    // Second row
    doc.text(`Child ID/ UID: ${childId}`, MARGIN, cursorY);
    doc.text(`Class: ${childClass}`, rightColumnX, cursorY);
    cursorY += FONT_SIZES.body * LINE_HEIGHT;

    // Test Administered Section
    addSectionTitle('Test Administered');
    addFormattedText('TREE TEST', FONT_SIZES.body);

    // Test Results Section
    addSectionTitle('Test Results');
    const initialInterpretation = caseData.mlOutput?.psychIndicators?.[0]?.interpretation || 'No interpretation was generated for this case.';
    renderRawInterpretation(initialInterpretation);

    // --- 3. Save the PDF ---
    doc.save(`Psychology-Report-${childId}.pdf`);
};