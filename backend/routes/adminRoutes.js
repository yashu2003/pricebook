// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db'); // DB connection
const ExcelJS = require('exceljs');

const { calculateDerivedColumns } = require('../config/tableConfig');
const { COLUMN_MAPPINGS, LEGEND_AND_ASSUMPTIONS,TEMPLATE_COLUMNS } = require('../config/excelConfig');


// Middleware: Auth check for admin
function isAdminAuthenticated(req, res, next) {
  if (req.session.admin && req.session.admin.id) {
    next(); // Authenticated
  } else {
    // IMPORTANT: If you want to redirect to login, handle it on the frontend based on this status
    res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }
}

// POST /api/admin-login: Admin login
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body; // Req body: email, password

  try {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]); // Fetch admin by email

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' }); // No admin found
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password); // Compare password

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' }); // Password mismatch
    }

    req.session.admin = { email: admin.email, id: admin.id }; // Store session

    return res.json({ success: true, message: 'Login successful' }); // Success
  } catch (err) {
    console.error(err); // Log error
    res.status(500).json({ success: false, message: 'Server error' }); // Server error
  }
});

// GET /api/check-session: Check auth session
router.get('/check-session', (req, res) => {
  res.json({ authenticated: !!(req.session.admin && req.session.admin.id)}); // Auth status
});

// GET /api/logout: Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => { // Destroy session
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out.' }); // Logout error
    }
    res.clearCookie('connect.sid'); // Clear cookie
    res.json({ success: true, message: 'Logged out successfully.' }); // Success
  });
});

// NEW ENDPOINT: GET all products from the 'products' table
// Protected by isAdminAuthenticated middleware
router.get('/products', isAdminAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT product_id, product_name FROM products ORDER BY product_id ASC'); // Get all products
        res.json({ success: true, data: result.rows }); // Return products
    } catch (err) {
        console.error('Error fetching products:', err); // Log error
        res.status(500).json({ success: false, message: 'Failed to fetch products.' }); // Server error
    }
});

// NEW DYNAMIC ENDPOINT: GET data for a specific product table
// Protected by isAdminAuthenticated middleware
// GET /api/product-data/:productId: Fetches and processes data for a specific product
router.get('/product-data/:productId', isAdminAuthenticated, async (req, res) => {
    const { productId } = req.params;

    // This map is now much safer because we also query the products table first
    const tableMap = {
        '1': 'pstn_replacement_fee',
        '2': 'pstn_replacement_outbound',
        '3': 'international_outbound_rates',
        '4':'international_surcharge'
    };
    const tableName = tableMap[productId];

    if (!tableName) {
        return res.status(404).json({ success: false, message: 'Product table not found for the given ID.' });
    }

    try {
        // Fetch raw data from the database
        const queryText = `SELECT * FROM ${tableName} ORDER BY 1 ASC`;
        const result = await db.query(queryText);
        
        //  Use the imported function to perform all server-side calculations
        const processedData = calculateDerivedColumns(tableName, result.rows);

        // Send the final, processed data to the frontend
        res.json({ success: true, data: processedData, tableName: tableName });

    } catch (err) {
        console.error(`Error processing data for ${tableName}:`, err);
        res.status(500).json({ success: false, message: `Failed to process data for product: ${tableName}.` });
    }
});



