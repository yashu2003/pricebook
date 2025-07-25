// backend/config/tableConfig.js
const Decimal = require('decimal.js');

// Helper function using Decimal.js for precision
function calculateMMFloor(row) {
    const cost = new Decimal(row.cost_usd || 0);
    // Use .div() for precise division: cost / 0.85
    return cost.div(0.85); 
}

// Helper function using Decimal.js
function calculateListPrice(mhFloorUsd) {
    // Use .times() for precise multiplication: mhFloorUsd * 1.7
    return mhFloorUsd.times(1.7);
}

const DERIVED_COLUMN_CONFIG = {
    'international_outbound_rates': [
        {
            name: 'mh_floor_usd',
            formula: (row) => {
                const value = calculateMMFloor(row);
                return value.toDecimalPlaces(4).toFixed(4);
            }
        },
        {
            name: 'mh_floor_margin_percent',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const cost = new Decimal(row.cost_usd || 0);
                if (mhFloorUsd.isZero()) return null;
                const value = mhFloorUsd.minus(cost).div(mhFloorUsd).times(100);
                return `${value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)}%`;
            }
        },
        {
            name: 'small_volume_list_price_usd',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const listPrice = calculateListPrice(mhFloorUsd);
                return listPrice.toDecimalPlaces(4).toFixed(4);
            }
        },
        {
            name: 'small_volume_margin_percent',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const listPrice = calculateListPrice(mhFloorUsd);
                const cost = new Decimal(row.cost_usd || 0);
                if (listPrice.isZero()) return null;
                const value = listPrice.minus(cost).div(listPrice).times(100);
                return `${value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)}%`;
            }
        },
        {
            name: 'cda_floor_price_usd',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const listPrice = calculateListPrice(mhFloorUsd);
                const cdaPrice = listPrice.times(0.65);
                return cdaPrice.toDecimalPlaces(4).toFixed(4);
            }
        },
        // --- ADDED MISSING MARGIN CALCULATION ---
        {
            name: 'cda_floor_margin_percent',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const listPrice = calculateListPrice(mhFloorUsd);
                const cost = new Decimal(row.cost_usd || 0);
                const cdaPrice = listPrice.times(0.65);
                if (cdaPrice.isZero()) return null;
                const value = cdaPrice.minus(cost).div(cdaPrice).times(100);
                return `${value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)}%`;
            }
        },
        {
            name: 'cpaas_high_volumes_floor_usd',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const listPrice = calculateListPrice(mhFloorUsd);
                const cpaasPrice = listPrice.times(0.75);
                return cpaasPrice.toDecimalPlaces(4).toFixed(4);
            }
        },
        // --- ADDED MISSING MARGIN CALCULATION ---
        {
            name: 'cpaas_high_volumes_margin_percent',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const listPrice = calculateListPrice(mhFloorUsd);
                const cost = new Decimal(row.cost_usd || 0);
                const cpaasPrice = listPrice.times(0.75);
                if (cpaasPrice.isZero()) return null;
                const value = cpaasPrice.minus(cost).div(cpaasPrice).times(100);
                return `${value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)}%`;
            }
        },
        {
            name: 'service_provider_medium_volume_floor_usd',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const listPrice = calculateListPrice(mhFloorUsd);
                const spPrice = listPrice.times(0.85);
                return spPrice.toDecimalPlaces(4).toFixed(4);
            }
        },
        // --- ADDED MISSING MARGIN CALCULATION ---
        {
            name: 'service_provider_medium_volume_margin_percent',
            formula: (row) => {
                const mhFloorUsd = calculateMMFloor(row);
                const listPrice = calculateListPrice(mhFloorUsd);
                const cost = new Decimal(row.cost_usd || 0);
                const spPrice = listPrice.times(0.85);
                if (spPrice.isZero()) return null;
                const value = spPrice.minus(cost).div(spPrice).times(100);
                return `${value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)}%`;
            }
        }
    ]
};

function calculateDerivedColumns(tableName, rawData) {
    const derivedColsForTable = DERIVED_COLUMN_CONFIG[tableName] || [];
    if (derivedColsForTable.length === 0) return rawData;
    return rawData.map(row => {
        const newRow = { ...row };
        derivedColsForTable.forEach(derivedCol => {
            newRow[derivedCol.name] = derivedCol.formula(newRow);
        });
        return newRow;
    });
}

module.exports = { calculateDerivedColumns };