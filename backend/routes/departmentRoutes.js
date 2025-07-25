const express = require('express');
const router = express.Router();
const db = require('../db');
const { DEPARTMENT_VIEWS, DEPARTMENT_FLOOR_ACCESS } = require('../config/departmentConfig'); // Note the change here
const { COLUMN_MAPPINGS } = require('../config/excelConfig');
const { calculateDerivedColumns } = require('../config/tableConfig');
const ExcelJS = require('exceljs');
const { LEGEND_AND_ASSUMPTIONS } = require('../config/excelConfig');


// Middleware to check if a department user is authenticated
function isDepartmentAuthenticated(req, res, next) {
  if (req.session.isDepartment && req.session.department) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Unauthorized.' });
}

// All routes in this file are protected by the middleware
router.use(isDepartmentAuthenticated);

// Get the list of products for the dropdown
router.get('/products', async (req, res) => {
    try {
        const result = await db.query('SELECT product_id, product_name FROM products ORDER BY product_id ASC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch products.' });
    }
});

// The main, secure data endpoint
// The main, secure data endpoint
// The main, secure data endpoint
router.get('/product-data/:productId', async (req, res) => {
    const { productId } = req.params;
    const department = req.session.department;

    // FIX 1: The tableMap is now complete.
    const tableMap = {
        '1': 'pstn_replacement_fee',
        '2': 'pstn_replacement_outbound',
        '3': 'international_outbound_rates',
        '4': 'international_surcharge'
    };
    const tableName = tableMap[productId];
    if (!tableName) return res.status(404).json({ success: false, message: 'Product not found.' });

    try {
        // --- 1. Fetch all data concurrently ---
        const productDataPromise = db.query(`SELECT * FROM ${tableName} ORDER BY 1 ASC`);
        const fxRatesPromise = db.query('SELECT * FROM fx_rates ORDER BY currency_code ASC');
        const [productResult, fxRatesResult] = await Promise.all([productDataPromise, fxRatesPromise]);

        // --- 2. Process product data with derived columns ---
        const fullData = calculateDerivedColumns(tableName, productResult.rows);

        // --- 3. Get all necessary rules and configurations safely ---
        const productColumnRules = DEPARTMENT_VIEWS[tableName] || {};
        const allowedDbColumns = productColumnRules[department] || productColumnRules['Default'] || [];

        const productFloorRules = DEPARTMENT_FLOOR_ACCESS[tableName] || {};
        const allowedFloors = productFloorRules[department] || productFloorRules['Default'] || [];

        const safeColumns = allowedDbColumns.filter(col => COLUMN_MAPPINGS[tableName] && COLUMN_MAPPINGS[tableName][col]);

        // --- 4. Prepare the data bundles for the frontend ---
        
        // Prepare headers ONLY for the visible table columns
        const tableColumnsForFrontend = {};
        safeColumns.forEach(key => {
            tableColumnsForFrontend[key] = COLUMN_MAPPINGS[tableName][key];
        });

        // FIX 2 & 3: This logic is now robust and will not crash
        // It safely prepares the friendly names for all possible floor prices for this product.
        const floorPriceNames = {};
        const allFloorPriceKeysForProduct = Object.values(productFloorRules).flat();
        [...new Set(allFloorPriceKeysForProduct)].forEach(key => {
            if (COLUMN_MAPPINGS[tableName] && COLUMN_MAPPINGS[tableName][key]) {
                floorPriceNames[key] = COLUMN_MAPPINGS[tableName][key];
            }
        });

        const hasDynamicRates = !!DEPARTMENT_FLOOR_ACCESS[tableName];

        // --- 5. Assemble and send the final data bundle ---
        res.json({
            success: true,
            bundle: {
                data: fullData,
                tableColumns: tableColumnsForFrontend,
                floorPriceNames: floorPriceNames,
                fxRates: fxRatesResult.rows,
                allowedFloors: allowedFloors,
                hasDynamicRates: hasDynamicRates
            }
        });

    } catch (err) {
        console.error(`Department data fetch error for ${tableName}:`, err);
        res.status(500).json({ success: false, message: 'Failed to process data.' });
    }
});

