const COLUMN_MAPPINGS = {
    'pstn_replacement_outbound': {
        'pstn_outbound_rate_id': 'ID',
        'product_id': 'PRODUCT ID',
        'country_name': 'Country Name',
        'fixed_mobile_special': 'Type',
        'currency' : 'CURRENCY',
        'destid':'DESTID',
        'destination_name' :'DESTINATION',
        'supplier_secs':' SUPPLIER SECS',
        'fx_rate': 'FX RATE',
        'discount_to_apply_percent': 'Discount (%)',
        'list_price_usd': 'List Price USD',
        'comments' :'COMMENTS',
        'internal_comments':'Internal Comments',
        'net_outbound_rate': 'Net Outbound Rate' // Derived column
    },
    'pstn_replacement_fee': {
        'pstn_rf_id': 'PSTN RF ID',
        'country_name': 'Country Name',
        'country_code': 'Country Code',
        'currency': 'Currency',
        'name': 'Name',
        'fx_rate': 'FX Rate',
        'discount_to_apply_percent': 'Discount (%)',
        'inbound_cpm_usage': 'Inbound CPM Usage',
        'new_ported_ln_did_nrc': 'New Ported In DID NRC',
        'new_ported_ln_did_mrc': 'New Ported In DID MRC',
        'per_channel_charges': 'Per Channel Charges',
        'order_set_up_per_country_nrc': 'Order Setup Per Country NRC',
        'order_set_up_per_country_mrc': 'Order Setup Per Country MRC',
        'comments': 'Comments',
        // Derived Columns for this table
        'inbound_rate_per_min': 'Inbound Rate/Min',
        'per_new_ported_ln_did_nrc': 'Per New/Ported LN/DID NRC (Derived)',
        'per_new_ported_ln_did_mrc': 'Per New/Ported LN/DID MRC (Derived)',
        'per_channel_charges_mrc': 'Per Channel Charges MRC (Derived)',
        'setup_fee_in_usd_NRC': 'Order Setup NRC (USD)',
        'setup_fee_in_usd_MRC': 'Order Setup MRC (USD)'
    },
    'international_outbound_rates': {
        'id': 'ID',
        'country': 'Country',
        'call_type': 'Type',
        'destid' :'DEST ID',
        'destination': 'Destination',
        'obc_applicable':'OBC Applicable',
        'cost_usd': 'Cost (USD)',
        'wholesale_cfp': 'Wholesale CFP',
        'mh_floor_usd': 'MM Floor USD', // Derived
        'mh_floor_margin_percent': 'MM Floor Margin %', // Derived
        
        'cda_floor_price_usd': 'CDA Floor USD',
        'cda_floor_margin_percent': 'CDA Margin %',
         
        
        'cpaas_high_volumes_floor_usd': 'CpaaS High Vol USD', // Derived
        'cpaas_high_volumes_margin_percent': 'CpaaS High Vol Margin %', // Derived

        
        'service_provider_medium_volume_floor_usd': 'SP/Med Vol USD', // Derived
        'service_provider_medium_volume_margin_percent': 'SP/Med Vol Margin %', // Derived

        
        'small_volume_list_price_usd': 'Small Vol List Price USD', // Derived
        'small_volume_margin_percent': 'Small Vol Margin %',
         // Derived
         'small_volume_list_price_usd': 'Small Vol List Price USD', // Derived
        'small_volume_margin_percent': 'Small Vol Margin %', // Derived
        'refer_legend': 'Refer Legend',
        
        'sl_internal': 'SL (Internal)',
        'comments_internal': 'Comments (Internal)'
    },
    'international_surcharge':{
        'id' : 'ID',
         'obc_region_country':'OBC Region Country',
    'obc_region_destination':'OBC Region Destination',
    'origin_country_code': 'Origin Country Code',
    'origin_country_name': 'Origin Country Name',
    'dest_id': 'Dest ID',
    'region_type_co': 'Region Type - CO',
    'amount': 'Surcharge Amount',
    'currency' :'Currency',
    'key_internal':'KEY (Internal)',
    'amount_usd':'Amount (USD)'
    }
};


