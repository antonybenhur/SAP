import type { Database, SqlValue } from 'sql.js';

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

declare global {
  interface Window { initSqlJs: any }
}

const DB_KEY = 'staffaug_sqlite_db';
const DB_VERSION = 1;

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function loadDbFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open('staffaug_db_store', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('db');
    };
    request.onsuccess = () => {
      const idb = request.result;
      const tx = idb.transaction('db', 'readonly');
      const store = tx.objectStore('db');
      const getReq = store.get(DB_KEY);
      getReq.onsuccess = () => {
        resolve((getReq.result as Uint8Array) || null);
      };
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

async function saveDbToIndexedDB(data: Uint8Array): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.open('staffaug_db_store', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('db');
    };
    request.onsuccess = () => {
      const idb = request.result;
      const tx = idb.transaction('db', 'readwrite');
      const store = tx.objectStore('db');
      store.put(data, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    request.onerror = () => resolve();
  });
}

async function loadSqlJs(): Promise<any> {
  if (window.initSqlJs) {
    return window.initSqlJs({ locateFile: (file: string) => `https://sql.js.org/dist/${file}` });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sql.js.org/dist/sql-wasm.js';
    script.onload = () => {
      window.initSqlJs({ locateFile: (file: string) => `https://sql.js.org/dist/${file}` })
        .then(resolve)
        .catch(reject);
    };
    script.onerror = () => reject(new Error('Failed to load sql.js WASM library'));
    document.head.appendChild(script);
  });
}

export async function getDb(): Promise<Database> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await loadSqlJs();
    const savedData = await loadDbFromIndexedDB();
    if (savedData) {
      db = new SQL.Database(savedData);
    } else {
      db = new SQL.Database();
      await initSchema(db);
      await seedData(db);
    }
    await ensureTimesheetEntriesSchema(db);
    await persistDb(db);
    return db;
  })();

  return initPromise;
}

async function persistDb(database: Database): Promise<void> {
  const data = database.export();
  await saveDbToIndexedDB(data);
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export async function persist(): Promise<void> {
  if (!db) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    await persistDb(db!);
  }, 100);
}

// ---------- Schema ----------

