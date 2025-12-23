-- Insert default admin user (admin@zaco.sa / admin123)
-- Password is hashed with bcrypt
INSERT INTO users (username, password, full_name, role) 
VALUES ('admin@zaco.sa', '$2a$10$8K1p/a0dL2LmCBp6RXvgLu.7dLqdKXvvL5pzJGJQzJB/z8xm.ZvJC', 'المدير العام', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample user for testing (user@zaco.sa / user123)
INSERT INTO users (username, password, full_name, role) 
VALUES ('user@zaco.sa', '$2a$10$CwTycUnoKkV5dWhVRKlUMOxHtGV8S/z8YHBwVpLKKGq6bh8g9fVYS', 'موظف اختبار', 'user')
ON CONFLICT (username) DO NOTHING;
