// public/js/dashboardConfig.js

// Helper function to replicate Excel's ROUNDUP functionality
function roundUp(num, decimalPlaces) {
    if (num === null || isNaN(num)) return null;
    const factor = Math.pow(10, decimalPlaces);
    return Math.ceil(num * factor) / factor;
}

// Configuration for derived columns with corrected formulas and rounding
const DERIVED_COLUMN_CONFIG = {
    'pstn_replacement_outbound': [{
        name: 'net_outbound_rate',
        displayName: 'Net Outbound Rate',
        formula: (row) => {
            const listPrice = parseFloat(row.list_price_usd);
            const discountPercent = parseFloat(row.discount_to_apply_percent);
            if (!isNaN(listPrice) && !isNaN(discountPercent)) {
                const finalValue = listPrice * (1 - discountPercent / 100);
                return roundUp(finalValue, 2); // Apply ROUNDUP
            }
            return null;
        },
        format: (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '')
    }],
    'pstn_replacement_fee': [{
        name: 'inbound_rate_per_min',
        displayName: 'Inbound Rate Per Min',
        formula: (row) => {
            const inboundCpm = parseFloat(row.inbound_cpm_usage);
            const discount = parseFloat(row.discount_to_apply_percent);
            const fxRate = parseFloat(row.fx_rate);
            if (!isNaN(inboundCpm) && !isNaN(discount) && !isNaN(fxRate)) {
                const discountedValue = inboundCpm * (1 - (discount / 100));
                const finalValue = discountedValue * fxRate;
                return roundUp(finalValue, 2); // Apply ROUNDUP
            }
            return null;
        },
        format: (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '')
    }, {
        name: 'per_new_ported_ln_did_nrc',
        displayName: 'Per New/Ported LN/DID NRC',
        formula: (row) => {
            const nrc = parseFloat(row.new_ported_ln_did_nrc);
            const discount = parseFloat(row.discount_to_apply_percent);
            const fxRate = parseFloat(row.fx_rate);
            if (!isNaN(nrc) && !isNaN(discount) && !isNaN(fxRate)) {
                const discountedValue = nrc * (1 - (discount / 100));
                const finalValue = discountedValue * fxRate;
                return roundUp(finalValue, 2); // Apply ROUNDUP
            }
            return null;
        },
        format: (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '')
    }, {
        name: 'per_new_ported_ln_did_mrc',
        displayName: 'Per New/Ported LN/DID MRC',
        formula: (row) => {
            const mrc = parseFloat(row.new_ported_ln_did_mrc);
            const discount = parseFloat(row.discount_to_apply_percent);
            const fxRate = parseFloat(row.fx_rate);
            if (!isNaN(mrc) && !isNaN(discount) && !isNaN(fxRate)) {
                const discountedValue = mrc * (1 - (discount / 100));
                const finalValue = discountedValue * fxRate;
                return roundUp(finalValue, 2); // Apply ROUNDUP
            }
            return null;
        },
        format: (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '')
    }, {
        name: 'per_channel_charges_mrc',
        displayName: 'Per Channel Charges MRC',
        formula: (row) => {
            const charges = parseFloat(row.per_channel_charges);
            const discount = parseFloat(row.discount_to_apply_percent);
            const fxRate = parseFloat(row.fx_rate);
            if (!isNaN(charges) && !isNaN(discount) && !isNaN(fxRate)) {
                const discountedValue = charges * (1 - (discount / 100));
                const finalValue = discountedValue * fxRate;
                return roundUp(finalValue, 2); // Apply ROUNDUP
            }
            return null;
        },
        format: (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '')
    }, {
        name: 'setup_fee_in_usd_NRC',
        displayName: 'Order Setup NRC (USD)',
        formula: (row) => {
            const setupFee = parseFloat(row.order_set_up_per_country_nrc);
            const fxRate = parseFloat(row.fx_rate);
            if (!isNaN(setupFee) && !isNaN(fxRate)) {
                const finalValue = setupFee * fxRate;
                return roundUp(finalValue, 2); // Apply ROUNDUP
            }
            return null;
        },
        format: (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '')
    }, {
        name: 'setup_fee_in_usd_MRC',
        displayName: 'Order Setup MRC (USD)',
        formula: (row) => {
            const setupFee = parseFloat(row.order_set_up_per_country_mrc);
            const fxRate = parseFloat(row.fx_rate);
            if (!isNaN(setupFee) && !isNaN(fxRate)) {
                const finalValue = setupFee * fxRate;
                return roundUp(finalValue, 2); // Apply ROUNDUP
            }
            return null;
        },
        format: (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '')
    }],
    'international_outbound_rates': [{
        name: 'rate_per_minute',
        displayName: 'Rate/Min',
        formula: (row) => {
            const listPrice = parseFloat(row.list_price);
            const discount = parseFloat(row.discount_percent);
            if (!isNaN(listPrice) && !isNaN(discount)) {
                const finalValue = listPrice * (1 - (discount / 100));
                // Using 4 decimal places as per your last request for this table
                return roundUp(finalValue, 4); // Apply ROUNDUP
            }
            return null;
        },
        format: (value) => (typeof value === 'number' ? `$${value.toFixed(4)}` : '')
    }]
};