async function initSchema(database: Database): Promise<void> {
  database.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'consultant',
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      primary_contact TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      website TEXT,
      industry TEXT,
      account_owner TEXT,
      client_tier TEXT NOT NULL DEFAULT 'active',
      billing_address TEXT,
      payment_terms TEXT NOT NULL DEFAULT 'net_30',
      default_markup_percentage REAL,
      primary_tech_stack TEXT NOT NULL DEFAULT '[]',
      typical_interview_process TEXT,
      submission_requirements TEXT,
      msa_status TEXT NOT NULL DEFAULT 'not_required',
      msa_expiration_date TEXT,
      contract_document_url TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS client_contacts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      is_parent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      address TEXT,
      linkedin_url TEXT,
      portfolio_url TEXT,
      skills TEXT NOT NULL DEFAULT '[]',
      primary_skill TEXT,
      certifications TEXT NOT NULL DEFAULT '[]',
      industry_experience TEXT NOT NULL DEFAULT '[]',
      experience_years INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available',
      work_authorization TEXT,
      availability_date TEXT,
      notice_period TEXT,
      work_arrangement TEXT,
      willing_to_relocate TEXT,
      current_rate REAL,
      expected_rate REAL,
      rate_type TEXT,
      source TEXT,
      recruiter_owner TEXT,
      last_contacted_date TEXT,
      resume_url TEXT,
      notes TEXT,
      created_by TEXT,
      id_card_url TEXT,
      profile_photo_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS job_orders (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      required_skills TEXT NOT NULL DEFAULT '[]',
      nice_to_have_skills TEXT NOT NULL DEFAULT '[]',
      experience_level TEXT,
      years_experience_required INTEGER,
      location TEXT,
      work_arrangement TEXT,
      duration TEXT,
      ideal_start_date TEXT,
      billing_rate REAL,
      billing_structure TEXT,
      monthly_billing_rate REAL,
      project_total_value REAL,
      monthly_target_pay_min REAL,
      monthly_target_pay_max REAL,
      target_pay_rate_min REAL,
      target_pay_rate_max REAL,
      rate_type TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      priority_level TEXT NOT NULL DEFAULT 'medium',
      primary_recruiter_id TEXT,
      account_manager_id TEXT,
      reason_for_opening TEXT,
      contract_to_hire_potential INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      job_order_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      submitted_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      submission_id TEXT,
      candidate_id TEXT NOT NULL,
      job_order_id TEXT NOT NULL,
      interview_date TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      interview_type TEXT NOT NULL DEFAULT 'video',
      interview_stage TEXT NOT NULL DEFAULT 'phone_screen',
      location TEXT,
      meeting_link TEXT,
      notes TEXT,
      interviewers TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'scheduled',
      feedback TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timesheets (
      id TEXT PRIMARY KEY,
      consultant_id TEXT NOT NULL,
      job_order_id TEXT NOT NULL,
      week_ending TEXT NOT NULL,
      hours REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      submitted_at TEXT,
      approved_at TEXT,
      approved_by TEXT,
      comments TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (consultant_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timesheet_entries (
      id TEXT PRIMARY KEY,
      timesheet_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      hours REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (timesheet_id) REFERENCES timesheets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
    CREATE INDEX IF NOT EXISTS idx_job_orders_client ON job_orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_job_orders_status ON job_orders(status);
    CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_interviews_job_order ON interviews(job_order_id);
    CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(interview_date);
    CREATE INDEX IF NOT EXISTS idx_submissions_job_order ON submissions(job_order_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_candidate ON submissions(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_timesheets_consultant ON timesheets(consultant_id);
    CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
  `);
}

async function ensureTimesheetEntriesSchema(database: Database): Promise<void> {
  database.run(`
    CREATE TABLE IF NOT EXISTS timesheet_entries (
      id TEXT PRIMARY KEY,
      timesheet_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      hours REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (timesheet_id) REFERENCES timesheets(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet ON timesheet_entries(timesheet_id);
  `);
}

// ---------- Seed Data ----------

async function seedData(database: Database): Promise<void> {
  const now = new Date().toISOString();

  // Admin user
  const adminId = generateUUID();
  database.run(
    `INSERT INTO profiles (id, email, name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [adminId, 'antonybenhur@gmail.com', 'Antony Benhur', 'administrator', 'admin123', now, now]
  );

  // Additional users
  const recruiterId = generateUUID();
  database.run(
    `INSERT INTO profiles (id, email, name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [recruiterId, 'recruiter@example.com', 'Jane Recruiter', 'recruiter', 'recruiter123', now, now]
  );

  const amId = generateUUID();
  database.run(
    `INSERT INTO profiles (id, email, name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [amId, 'manager@example.com', 'John Manager', 'account_manager', 'manager123', now, now]
  );

  // Clients
  const client1Id = generateUUID();
  database.run(
    `INSERT INTO clients (id, company_name, primary_contact, email, phone, address, website, industry, account_owner, client_tier, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client1Id, 'TechCorp Solutions', 'Alice Johnson', 'alice@techcorp.com', '555-0100', '123 Tech Ave, San Francisco, CA', 'https://techcorp.com', 'Technology', amId, 'strategic', 'active', now, now]
  );

  const client2Id = generateUUID();
  database.run(
    `INSERT INTO clients (id, company_name, primary_contact, email, phone, address, website, industry, account_owner, client_tier, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client2Id, 'DataFlow Systems', 'Bob Smith', 'bob@dataflow.com', '555-0200', '456 Data Dr, New York, NY', 'https://dataflow.com', 'Finance', amId, 'active', 'active', now, now]
  );

  // Client contacts
  database.run(
    `INSERT INTO client_contacts (id, client_id, name, role, email, phone, is_parent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateUUID(), client1Id, 'Alice Johnson', 'CTO', 'alice@techcorp.com', '555-0100', 1, now, now]
  );
  database.run(
    `INSERT INTO client_contacts (id, client_id, name, role, email, phone, is_parent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateUUID(), client1Id, 'Charlie Brown', 'VP Engineering', 'charlie@techcorp.com', '555-0101', 0, now, now]
  );

  // Candidates
  const cand1Id = generateUUID();
  database.run(
    `INSERT INTO candidates (id, name, email, phone, location, skills, primary_skill, experience_years, status, work_authorization, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cand1Id, 'John Doe', 'john.doe@email.com', '555-1001', 'San Francisco, CA', JSON.stringify(['React', 'TypeScript', 'Node.js']), 'React', 5, 'available', 'citizen', recruiterId, now, now]
  );

  const cand2Id = generateUUID();
  database.run(
    `INSERT INTO candidates (id, name, email, phone, location, skills, primary_skill, experience_years, status, work_authorization, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cand2Id, 'Jane Smith', 'jane.smith@email.com', '555-1002', 'New York, NY', JSON.stringify(['Python', 'Django', 'PostgreSQL']), 'Python', 7, 'in_process', 'green_card', recruiterId, now, now]
  );

  const cand3Id = generateUUID();
  database.run(
    `INSERT INTO candidates (id, name, email, phone, location, skills, primary_skill, experience_years, status, work_authorization, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cand3Id, 'Mike Johnson', 'mike.johnson@email.com', '555-1003', 'Austin, TX', JSON.stringify(['Java', 'Spring Boot', 'AWS']), 'Java', 8, 'placed', 'citizen', recruiterId, now, now]
  );

  // Job Orders
  const job1Id = generateUUID();
  database.run(
    `INSERT INTO job_orders (id, client_id, title, description, required_skills, nice_to_have_skills, experience_level, years_experience_required, location, work_arrangement, duration, billing_rate, billing_structure, target_pay_rate_min, target_pay_rate_max, rate_type, status, priority_level, primary_recruiter_id, account_manager_id, contract_to_hire_potential, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [job1Id, client1Id, 'Senior React Developer', 'We need a senior React developer with strong TypeScript skills to join our team building next-gen web applications.', JSON.stringify(['React', 'TypeScript']), JSON.stringify(['GraphQL', 'AWS']), 'Senior', 5, 'San Francisco, CA', 'remote', '6 months', 120, 'hourly', 80, 100, 'w2', 'open', 'high', recruiterId, amId, 1, recruiterId, now, now]
  );

  const job2Id = generateUUID();
  database.run(
    `INSERT INTO job_orders (id, client_id, title, description, required_skills, nice_to_have_skills, experience_level, years_experience_required, location, work_arrangement, duration, billing_rate, billing_structure, target_pay_rate_min, target_pay_rate_max, rate_type, status, priority_level, primary_recruiter_id, account_manager_id, contract_to_hire_potential, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [job2Id, client2Id, 'Python Backend Engineer', 'Looking for a Python backend engineer experienced with Django and PostgreSQL for a financial services platform.', JSON.stringify(['Python', 'Django', 'PostgreSQL']), JSON.stringify(['Celery', 'Redis']), 'Mid-Senior', 4, 'New York, NY', 'hybrid', '12 months', 90, 'hourly', 60, 80, 'c2c', 'interviewing', 'medium', recruiterId, amId, 0, recruiterId, now, now]
  );

  // Submissions
  const sub1Id = generateUUID();
  database.run(
    `INSERT INTO submissions (id, job_order_id, candidate_id, status, submitted_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sub1Id, job1Id, cand1Id, 'interview_scheduled', recruiterId, now, now]
  );

  // Interviews
  const interviewDate = new Date();
  interviewDate.setDate(interviewDate.getDate() + 2);
  interviewDate.setHours(14, 0, 0, 0);
  database.run(
    `INSERT INTO interviews (id, submission_id, candidate_id, job_order_id, interview_date, duration_minutes, interview_type, interview_stage, interviewers, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateUUID(), sub1Id, cand1Id, job1Id, interviewDate.toISOString(), 60, 'video', 'technical', JSON.stringify(['Alice Johnson']), 'scheduled', recruiterId, now, now]
  );

  const consultantId = generateUUID();
  database.run(
    `INSERT INTO profiles (id, email, name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [consultantId, 'mike.johnson@email.com', 'Mike Johnson', 'consultant', 'consultant123', now, now]
  );

  const consultant2Id = generateUUID();
  database.run(
    `INSERT INTO profiles (id, email, name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [consultant2Id, 'sarah.williams@email.com', 'Sarah Williams', 'consultant', 'consultant123', now, now]
  );

  // Timesheets
  const weekEnding = new Date();
  weekEnding.setDate(weekEnding.getDate() - weekEnding.getDay());
  weekEnding.setHours(23, 59, 59, 0);
  const prevWeek = new Date(weekEnding);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const twoWeeksAgo = new Date(weekEnding);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  database.run(
    `INSERT INTO timesheets (id, consultant_id, job_order_id, week_ending, hours, status, submitted_at, approved_at, approved_by, comments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateUUID(), consultantId, job1Id, weekEnding.toISOString(), 40, 'submitted', now, null, null, null, now, now]
  );
  database.run(
    `INSERT INTO timesheets (id, consultant_id, job_order_id, week_ending, hours, status, submitted_at, approved_at, approved_by, comments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateUUID(), consultantId, job1Id, prevWeek.toISOString(), 38, 'approved', now, now, amId, null, now, now]
  );
  database.run(
    `INSERT INTO timesheets (id, consultant_id, job_order_id, week_ending, hours, status, submitted_at, approved_at, approved_by, comments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateUUID(), consultant2Id, job2Id, prevWeek.toISOString(), 40, 'approved', now, now, amId, null, now, now]
  );
  database.run(
    `INSERT INTO timesheets (id, consultant_id, job_order_id, week_ending, hours, status, submitted_at, approved_at, approved_by, comments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateUUID(), consultantId, job1Id, twoWeeksAgo.toISOString(), 40, 'rejected', now, null, null, 'Hours do not match client records. Please verify and resubmit.', now, now]
  );
  database.run(
    `INSERT INTO timesheets (id, consultant_id, job_order_id, week_ending, hours, status, submitted_at, approved_at, approved_by, comments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateUUID(), consultant2Id, job2Id, weekEnding.toISOString(), 36, 'draft', null, null, null, null, now, now]
  );
}

// ---------- Query Helpers ----------

function parseRow(columns: string[], values: SqlValue[]): Record<string, SqlValue> {
  const row: Record<string, SqlValue> = {};
  for (let i = 0; i < columns.length; i++) {
    row[columns[i]] = values[i];
  }
  return row;
}

function deserializeArrays(row: Record<string, SqlValue>, arrayFields: string[]): Record<string, any> {
  const result: Record<string, any> = { ...row };
  for (const field of arrayFields) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch {
        result[field] = [];
      }
    } else if (result[field] === null) {
      result[field] = [];
    }
  }
  return result;
}

function convertBoolFields(row: Record<string, any>, boolFields: string[]): Record<string, any> {
  const result = { ...row };
  for (const field of boolFields) {
    result[field] = result[field] === 1 || result[field] === true;
  }
  return result;
}

export interface QueryResult {
  data: Record<string, any>[] | null;
  error: Error | null;
}

export async function query(sql: string, params: SqlValue[] = []): Promise<QueryResult> {
  try {
    const database = await getDb();
    const stmt = database.prepare(sql);
    stmt.bind(params);
    const rows: Record<string, any>[] = [];
    const columns = stmt.getColumnNames();
    while (stmt.step()) {
      rows.push(parseRow(columns, stmt.get()));
    }
    stmt.free();
    return { data: rows, error: null };
  } catch (err) {
    console.error('Query error:', err);
    return { data: null, error: err as Error };
  }
}

export async function execute(sql: string, params: SqlValue[] = []): Promise<QueryResult> {
  try {
    const database = await getDb();
    database.run(sql, params);
    await persist();
    return { data: null, error: null };
  } catch (err) {
    console.error('Execute error:', err);
    return { data: null, error: err as Error };
  }
}

export function newId(): string {
  return generateUUID();
}

export function now(): string {
  return new Date().toISOString();
}

// ---------- Table-specific helpers ----------

const CANDIDATE_ARRAY_FIELDS = ['skills', 'certifications', 'industry_experience'];
const JOB_ORDER_ARRAY_FIELDS = ['required_skills', 'nice_to_have_skills'];
const INTERVIEW_ARRAY_FIELDS = ['interviewers'];

function processCandidateRow(row: Record<string, any>): Record<string, any> {
  return convertBoolFields(deserializeArrays(row, CANDIDATE_ARRAY_FIELDS), []);
}

function processJobOrderRow(row: Record<string, any>): Record<string, any> {
  return deserializeArrays(row, JOB_ORDER_ARRAY_FIELDS);
}

function processInterviewRow(row: Record<string, any>): Record<string, any> {
  return deserializeArrays(row, INTERVIEW_ARRAY_FIELDS);
}

// ---------- Candidates ----------

export const candidatesTable = {
  async selectAll(): Promise<Record<string, any>[]> {
    const { data } = await query('SELECT * FROM candidates ORDER BY created_at DESC');
    return (data || []).map(processCandidateRow);
  },

  async selectById(id: string): Promise<Record<string, any> | null> {
    const { data } = await query('SELECT * FROM candidates WHERE id = ?', [id]);
    return data && data.length > 0 ? processCandidateRow(data[0]) : null;
  },

  async countByStatus(status: string): Promise<number> {
    const { data } = await query('SELECT COUNT(*) as count FROM candidates WHERE status = ?', [status]);
    return data ? (data[0].count as number) : 0;
  },

  async insert(row: Record<string, any>): Promise<void> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO candidates (id, name, email, phone, location, address, linkedin_url, portfolio_url, skills, primary_skill, certifications, industry_experience, experience_years, status, work_authorization, availability_date, notice_period, work_arrangement, willing_to_relocate, current_rate, expected_rate, rate_type, source, recruiter_owner, last_contacted_date, resume_url, notes, created_by, id_card_url, profile_photo_url, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, row.name, row.email, row.phone ?? null, row.location ?? null, row.address ?? null,
        row.linkedin_url ?? null, row.portfolio_url ?? null, JSON.stringify(row.skills || []),
        row.primary_skill ?? null, JSON.stringify(row.certifications || []),
        JSON.stringify(row.industry_experience || []), row.experience_years || 0,
        row.status || 'available', row.work_authorization ?? null, row.availability_date ?? null,
        row.notice_period ?? null, row.work_arrangement ?? null, row.willing_to_relocate ?? null,
        row.current_rate ?? null, row.expected_rate ?? null, row.rate_type ?? null,
        row.source ?? null, row.recruiter_owner ?? null, row.last_contacted_date ?? null,
        row.resume_url ?? null, row.notes ?? null, row.created_by ?? null,
        row.id_card_url ?? null, row.profile_photo_url ?? null, nowStr, nowStr,
      ]
    );
  },

  async update(id: string, row: Record<string, any>): Promise<void> {
    const fields: string[] = [];
    const values: SqlValue[] = [];
    const fieldMap: Record<string, string> = {
      name: 'name', email: 'email', phone: 'phone', location: 'location', address: 'address',
      linkedin_url: 'linkedin_url', portfolio_url: 'portfolio_url', primary_skill: 'primary_skill',
      experience_years: 'experience_years', status: 'status', work_authorization: 'work_authorization',
      availability_date: 'availability_date', notice_period: 'notice_period',
      work_arrangement: 'work_arrangement', willing_to_relocate: 'willing_to_relocate',
      current_rate: 'current_rate', expected_rate: 'expected_rate', rate_type: 'rate_type',
      source: 'source', recruiter_owner: 'recruiter_owner', last_contacted_date: 'last_contacted_date',
      resume_url: 'resume_url', notes: 'notes', id_card_url: 'id_card_url', profile_photo_url: 'profile_photo_url',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in row) {
        fields.push(`${col} = ?`);
        values.push(row[key] ?? null);
      }
    }
    if ('skills' in row) { fields.push('skills = ?'); values.push(JSON.stringify(row.skills || [])); }
    if ('certifications' in row) { fields.push('certifications = ?'); values.push(JSON.stringify(row.certifications || [])); }
    if ('industry_experience' in row) { fields.push('industry_experience = ?'); values.push(JSON.stringify(row.industry_experience || [])); }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await execute(`UPDATE candidates SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM candidates WHERE id = ?', [id]);
  },
};

// ---------- Clients ----------

export const clientsTable = {
  async selectAll(): Promise<Record<string, any>[]> {
    const { data } = await query(`
      SELECT c.*, p.name as account_owner_name
      FROM clients c
      LEFT JOIN profiles p ON c.account_owner = p.id
      ORDER BY c.created_at DESC
    `);
    return (data || []).map((row) => {
      const processed = deserializeArrays(row, ['primary_tech_stack']);
      processed.account_owner_profile = processed.account_owner_name ? { name: processed.account_owner_name } : null;
      return processed;
    });
  },

  async selectById(id: string): Promise<Record<string, any> | null> {
    const { data } = await query('SELECT * FROM clients WHERE id = ?', [id]);
    if (!data || data.length === 0) return null;
    return deserializeArrays(data[0], ['primary_tech_stack']);
  },

  async insert(row: Record<string, any>): Promise<void> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO clients (id, company_name, primary_contact, email, phone, address, website, industry, account_owner, client_tier, billing_address, payment_terms, default_markup_percentage, primary_tech_stack, typical_interview_process, submission_requirements, msa_status, msa_expiration_date, contract_document_url, notes, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, row.company_name, row.primary_contact, row.email, row.phone ?? null, row.address ?? null,
        row.website ?? null, row.industry ?? null, row.account_owner ?? null,
        row.client_tier || 'active', row.billing_address ?? null, row.payment_terms || 'net_30',
        row.default_markup_percentage ?? null, JSON.stringify(row.primary_tech_stack || []),
        row.typical_interview_process ?? null, row.submission_requirements ?? null,
        row.msa_status || 'not_required', row.msa_expiration_date ?? null,
        row.contract_document_url ?? null, row.notes ?? null, row.status || 'active', nowStr, nowStr,
      ]
    );
  },

  async update(id: string, row: Record<string, any>): Promise<void> {
    const fields: string[] = [];
    const values: SqlValue[] = [];
    const fieldMap: Record<string, string> = {
      company_name: 'company_name', primary_contact: 'primary_contact', email: 'email',
      phone: 'phone', address: 'address', website: 'website', industry: 'industry',
      account_owner: 'account_owner', client_tier: 'client_tier', billing_address: 'billing_address',
      payment_terms: 'payment_terms', default_markup_percentage: 'default_markup_percentage',
      typical_interview_process: 'typical_interview_process', submission_requirements: 'submission_requirements',
      msa_status: 'msa_status', msa_expiration_date: 'msa_expiration_date',
      contract_document_url: 'contract_document_url', notes: 'notes', status: 'status',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in row) { fields.push(`${col} = ?`); values.push(row[key] ?? null); }
    }
    if ('primary_tech_stack' in row) { fields.push('primary_tech_stack = ?'); values.push(JSON.stringify(row.primary_tech_stack || [])); }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await execute(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM clients WHERE id = ?', [id]);
  },
};

// ---------- Client Contacts ----------

export const clientContactsTable = {
  async selectByClient(clientId: string): Promise<Record<string, any>[]> {
    const { data } = await query('SELECT * FROM client_contacts WHERE client_id = ? ORDER BY is_parent DESC, created_at ASC', [clientId]);
    return (data || []).map((row) => ({ ...row, is_primary: row.is_parent === 1 }));
  },

  async insert(row: Record<string, any>): Promise<void> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO client_contacts (id, client_id, name, role, email, phone, is_parent, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, row.client_id, row.name, row.role, row.email, row.phone ?? null, row.is_primary ? 1 : 0, nowStr, nowStr]
    );
  },

  async deleteByClient(clientId: string): Promise<void> {
    await execute('DELETE FROM client_contacts WHERE client_id = ?', [clientId]);
  },
};

// ---------- Job Orders ----------

export const jobOrdersTable = {
  async selectAllWithClients(): Promise<Record<string, any>[]> {
    const { data } = await query(`
      SELECT jo.*, c.company_name, c.primary_contact, c.email as client_email,
        r.name as primary_recruiter_name, r.email as primary_recruiter_email,
        am.name as account_manager_name, am.email as account_manager_email
      FROM job_orders jo
      LEFT JOIN clients c ON jo.client_id = c.id
      LEFT JOIN profiles r ON jo.primary_recruiter_id = r.id
      LEFT JOIN profiles am ON jo.account_manager_id = am.id
      ORDER BY jo.created_at DESC
    `);
    return (data || []).map((row) => {
      const processed = processJobOrderRow(row);
      processed.contract_to_hire_potential = processed.contract_to_hire_potential === 1 || processed.contract_to_hire_potential === true;
      return processed;
    });
  },

  async selectById(id: string): Promise<Record<string, any> | null> {
    const { data } = await query('SELECT * FROM job_orders WHERE id = ?', [id]);
    if (!data || data.length === 0) return null;
    const row = processJobOrderRow(data[0]);
    row.contract_to_hire_potential = row.contract_to_hire_potential === 1 || row.contract_to_hire_potential === true;
    return row;
  },

  async countByStatus(status: string): Promise<number> {
    const { data } = await query('SELECT COUNT(*) as count FROM job_orders WHERE status = ?', [status]);
    return data ? (data[0].count as number) : 0;
  },

  async insert(row: Record<string, any>): Promise<void> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO job_orders (id, client_id, title, description, required_skills, nice_to_have_skills, experience_level, years_experience_required, location, work_arrangement, duration, ideal_start_date, billing_rate, billing_structure, monthly_billing_rate, project_total_value, monthly_target_pay_min, monthly_target_pay_max, target_pay_rate_min, target_pay_rate_max, rate_type, status, priority_level, primary_recruiter_id, account_manager_id, reason_for_opening, contract_to_hire_potential, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, row.client_id, row.title, row.description ?? null,
        JSON.stringify(row.required_skills || []), JSON.stringify(row.nice_to_have_skills || []),
        row.experience_level ?? null, row.years_experience_required ?? null,
        row.location ?? null, row.work_arrangement ?? null, row.duration ?? null,
        row.ideal_start_date ?? null, row.billing_rate ?? null, row.billing_structure ?? null,
        row.monthly_billing_rate ?? null, row.project_total_value ?? null,
        row.monthly_target_pay_min ?? null, row.monthly_target_pay_max ?? null,
        row.target_pay_rate_min ?? null, row.target_pay_rate_max ?? null,
        row.rate_type ?? null, row.status || 'open', row.priority_level || 'medium',
        row.primary_recruiter_id ?? null, row.account_manager_id ?? null,
        row.reason_for_opening ?? null, row.contract_to_hire_potential ? 1 : 0,
        row.created_by ?? null, nowStr, nowStr,
      ]
    );
  },

  async update(id: string, row: Record<string, any>): Promise<void> {
    const fields: string[] = [];
    const values: SqlValue[] = [];
    const fieldMap: Record<string, string> = {
      client_id: 'client_id', title: 'title', description: 'description',
      experience_level: 'experience_level', years_experience_required: 'years_experience_required',
      location: 'location', work_arrangement: 'work_arrangement', duration: 'duration',
      ideal_start_date: 'ideal_start_date', billing_rate: 'billing_rate',
      billing_structure: 'billing_structure', monthly_billing_rate: 'monthly_billing_rate',
      project_total_value: 'project_total_value', monthly_target_pay_min: 'monthly_target_pay_min',
      monthly_target_pay_max: 'monthly_target_pay_max', target_pay_rate_min: 'target_pay_rate_min',
      target_pay_rate_max: 'target_pay_rate_max', rate_type: 'rate_type',
      status: 'status', priority_level: 'priority_level',
      primary_recruiter_id: 'primary_recruiter_id', account_manager_id: 'account_manager_id',
      reason_for_opening: 'reason_for_opening',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in row) { fields.push(`${col} = ?`); values.push(row[key] ?? null); }
    }
    if ('required_skills' in row) { fields.push('required_skills = ?'); values.push(JSON.stringify(row.required_skills || [])); }
    if ('nice_to_have_skills' in row) { fields.push('nice_to_have_skills = ?'); values.push(JSON.stringify(row.nice_to_have_skills || [])); }
    if ('contract_to_hire_potential' in row) { fields.push('contract_to_hire_potential = ?'); values.push(row.contract_to_hire_potential ? 1 : 0); }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await execute(`UPDATE job_orders SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM job_orders WHERE id = ?', [id]);
  },
};

// ---------- Submissions ----------

export const submissionsTable = {
  async selectByJobOrder(jobOrderId: string): Promise<Record<string, any>[]> {
    const { data } = await query(`
      SELECT s.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
        c.skills as candidate_skills, c.primary_skill as candidate_primary_skill,
        c.experience_years as candidate_experience_years, c.status as candidate_status,
        c.profile_photo_url as candidate_profile_photo_url
      FROM submissions s
      LEFT JOIN candidates c ON s.candidate_id = c.id
      WHERE s.job_order_id = ?
      ORDER BY s.created_at DESC
    `, [jobOrderId]);
    return (data || []).map((row) => ({
      ...row,
      candidate_skills: typeof row.candidate_skills === 'string' ? JSON.parse(row.candidate_skills || '[]') : [],
    }));
  },

  async insert(row: Record<string, any>): Promise<string> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO submissions (id, job_order_id, candidate_id, status, submitted_by, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
      [id, row.job_order_id, row.candidate_id, row.status || 'submitted', row.submitted_by ?? null, row.notes ?? null, nowStr, nowStr]
    );
    return id;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await execute('UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?', [status, now(), id]);
  },

  async selectById(id: string): Promise<Record<string, any> | null> {
    const { data } = await query('SELECT * FROM submissions WHERE id = ?', [id]);
    return data && data.length > 0 ? data[0] : null;
  },

  async getSuggestedCandidates(jobOrderId: string): Promise<Record<string, any>[]> {
    const { data: jobData } = await query('SELECT required_skills FROM job_orders WHERE id = ?', [jobOrderId]);
    if (!jobData || jobData.length === 0) return [];
    const requiredSkills: string[] = JSON.parse((jobData[0].required_skills as string) || '[]');
    if (requiredSkills.length === 0) return [];

    const { data: candidates } = await query('SELECT * FROM candidates WHERE status IN (\'available\', \'in_process\') LIMIT 10');
    if (!candidates) return [];

    return candidates.map((c) => {
      const candidateSkills: string[] = JSON.parse((c.skills as string) || '[]');
      const matchedSkills = requiredSkills.filter((s) =>
        candidateSkills.some((cs) => cs.toLowerCase().includes(s.toLowerCase()))
      );
      const matchScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);
      return { ...processCandidateRow(c), match_score: matchScore, matched_skills: matchedSkills };
    }).filter((c) => c.match_score > 0).sort((a, b) => b.match_score - a.match_score).slice(0, 10);
  },
};

// ---------- Interviews ----------

export const interviewsTable = {
  async selectAllWithDetails(): Promise<Record<string, any>[]> {
    const { data } = await query(`
      SELECT i.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
        jo.title as job_title, jo.description as job_description,
        cl.company_name, cl.primary_contact as client_contact,
        s.status as submission_status,
        p.name as created_by_name, p.email as created_by_email
      FROM interviews i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN job_orders jo ON i.job_order_id = jo.id
      LEFT JOIN clients cl ON jo.client_id = cl.id
      LEFT JOIN submissions s ON i.submission_id = s.id
      LEFT JOIN profiles p ON i.created_by = p.id
      ORDER BY i.interview_date ASC
    `);
    return (data || []).map(processInterviewRow);
  },

  async selectByJobOrder(jobOrderId: string): Promise<Record<string, any>[]> {
    const { data } = await query(`
      SELECT i.*, c.name as candidate_name, c.email as candidate_email
      FROM interviews i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      WHERE i.job_order_id = ?
      ORDER BY i.interview_date DESC
    `, [jobOrderId]);
    return (data || []).map(processInterviewRow);
  },

  async insert(row: Record<string, any>): Promise<string> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO interviews (id, submission_id, candidate_id, job_order_id, interview_date, duration_minutes, interview_type, interview_stage, location, meeting_link, notes, interviewers, status, feedback, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, row.submission_id ?? null, row.candidate_id, row.job_order_id,
        row.interview_date, row.duration_minutes || 60, row.interview_type || 'video',
        row.interview_stage || 'phone_screen', row.location ?? null, row.meeting_link ?? null,
        row.notes ?? null, JSON.stringify(row.interviewers || []), row.status || 'scheduled',
        row.feedback ?? null, row.created_by ?? null, nowStr, nowStr,
      ]
    );
    return id;
  },

  async update(id: string, row: Record<string, any>): Promise<void> {
    const fields: string[] = [];
    const values: SqlValue[] = [];
    const fieldMap: Record<string, string> = {
      interview_date: 'interview_date', duration_minutes: 'duration_minutes',
      interview_type: 'interview_type', interview_stage: 'interview_stage',
      location: 'location', meeting_link: 'meeting_link', notes: 'notes',
      status: 'status', feedback: 'feedback',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in row) { fields.push(`${col} = ?`); values.push(row[key] ?? null); }
    }
    if ('interviewers' in row) { fields.push('interviewers = ?'); values.push(JSON.stringify(row.interviewers || [])); }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await execute(`UPDATE interviews SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM interviews WHERE id = ?', [id]);
  },
};

// ---------- Timesheets ----------

export const timesheetsTable = {
  async selectAllWithDetails(): Promise<Record<string, any>[]> {
    const { data } = await query(`
      SELECT t.*, COALESCE(p.name, cand.name) as consultant_name,
        COALESCE(p.email, cand.email) as consultant_email,
        jo.title as job_title, c.company_name as client_name
      FROM timesheets t
      LEFT JOIN profiles p ON t.consultant_id = p.id
      LEFT JOIN candidates cand ON t.consultant_id = cand.id
      LEFT JOIN job_orders jo ON t.job_order_id = jo.id
      LEFT JOIN clients c ON jo.client_id = c.id
      ORDER BY t.week_ending DESC
    `);
    return data || [];
  },

  async selectById(id: string): Promise<Record<string, any> | null> {
    const { data } = await query('SELECT * FROM timesheets WHERE id = ?', [id]);
    return data && data.length > 0 ? data[0] : null;
  },

  async selectByConsultant(consultantId: string): Promise<Record<string, any>[]> {
    const { data } = await query('SELECT * FROM timesheets WHERE consultant_id = ? ORDER BY week_ending DESC', [consultantId]);
    return data || [];
  },

  async insert(row: Record<string, any>): Promise<string> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO timesheets (id, consultant_id, job_order_id, week_ending, hours, status, submitted_at, approved_at, approved_by, comments, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, row.consultant_id, row.job_order_id, row.week_ending, row.hours || 0,
       row.status || 'draft', row.submitted_at ?? null, row.approved_at ?? null,
       row.approved_by ?? null, row.comments ?? null, nowStr, nowStr]
    );
    return id;
  },

  async update(id: string, row: Record<string, any>): Promise<void> {
    const fields: string[] = [];
    const values: SqlValue[] = [];
    const fieldMap: Record<string, string> = {
      consultant_id: 'consultant_id', job_order_id: 'job_order_id',
      week_ending: 'week_ending', hours: 'hours', comments: 'comments',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in row) { fields.push(`${col} = ?`); values.push(row[key] ?? null); }
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await execute(`UPDATE timesheets SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM timesheets WHERE id = ?', [id]);
  },

  async selectApprovedHours(): Promise<Record<string, any>[]> {
    const { data } = await query('SELECT hours FROM timesheets WHERE status = \'approved\'');
    return data || [];
  },

  async updateStatus(id: string, status: string, comments?: string): Promise<void> {
    const nowStr = now();
    if (status === 'approved') {
      await execute('UPDATE timesheets SET status = ?, approved_at = ?, comments = ?, updated_at = ? WHERE id = ?', [status, nowStr, comments ?? null, nowStr, id]);
    } else if (status === 'submitted') {
      await execute('UPDATE timesheets SET status = ?, submitted_at = ?, updated_at = ? WHERE id = ?', [status, nowStr, nowStr, id]);
    } else {
      await execute('UPDATE timesheets SET status = ?, comments = ?, updated_at = ? WHERE id = ?', [status, comments ?? null, nowStr, id]);
    }
  },
};

// ---------- Timesheet Entries ----------

export const timesheetEntriesTable = {
  async selectByTimesheet(timesheetId: string): Promise<Record<string, any>[]> {
    const { data } = await query('SELECT * FROM timesheet_entries WHERE timesheet_id = ? ORDER BY entry_date ASC', [timesheetId]);
    return data || [];
  },

  async insert(row: Record<string, any>): Promise<string> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO timesheet_entries (id, timesheet_id, entry_date, hours, description, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?)`,
      [id, row.timesheet_id, row.entry_date, row.hours || 0, row.description ?? null, nowStr, nowStr]
    );
    return id;
  },

  async update(id: string, row: Record<string, any>): Promise<void> {
    const fields: string[] = [];
    const values: SqlValue[] = [];
    const fieldMap: Record<string, string> = {
      entry_date: 'entry_date', hours: 'hours', description: 'description',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in row) { fields.push(`${col} = ?`); values.push(row[key] ?? null); }
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await execute(`UPDATE timesheet_entries SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM timesheet_entries WHERE id = ?', [id]);
  },

  async deleteByTimesheet(timesheetId: string): Promise<void> {
    await execute('DELETE FROM timesheet_entries WHERE timesheet_id = ?', [timesheetId]);
  },
};

// ---------- Profiles ----------

export const profilesTable = {
  async selectAll(): Promise<Record<string, any>[]> {
    const { data } = await query('SELECT * FROM profiles ORDER BY created_at DESC');
    return data || [];
  },

  async selectById(id: string): Promise<Record<string, any> | null> {
    const { data } = await query('SELECT * FROM profiles WHERE id = ?', [id]);
    return data && data.length > 0 ? data[0] : null;
  },

  async selectByRole(roles: string[]): Promise<Record<string, any>[]> {
    const placeholders = roles.map(() => '?').join(',');
    const { data } = await query(`SELECT * FROM profiles WHERE role IN (${placeholders}) ORDER BY name ASC`, roles);
    return data || [];
  },

  async selectByEmail(email: string): Promise<Record<string, any> | null> {
    const { data } = await query('SELECT * FROM profiles WHERE email = ?', [email]);
    return data && data.length > 0 ? data[0] : null;
  },

  async insert(row: Record<string, any>): Promise<string> {
    const id = row.id || newId();
    const nowStr = now();
    await execute(
      `INSERT INTO profiles (id, email, name, role, password_hash, avatar_url, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
      [id, row.email, row.name, row.role || 'consultant', row.password_hash || '', row.avatar_url ?? null, nowStr, nowStr]
    );
    return id;
  },

  async update(id: string, row: Record<string, any>): Promise<void> {
    const fields: string[] = [];
    const values: SqlValue[] = [];
    const fieldMap: Record<string, string> = {
      email: 'email', name: 'name', role: 'role', avatar_url: 'avatar_url',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in row) { fields.push(`${col} = ?`); values.push(row[key] ?? null); }
    }
    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    await execute(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM profiles WHERE id = ?', [id]);
  },
};

// ---------- Auth ----------

export const auth = {
  async signIn(email: string, password: string): Promise<{ user: Record<string, any> | null; error: Error | null }> {
    const profile = await profilesTable.selectByEmail(email);
    if (!profile) {
      return { user: null, error: new Error('Invalid email or password') };
    }
    if (profile.password_hash !== password) {
      return { user: null, error: new Error('Invalid email or password') };
    }
    return { user: profile, error: null };
  },

  async signUp(email: string, password: string, userData: { name: string; role: string }): Promise<{ user: Record<string, any> | null; error: Error | null }> {
    const existing = await profilesTable.selectByEmail(email);
    if (existing) {
      return { user: null, error: new Error('An account with this email already exists') };
    }
    const id = await profilesTable.insert({
      email,
      name: userData.name,
      role: userData.role,
      password_hash: password,
    });
    const profile = await profilesTable.selectById(id);
    return { user: profile, error: null };
  },
};