router.post('/import/:productId', isAdminAuthenticated, async (req, res) => {
    const { productId } = req.params;
    const rowsToUpsert = req.body.data; // Expecting an array of row objects

    if (!rowsToUpsert || !Array.isArray(rowsToUpsert) || rowsToUpsert.length === 0) {
        return res.status(400).json({ success: false, message: 'No data provided for import.' });
    }

    const tableMap = {
        '1': { name: 'pstn_replacement_fee', pkey: 'pstn_rf_id' },
        '2': { name: 'pstn_replacement_outbound', pkey: 'pstn_outbound_rate_id' },
        '3': { name: 'international_outbound_rates', pkey: 'id' },
         '4': { name: 'international_surcharge', pkey: 'id' }
    };

    const tableInfo = tableMap[productId];
    if (!tableInfo) {
        return res.status(404).json({ success: false, message: 'Invalid product for import.' });
    }

    const { name: tableName, pkey: primaryKey } = tableInfo;
    const client = await db.connect(); // Get a client from the pool for a transaction

    try {
        await client.query('BEGIN'); // Start transaction

        for (const row of rowsToUpsert) {
            const id = row[primaryKey];
            
            // Separate the primary key from the other columns
            const columns = Object.keys(row).filter(k => k !== primaryKey);
            const values = columns.map(k => row[k]);

            let query;
            if (id) { // If an ID is present, perform an UPSERT
                const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
                query = {
                    text: `
                        INSERT INTO ${tableName} (${primaryKey}, ${columns.join(', ')})
                        VALUES ($1, ${columns.map((_, i) => `$${i + 2}`).join(', ')})
                        ON CONFLICT (${primaryKey}) DO UPDATE
                        SET ${setClause};
                    `,
                    values: [id, ...values]
                };
            } else { // If no ID, perform an INSERT
                query = {
                    text: `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')});`,
                    values: values
                };
            }
            await client.query(query);
        }

        await client.query('COMMIT'); // Commit transaction
        res.json({ success: true, message: `Successfully imported ${rowsToUpsert.length} rows.` });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error(`Import error for table ${tableName}:`, err);
        res.status(500).json({ success: false, message: 'An error occurred during the import. No data was saved.' });
    } finally {
        client.release(); // Release client back to the pool
    }
});




// In backend/routes/adminRoutes.js

router.get('/export/:productId', isAdminAuthenticated, async (req, res) => {
    const { productId } = req.params;
    const tableMap = {
        '1': 'pstn_replacement_fee',
        '2': 'pstn_replacement_outbound',
        '3': 'international_outbound_rates',
        '4': 'international_surcharge'
    };
    const tableName = tableMap[productId];

    if (!tableName) {
        return res.status(404).send('Product not found');
    }

    try {
        // 1. Fetch and process data
        const result = await db.query(`SELECT * FROM ${tableName} ORDER BY 1 ASC`);
        const data = calculateDerivedColumns(tableName, result.rows);

        // 2. Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rates');

        // 3. Define styles
        const greenHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF008000' } };
        const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true };
        const boxBorder = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        const numericColumns = [
            'cost_usd', 'wholesale_cfp', 'mh_floor_usd', 'mh_floor_margin_percent',
            'cda_floor_price_usd', 'cda_floor_margin_percent', 'cpaas_high_volumes_floor_usd',
            'cpaas_high_volumes_margin_percent', 'service_provider_medium_volume_floor_usd',
            'service_provider_medium_volume_margin_percent', 'small_volume_list_price_usd',
            'small_volume_margin_percent'
        ];

        // 4. Add main data table with corrected alignment
        const columns = Object.keys(COLUMN_MAPPINGS[tableName]).map(key => {
            const columnDef = {
                header: COLUMN_MAPPINGS[tableName][key],
                key: key,
                width: 20
            };
            // If the column key is in our list, add the right-alignment style
            if (numericColumns.includes(key)) {
                columnDef.style = { alignment: { horizontal: 'right' } };
            }
            return columnDef;
        });
        worksheet.columns = columns;
        worksheet.addRows(data);

        // 5. Add Legend and Assumptions
        const legendConfig = LEGEND_AND_ASSUMPTIONS[tableName];
        if (legendConfig) {
            // --- FIX 2 & 3: Corrected styles for consistent alignment and to fix row height ---
            const titleStyle = {
                font: { bold: true, size: 12 },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
                alignment: { vertical: 'middle', horizontal: 'center' },
                border: boxBorder
            };
            const legendHeaderStyle = { font: headerFont, fill: greenHeaderFill, border: boxBorder };
            const borderedWrapText = { alignment: { wrapText: true, vertical: 'top' }, border: boxBorder };
            // This style now includes vertical alignment to fix the inconsistency
            const borderedText = { alignment: { vertical: 'top' }, border: boxBorder };


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
            legendHeaderRow.eachCell({ includeEmpty: true }, cell => { cell.style = legendHeaderStyle; });
            currentRow++;

            const maxRows = Math.max(legendConfig.legendAlpha.length, legendConfig.legendNum.length);
            for (let i = 0; i < maxRows; i++) {
                const dataRow = worksheet.getRow(currentRow);
                const alpha = legendConfig.legendAlpha[i] || {};
                const num = legendConfig.legendNum[i] || {};

                dataRow.getCell('A').value = alpha.code;
                dataRow.getCell('A').style = borderedText; // Uses corrected style

                dataRow.getCell('B').value = alpha.description;
                dataRow.getCell('B').style = borderedWrapText;

                dataRow.getCell('D').value = num.code;
                dataRow.getCell('D').style = borderedText; // Uses corrected style
                
                dataRow.getCell('E').value = num.description;
                dataRow.getCell('E').style = borderedWrapText;
                
                currentRow++;
            }
            currentRow++;

            // Assumptions Title
            worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
            worksheet.getCell(`A${currentRow}`).style = titleStyle;
            worksheet.getCell(`A${currentRow}`).value = 'Assumptions:';
            currentRow++;

            // Assumptions List
            legendConfig.assumptions.forEach(assumption => {
                worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
                const mergedCell = worksheet.getCell(`A${currentRow}`);
                mergedCell.value = assumption;
                mergedCell.style = borderedWrapText; // Applying wrap text is the correct way to trigger auto row-height.
                currentRow++;
            });
        }
        
        // 6. Set response headers and send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="PriceBook_${tableName}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error generating Excel file:', err);
        res.status(500).send('Could not generate the Excel file.');
    }
});