// Base column mappings (This remains the same)
const BASE_COLUMN_MAPPINGS = {
    'pstn_replacement_outbound': {
        'pstn_outbound_rate_id': 'ID', 'product_id': 'Product ID', 'country_name': 'Country Name', 'fixed_mobile_special': 'Fixed/Mobile/Special', 'currency': 'Currency', 'destid': 'Dest ID', 'destination_name': 'Destination Name', 'supplier_secs': 'Supplier SECS', 'fx_rate': 'FX Rate', 'discount_to_apply_percent': 'Discount (%)', 'list_price_usd': 'List Price USD', 'comments': 'Comments', 'internal_comments': 'Internal Comments'
    },
    'pstn_replacement_fee': {
        'pstn_rf_id': 'PSTN RF ID', 'product_id': 'Product ID', 'country_name': 'Country Name', 'country_code': 'Country Code', 'currency': 'Currency', 'supplier_secs': 'Supplier SECS', 'name': 'Name', 'fx_rate': 'FX Rate', 'discount_to_apply_percent': 'Discount (%)', 'inbound_cpm_usage': 'Inbound CPM Usage', 'new_ported_ln_did_nrc': 'New Ported In DID NRC', 'new_ported_ln_did_mrc': 'New Ported In DID MRC', 'per_channel_charges': 'Per Channel Charges', 'order_set_up_per_country_nrc': 'Order Setup Per Country NRC', 'order_set_up_per_country_mrc': 'Order Setup Per Country MRC', 'sites': 'Sites', 'dids': 'DIDs', 'channels': 'Channels', 'comments': 'Comments'
    },
    'international_outbound_rates': {
        'id': 'ID', 'country': 'Country', 'call_type': 'Type', 'currency': 'Currency', 'dest': 'Destination ID', 'destination_name': 'Destination Name', 'status': 'Status', 'list_price': 'List Price', 'discount_percent': 'Discount %', 'list_surcharge': 'List Surcharge', 'comments': 'Comments'
    }
};

// Dynamically build COLUMN_MAPPINGS (This remains the same)
const COLUMN_MAPPINGS = {};
for (const tableName in BASE_COLUMN_MAPPINGS) {
    COLUMN_MAPPINGS[tableName] = { ...BASE_COLUMN_MAPPINGS[tableName] };
    if (DERIVED_COLUMN_CONFIG[tableName]) {
        DERIVED_COLUMN_CONFIG[tableName].forEach(derivedCol => {
            COLUMN_MAPPINGS[tableName][derivedCol.name] = derivedCol.displayName;
        });
    }
}
