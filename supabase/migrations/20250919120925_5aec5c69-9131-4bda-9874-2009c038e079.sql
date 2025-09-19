-- Create missing profile for the user who has been scanning
INSERT INTO profiles (user_id, first_name, auto_blog_generation)
VALUES ('567d3376-a797-447c-86cb-4c2f1260e997', 'Plaat Verhaal User', true)
ON CONFLICT (user_id) DO NOTHING;