router.get('/template/:productId', isAdminAuthenticated, async (req, res) => {
    const { productId } = req.params;
    const tableMap = { '3': 'international_outbound_rates', '4':'international_surcharge' }; // Simplified for this example
    const tableName = tableMap[productId];

    if (!tableName) {
        return res.status(404).send('Product not found');
    }

    const templateFields = TEMPLATE_COLUMNS[tableName];
    if (!templateFields) {
        return res.status(404).send('Template configuration not found for this product.');
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Import Template');

        // Define header style
        const headerStyle = {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0056B3' } }, // Primary Blue
            font: { color: { argb: 'FFFFFFFF' }, bold: true },
            alignment: { horizontal: 'center' }
        };

        // Create columns with styled headers
        worksheet.columns = templateFields.map(fieldKey => {
            const headerText = COLUMN_MAPPINGS[tableName][fieldKey] || fieldKey;
            return {
                header: headerText,
                key: fieldKey,
                width: headerText.length > 20 ? headerText.length + 5 : 20
            };
        });
        
        // Apply style to each header cell
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = headerStyle.fill;
            cell.font = headerStyle.font;
            cell.alignment = headerStyle.alignment;
        });

        // Add a comment to the first cell to guide the user
        worksheet.getCell('A1').note = 'Please fill in the data for your rates in the rows below. Do not change the header names.';


        // Set response headers to trigger download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Import_Template_${tableName}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error generating Excel template:', err);
        res.status(500).send('Could not generate the template file.');
    }
});

const getTableInfo = (productId) => {
    const tableMap = {
        '1': { name: 'pstn_replacement_fee', pkey: 'pstn_rf_id' },
        '2': { name: 'pstn_replacement_outbound', pkey: 'pstn_outbound_rate_id' },
        '3': { name: 'international_outbound_rates', pkey: 'id' },
        '4': {name : 'international_surcharge', pkey:'id'}
    };
    return tableMap[productId];
};


router.delete('/rate/:productId/:rateId', isAdminAuthenticated, async (req, res) => {
    const { productId, rateId } = req.params;

    const tableInfo = getTableInfo(productId);
    if (!tableInfo) {
        return res.status(404).json({ success: false, message: 'Invalid product for deletion.' });
    }

    const { name: tableName, pkey: primaryKey } = tableInfo;

    try {
        const query = {
            text: `DELETE FROM ${tableName} WHERE "${primaryKey}" = $1`,
            values: [rateId]
        };

        const result = await db.query(query);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Rate not found or already deleted.' });
        }

        res.json({ success: true, message: 'Rate deleted successfully.' });

    } catch (err) {
        console.error(`Error deleting rate from ${tableName}:`, err);
        res.status(500).json({ success: false, message: 'Failed to delete the rate.' });
    }
});






module.exports = router;