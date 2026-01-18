-- Migration to add permissions column to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'permissions') THEN 
        ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'position') THEN 
        ALTER TABLE users ADD COLUMN position VARCHAR(255); 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department') THEN 
        ALTER TABLE users ADD COLUMN department VARCHAR(255); 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN 
        ALTER TABLE users ADD COLUMN phone VARCHAR(255); 
    END IF;
END $$;
