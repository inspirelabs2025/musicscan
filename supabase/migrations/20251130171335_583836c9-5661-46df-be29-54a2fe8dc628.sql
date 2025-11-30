INSERT INTO app_secrets (secret_key, secret_value, description)
VALUES ('INSTAGRAM_BUSINESS_ACCOUNT_ID', '17841455930152436', 'Instagram Business Account ID for API posting')
ON CONFLICT (secret_key) DO UPDATE SET secret_value = '17841455930152436';