router.get('/export/:productId', async (req, res) => {
    const { productId } = req.params;
    const department = req.session.department;

    const tableMap = { '3': 'international_outbound_rates',
    '4': 'international_surcharge' };
    const tableName = tableMap[productId];
    if (!tableName) return res.status(404).send('Product not found');

    try {
        // --- This block is the same as your data-fetching route ---
       const rawResult = await db.query(`SELECT * FROM ${tableName} ORDER BY 1 ASC`);
        const fullData = calculateDerivedColumns(tableName, rawResult.rows);
        const productRules = DEPARTMENT_VIEWS[tableName];
        const allowedColumns = productRules ? (productRules[department] || productRules['Default'] || []) : [];
        const filteredData = fullData.map(row => {
            const newRow = {};
            allowedColumns.forEach(col => { newRow[col] = row[col]; });
            return newRow;
        });
        // --- End of data fetching/filtering ---

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rates');

        // Main data table
        worksheet.columns = allowedColumns.map(key => ({
            header: COLUMN_MAPPINGS[tableName][key],
            key: key,
            width: 25, // Increased default width
            style: { font: { name: 'Inter' } }
        }));
        worksheet.addRows(filteredData);
        
        // --- Full Styling for Legend and Assumptions ---
        const legendConfig = LEGEND_AND_ASSUMPTIONS[tableName];
        if (legendConfig) {
            // Define all styles needed for this section
            const boxBorder = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            const titleStyle = {
                font: { bold: true, size: 12, name: 'Inter' },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
                alignment: { vertical: 'middle', horizontal: 'center' },
                border: boxBorder
            };
            const headerStyle = {
                font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Inter' },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF008000' } },
                border: boxBorder
            };
            const borderedWrapText = { alignment: { wrapText: true, vertical: 'top' }, border: boxBorder };
            const borderedText = { alignment: { vertical: 'top' }, border: boxBorder };

            // Set specific column widths for the bottom section
            worksheet.getColumn('B').width = 50;
            worksheet.getColumn('E').width = 70;

            let currentRow = worksheet.lastRow.number + 3;

            // Legend Title
            worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
            worksheet.getCell(`A${currentRow}`).style = titleStyle;
            worksheet.getCell(`A${currentRow}`).value = 'Legend (*)';
            currentRow += 2;

            // Legend Table
            const legendHeaderRow = worksheet.getRow(currentRow);
            legendHeaderRow.getCell('A').value = 'Code (Alpha)';
            legendHeaderRow.getCell('B').value = 'Alpha Code Description';
            legendHeaderRow.getCell('D').value = 'Code (Num)';
            legendHeaderRow.getCell('E').value = 'Num Code Description';
            legendHeaderRow.eachCell({ includeEmpty: true }, cell => { cell.style = headerStyle; });
            currentRow++;

            const maxRows = Math.max(legendConfig.legendAlpha.length, legendConfig.legendNum.length);
            for (let i = 0; i < maxRows; i++) {
                const dataRow = worksheet.getRow(currentRow);
                const alpha = legendConfig.legendAlpha[i] || {};
                const num = legendConfig.legendNum[i] || {};
                dataRow.getCell('A').value = alpha.code;
                dataRow.getCell('A').style = borderedText;
                dataRow.getCell('B').value = alpha.description;
                dataRow.getCell('B').style = borderedWrapText;
                dataRow.getCell('D').value = num.code;
                dataRow.getCell('D').style = borderedText;
                dataRow.getCell('E').value = num.description;
                dataRow.getCell('E').style = borderedWrapText;
                currentRow++;
            }
            currentRow += 2;

            // Assumptions Title
            worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
            worksheet.getCell(`A${currentRow}`).style = titleStyle;
            worksheet.getCell(`A${currentRow}`).value = 'Assumptions:';
            currentRow++;

            // Assumptions List
            legendConfig.assumptions.forEach(assumption => {
                worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
                worksheet.getCell(`A${currentRow}`).value = assumption;
                worksheet.getCell(`A${currentRow}`).style = borderedWrapText;
                currentRow++;
            });
        }

        // Send the file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Department_Rates_${tableName}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Department export error:', err);
        res.status(500).send('Could not generate export file.');
    }
});




router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

module.exports = router;