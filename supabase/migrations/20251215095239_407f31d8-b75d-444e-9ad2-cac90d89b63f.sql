-- Update all product descriptions from English AI-generated to Dutch
UPDATE platform_products 
SET description = REGEXP_REPLACE(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  description,
                  'Transform your space with this stunning', 
                  'Verrijk je interieur met deze prachtige'
                ),
                'is a unique AI-generated poster that combines modern digital art techniques with classic artistic styles',
                'is een unieke poster die moderne digitale kunsttechnieken combineert met klassieke artistieke stijlen'
              ),
              'Features:',
              'Kenmerken:'
            ),
            'High-quality print ready',
            'Hoogwaardige printklare kwaliteit'
          ),
          'Unique (.*?) style',
          'Unieke \1 stijl'
        ),
        'Perfect for home decor or collectors',
        'Perfect voor interieur of verzamelaars'
      ),
      'Museum-quality poster',
      'Museum-kwaliteit poster'
    ),
    'Style:',
    'Stijl:'
  ),
  'Subject:',
  'Artiest:'
)
WHERE description LIKE '%AI-generated%' 
   OR description LIKE '%Transform your space%'
   OR description LIKE '%Features:%';