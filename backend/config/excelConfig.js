
const COLUMN_MAPPINGS = {
    'international_outbound_rates': {
        'id': 'ID',
        'country': 'Country',
        'currency':'CURRENCY',
        'call_type': 'Type',
        'destid': 'DEST ID',
        'destination': 'Destination',
         'obc_applicable':'OBC Applicable',
        'cost_usd': 'Cost (USD)',
        'wholesale_cfp': 'Wholesale CFP',
        'mh_floor_usd': 'MM Floor USD',
        'mh_floor_margin_percent': 'MM Floor Margin %',
        'cda_floor_price_usd': 'CDA Floor USD',
        'cda_floor_margin_percent': 'CDA Margin %',
        'cpaas_high_volumes_floor_usd': 'CpaaS High Vol USD',
        'cpaas_high_volumes_margin_percent': 'CpaaS High Vol Margin %',
        'service_provider_medium_volume_floor_usd': 'SP/Med Vol USD',
        'service_provider_medium_volume_margin_percent': 'SP/Med Vol Margin %',
        'small_volume_list_price_usd': 'Small Vol List Price USD',
        'small_volume_margin_percent': 'Small Vol Margin %',
        'refer_legend': 'Refer Legend',
       
        'sl_internal': 'SL (Internal)',
        'comments_internal': 'Comments (Internal)'
    },
    'international_surcharge':{
        'id': 'ID',
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
    // Add other product mappings here if needed
};

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
'1 : The currency for this quotation is indicated above',
'2 : The charges quoted:',
'  a) are valid for 120 days from the date of this proposal;',
'  b) are confidential;',
'  c) invalidate any previously-quoted charges for similar services;',
'  d) are valid for this proposal only;',
'  e) show per minute rates; calls are invoiced based on billing increments agreed in contract',
'3 : International outbound traffic terminated to certain destination are subject to OBC surcharge based on where the call originated. Refer "International Surcharge" for more details.',
'4 : Surcharge rates are in the local currency of the destinations and charged on per minute basis in addition to base termination rate. ',
'      Basis the quote currency agreed as part of the contract, currency conversion would take place using exchange rate during order delivery to bill the surcharge amount.',
'5 : Domestic traffic (PSTN replacement) generated through DID not provided by Tata will be treated International traffic and will be subject to OBC surcharge. International surcharge will be applied to such traffic termination.',
'6 : Low ACD traffic is supported on best effort basis. Supplier may, at its election, either reclassify the Service as a call center service and apply the rates applicable to such service, increase the rates to pass through any increased rates, penalties, or fees applied to such traffic by the terminating carrier or suspend the service.',
'7 : In-country Calling Line Identification (CLI) on international call termination is supported on a best-effort basis and cannot be guaranteed. ',
'      The supplier reserves the right to block such traffic if necessary.',
'8 : Permanently Blocked Destinations are destinations proactively blocked by Supplier as a security feature due to their susceptibility to hacking or fraud. ',
'      Individual destinations can be opened by Supplier at special request.',
'9 : Charges are exclusive of service tax or any other local levies, which shall be charged as per the regulations of the country of invoice origin.',
'10 : Supplier reserves the right to adjust the quoted charges of Products & Services, by giving notice to Customer at any time before acceptance of the Order, to reflect any variations in foreign exchange currency rates and market shifts that have occurred between the date of quotation and the date of Order.',
'11 : The terms and conditions mentioned above are indicative only; for more details refer to Supplier\'s General Terms & Conditions and applicable Service Schedule(s) documents.',
'12 : Changes to the design associated with this pricing may result in amended charges.',
'13 : Capacity is subject to availability.',
'14 : Dialing Codes are available upon request. Codes and destination names can change during the term of the agreement.'
        ]
    }
};


const TEMPLATE_COLUMNS = {
    'international_outbound_rates': [
        'ID',
        'Country',
        'Type',
        'DEST ID',
        'Destination',
        'OBC Applicable',
        'Cost (USD)',
        'Wholesale CFP',
        'Refer Legend',
        'SL (Internal)',
        'Comments (Internal)'
    ],
    'international_surcharge':[
         'ID',
         'OBC Region Country',
    'OBC Region Destination',
    'Origin Country Code',
     'Origin Country Name',
     'Dest ID',
     'Region Type - CO',
     'Surcharge Amount',
    'Currency',
    'KEY (Internal)',
    'Amount (USD)'
    ]
    // You can define template columns for other products here
    // 'pstn_replacement_fee': ['field1', 'field2', ...],
};


module.exports = {
    COLUMN_MAPPINGS,
    LEGEND_AND_ASSUMPTIONS,
    TEMPLATE_COLUMNS
};