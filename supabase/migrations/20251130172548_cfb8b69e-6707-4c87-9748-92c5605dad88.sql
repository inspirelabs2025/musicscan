INSERT INTO app_secrets (secret_key, secret_value, description)
VALUES ('FACEBOOK_CATALOG_ID', '1890399958552474', 'Facebook Commerce Manager Catalog ID voor product sync')
ON CONFLICT (secret_key) DO UPDATE SET secret_value = EXCLUDED.secret_value, updated_at = now();