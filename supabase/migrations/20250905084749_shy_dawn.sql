/*
  # Complete Staff Augmentation Platform Schema

  1. New Tables
    - `profiles` - User profiles with roles
    - `clients` - Client companies
    - `candidates` - Available consultants
    - `job_orders` - Job requirements
    - `timesheets` - Time tracking

  2. Security
    - Enable RLS on all tables
    - Role-based access policies
    - Proper user authentication flow

  3. Functions
    - Auto-create profile on user signup
    - Update timestamp triggers
*/

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('administrator', 'account_manager', 'recruiter', 'finance', 'consultant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE client_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE candidate_status AS ENUM ('available', 'in_process', 'placed', 'do_not_contact');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_order_status AS ENUM ('open', 'interviewing', 'filled', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE timesheet_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role user_role DEFAULT 'consultant' NOT NULL,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    primary_contact text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    status client_status DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    location text,
    skills text[] DEFAULT '{}',
    experience_years integer DEFAULT 0,
    status candidate_status DEFAULT 'available',
    resume_url text,
    notes text,
    created_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create job_orders table
CREATE TABLE IF NOT EXISTS job_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    required_skills text[] DEFAULT '{}',
    experience_level text,
    duration text,
    billing_rate numeric(10,2),
    status job_order_status DEFAULT 'open',
    created_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_orders ENABLE ROW LEVEL SECURITY;

-- Create timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    job_order_id uuid REFERENCES job_orders(id) ON DELETE CASCADE,
    week_ending date NOT NULL,
    hours numeric(5,2) DEFAULT 0 NOT NULL,
    status timesheet_status DEFAULT 'draft',
    submitted_at timestamptz,
    approved_at timestamptz,
    approved_by uuid REFERENCES profiles(id),
    comments text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(consultant_id, job_order_id, week_ending)
);

ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS candidates_email_idx ON candidates(email);
CREATE INDEX IF NOT EXISTS candidates_name_idx ON candidates(name);
CREATE INDEX IF NOT EXISTS candidates_status_idx ON candidates(status);
CREATE INDEX IF NOT EXISTS candidates_skills_idx ON candidates USING gin(skills);

CREATE INDEX IF NOT EXISTS job_orders_client_id_idx ON job_orders(client_id);
CREATE INDEX IF NOT EXISTS job_orders_status_idx ON job_orders(status);
CREATE INDEX IF NOT EXISTS job_orders_skills_idx ON job_orders USING gin(required_skills);

CREATE INDEX IF NOT EXISTS timesheets_consultant_id_idx ON timesheets(consultant_id);
CREATE INDEX IF NOT EXISTS timesheets_job_order_id_idx ON timesheets(job_order_id);
CREATE INDEX IF NOT EXISTS timesheets_week_ending_idx ON timesheets(week_ending);
CREATE INDEX IF NOT EXISTS timesheets_status_idx ON timesheets(status);

-- Create triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_orders_updated_at ON job_orders;
CREATE TRIGGER update_job_orders_updated_at
    BEFORE UPDATE ON job_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timesheets_updated_at ON timesheets;
CREATE TRIGGER update_timesheets_updated_at
    BEFORE UPDATE ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile"
            ON profiles FOR SELECT
            TO authenticated
            USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
            ON profiles FOR UPDATE
            TO authenticated
            USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Administrators can view all profiles'
    ) THEN
        CREATE POLICY "Administrators can view all profiles"
            ON profiles FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'administrator'
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Administrators can manage all profiles'
    ) THEN
        CREATE POLICY "Administrators can manage all profiles"
            ON profiles FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'administrator'
                )
            );
    END IF;
END $$;

-- Client policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clients' AND policyname = 'Account managers and administrators can view clients'
    ) THEN
        CREATE POLICY "Account managers and administrators can view clients"
            ON clients FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('administrator', 'account_manager', 'recruiter', 'finance')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clients' AND policyname = 'Account managers and administrators can manage clients'
    ) THEN
        CREATE POLICY "Account managers and administrators can manage clients"
            ON clients FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('administrator', 'account_manager')
                )
            );
    END IF;
END $$;

-- Candidate policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'candidates' AND policyname = 'Recruiters and managers can view candidates'
    ) THEN
        CREATE POLICY "Recruiters and managers can view candidates"
            ON candidates FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('administrator', 'account_manager', 'recruiter')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'candidates' AND policyname = 'Recruiters and managers can manage candidates'
    ) THEN
        CREATE POLICY "Recruiters and managers can manage candidates"
            ON candidates FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('administrator', 'account_manager', 'recruiter')
                )
            );
    END IF;
END $$;

-- Job order policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_orders' AND policyname = 'Staff can view job orders'
    ) THEN
        CREATE POLICY "Staff can view job orders"
            ON job_orders FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('administrator', 'account_manager', 'recruiter')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_orders' AND policyname = 'Account managers and administrators can manage job orders'
    ) THEN
        CREATE POLICY "Account managers and administrators can manage job orders"
            ON job_orders FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('administrator', 'account_manager')
                )
            );
    END IF;
END $$;

-- Timesheet policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timesheets' AND policyname = 'Consultants can manage their own timesheets'
    ) THEN
        CREATE POLICY "Consultants can manage their own timesheets"
            ON timesheets FOR ALL
            TO authenticated
            USING (consultant_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timesheets' AND policyname = 'Managers can view all timesheets'
    ) THEN
        CREATE POLICY "Managers can view all timesheets"
            ON timesheets FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('administrator', 'account_manager', 'finance')
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timesheets' AND policyname = 'Managers can approve timesheets'
    ) THEN
        CREATE POLICY "Managers can approve timesheets"
            ON timesheets FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('administrator', 'account_manager', 'finance')
                )
            );
    END IF;
END $$;

-- Create views
CREATE OR REPLACE VIEW job_orders_with_clients AS
SELECT 
    jo.*,
    c.company_name,
    c.primary_contact,
    c.email as client_email
FROM job_orders jo
LEFT JOIN clients c ON jo.client_id = c.id;

CREATE OR REPLACE VIEW timesheets_with_details AS
SELECT 
    t.*,
    p.name as consultant_name,
    p.email as consultant_email,
    jo.title as job_title,
    c.company_name as client_name
FROM timesheets t
LEFT JOIN profiles p ON t.consultant_id = p.id
LEFT JOIN job_orders jo ON t.job_order_id = jo.id
LEFT JOIN clients c ON jo.client_id = c.id;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'consultant')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();