const FLOOR_CONFIG = {
    'international_outbound_rates': {
        // Display Name: [db_column_for_price, db_column_for_margin]
        'MM Floor': ['mh_floor_usd', 'mh_floor_margin_percent'],
        'CDA Floor': ['cda_floor_price_usd', 'cda_floor_margin_percent'],
        'CpaaS High Volumes': ['cpaas_high_volumes_floor_usd', 'cpaas_high_volumes_margin_percent'],
        'Service Provider Medium Volume': ['service_provider_medium_volume_floor_usd', 'service_provider_medium_volume_margin_percent'],
        'Small Volume': ['small_volume_list_price_usd', 'small_volume_margin_percent'],
    }
};


 
const DERIVED_INFO = {
    'international_outbound_rates': {
        'mh_floor_usd': { formula: "Cost / (1 - 0.15)" },
        'mh_floor_margin_percent': { formula: "((MM Floor - Cost) / MM Floor) * 100" },
        'cda_floor_price_usd': { formula: "(List Price) * 0.65" },
        'cda_floor_margin_percent': { formula: "((CDA Floor - Cost) / CDA Floor) * 100" },
        'cpaas_high_volumes_floor_usd': { formula: "(List Price) * 0.75" },
        'cpaas_high_volumes_margin_percent': { formula: "((CpaaS Floor - Cost) / CpaaS Floor) * 100" },
        'service_provider_medium_volume_floor_usd': { formula: "(List Price) * 0.85" },
        'service_provider_medium_volume_margin_percent': { formula: "((SP Floor - Cost) / SP Floor) * 100" },
        'small_volume_list_price_usd': { formula: "(MM Floor) * 1.7" },
        'small_volume_margin_percent': { formula: "((List Price - Cost) / List Price) * 100" }
    },
    'pstn_replacement_fee': {
        'inbound_rate_per_min': { formula: "Calculation specific to this product" },
        'per_new_ported_ln_did_nrc': { formula: "Calculation specific to this product" },
        'per_new_ported_ln_did_mrc': { formula: "Calculation specific to this product" },
        'per_channel_charges_mrc': { formula: "Calculation specific to this product" },
        'setup_fee_in_usd_NRC': { formula: "Calculation specific to this product" },
        'setup_fee_in_usd_MRC': { formula: "Calculation specific to this product" }
    },
    'pstn_replacement_outbound': {
        'net_outbound_rate': { formula: "Calculation specific to this product" }
    }
};


/**
 * NEW: Configuration for the Legend and Assumptions sheet in the Excel export.
 */
const LEGEND_AND_ASSUMPTIONS = {
    
    'international_outbound_rates': {
        legendAlpha: [
            { code: 'A', description: 'Standard destinations open for calling' },
            { code: 'B', description: 'Permanently Blocked Destination. May be unblocked upon request.' },
            { code: 'C', description: 'Calls originating from Algeria, Tunisia, Morocco or Satellite Phone networks such as Inmarsat will incur a $1.00 per minute surcharge.' },
            { code: 'S', description: 'International surcharge may apply. Refer to International Surcharge tab to see surcharge scenarios.' },
            { code: 'B|S', description: 'Permanently Blocked Destinations. May be unblocked upon request.' }
        ],
        legendNum: [
            { code: '1', description: '60/60 Billing Increment (Sixty (60) second minimum and Sixty (60) second increments).' },
            { code: '2', description: '60/6 Billing Increment (Sixty (60) second minimum and Six (6) second increments).' },
            { code: '3', description: '60/1 Billing Increment (Sixty (60) second minimum and One (1) second increments).' },
            { code: '4', description: '30/6 Billing Increments (Thirty (30) second minimum and Six (6) second increments).' },
            { code: '5', description: '6/6 Billing Increments (Six (6) second minimum and Six (6) second increments).' }
        ],
        assumptions: [
            'The currency for this quotation is indicated above',
            'The charges quoted:',
            'a) are valid for 120 days from the date of this proposal;',
            'b) are confidential;',
            'c) invalidate any previously-quoted charges for similar services;',
            'd) are valid for this proposal only;',
            'e) show per minute rates; calls are invoiced based on billing increments agreed in contract',
            'International outbound traffic terminated to certain destination are subject to ORC surcharge based on where the call originated. Refer "International Surcharge" for more details.',
            'Surcharge rates are in the local currency of the destinations and charged on per minute basis in addition to base termination rate. Basis the quote currency agreed as part of the contract, currency conversion would take place using exchange rate during order delivery to bill the surcharge amount.'
        ]
    }
    
};

