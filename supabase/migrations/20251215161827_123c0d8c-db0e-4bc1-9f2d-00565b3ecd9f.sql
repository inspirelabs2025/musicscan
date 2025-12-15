-- Eerst sokken verwijderen (foreign key constraint)
DELETE FROM album_socks WHERE pattern_type = 'christmas';

-- Dan producten verwijderen
DELETE FROM platform_products WHERE id IN (
  'cf96dff5-eef7-47c0-a55c-b301a6366ebf',
  'd2cd6bf2-61d0-4b9e-a8d1-ad7fd85adde3',
  'be37f488-fb15-4499-a408-8dda5e39635c',
  '477020b6-1db3-46b2-b4a7-a79b72f1b7d5',
  '845d4944-e023-49bd-94f7-346fe0dc66a8',
  '1b131606-98d1-4452-ba4f-b50678eac95f',
  'e5e3c433-c627-4006-a49e-e655f069d2ae',
  '32e0440d-523c-4d46-a785-f8692ea4fc11',
  'e84f6975-3bb6-4fd0-9997-8ddab82d0dba',
  '6011708e-b21f-4d45-b39e-af7875091151',
  'fbcbbaee-bd34-4702-b9d6-aecd88d80f8d',
  'c8b4dc6b-991f-403d-80ca-0d6cb91b503c',
  '9dd707d9-3f48-4e90-b231-af2f2c2281c1',
  'cfc136d4-4204-4e01-b612-e3b181384bdf',
  'f283cf90-53a9-4ac6-a333-28b2743a166a',
  '12d3cb99-e678-44c9-a75c-f3363b3abf96',
  '01e9c071-bcc2-45fe-a76c-496a69ccfab6',
  '77a97513-c0c1-4a21-a489-c8a5ce2ad33a',
  '544285c3-94d5-4dad-9d04-0de14237bb38',
  '7bfc9b00-0b64-400f-9ccb-18afba30065d',
  'b9c39b40-8f81-45d9-9e4e-2f0c507bdc4b'
);