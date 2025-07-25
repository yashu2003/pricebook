const DEPARTMENT_VIEWS = {
  // Rules for the "International Outbound Rates" product
  'international_outbound_rates': {
    'Default': [
    'id',
      'country',
      'call_type',
      
      'destid',
      'destination',
      'refer_legend'
      
       // Sales sees the final list price
    ]
  },
  'international_surcharge':{
    'Default' :[
      'id' ,
         'obc_region_country',
    'obc_region_destination',
    'origin_country_code',
    'origin_country_name',
    'dest_id',
    'region_type_co',
    'amount',
    'currency' ,
    'key_internal',
    'amount_usd'
    ]
  },

  // Add rules for other products as needed
  'pstn_replacement_fee': {
    
    'Default': [
        'country_name',
        'name'
    ]
  }
};

const DEPARTMENT_FLOOR_ACCESS = {
  'international_outbound_rates': {
    'HR': [
      'small_volume_list_price_usd' // Only sees final List Price
    ],
    'Sales': [
      'small_volume_list_price_usd',
      'service_provider_medium_volume_floor_usd'
    ],
    'Marketing': [
      'small_volume_list_price_usd',
      'service_provider_medium_volume_floor_usd',
      'cpaas_high_volumes_floor_usd'
    ],
    'Operations': [
      
      'cda_floor_price_usd',
      'cpaas_high_volumes_floor_usd',
      'service_provider_medium_volume_floor_usd',
      'small_volume_list_price_usd'
    ],
     // A default for any other department
    'Default': [
        'small_volume_list_price_usd'
    ]
  }
  // You can add rules for other products here later
};




module.exports = { DEPARTMENT_VIEWS ,   DEPARTMENT_FLOOR_ACCESS };