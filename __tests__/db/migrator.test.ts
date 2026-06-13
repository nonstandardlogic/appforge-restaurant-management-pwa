import * as fs from 'fs';
import * as path from 'path';
import {
  getAppliedMigrations,
  getMigrationFiles,
  runMigrations,
  DbClient,
} from '../../lib/db/migrator';

const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');

describe('getMigrationFiles', () => {
  it('returns all SQL files sorted alphabetically', () => {
    const files = getMigrationFiles(MIGRATIONS_DIR);
    expect(files.length).toBeGreaterThanOrEqual(8);
    expect(files).toEqual([...files].sort());
    files.forEach((f) => expect(f).toMatch(/\.sql$/));
  });

  it('all files carry a 3-digit numeric prefix for deterministic execution order', () => {
    const files = getMigrationFiles(MIGRATIONS_DIR);
    files.forEach((f) => expect(f).toMatch(/^\d{3}_/));
  });

  it('returns empty array for a directory that does not exist', () => {
    expect(getMigrationFiles('/nonexistent/path')).toEqual([]);
  });
});

describe('SQL idempotency', () => {
  it('every migration file uses CREATE TABLE IF NOT EXISTS (safe to run twice)', () => {
    const files = getMigrationFiles(MIGRATIONS_DIR);
    files.forEach((file) => {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      const lower = content.toLowerCase();
      if (lower.includes('create table')) {
        expect(lower).toContain('create table if not exists');
      }
    });
  });
});

describe('schema coverage — AC1', () => {
  it('creates all 6 required domain tables and the migrations tracking table', () => {
    const files = getMigrationFiles(MIGRATIONS_DIR);
    const allSql = files
      .map((f) =>
        fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf-8').toLowerCase()
      )
      .join('\n');

    const requiredTables = [
      'migrations',
      'users',
      'financial_records',
      'haccp_logs',
      'staff_hours',
      'alerts_config',
      'alerts_log',
    ];

    requiredTables.forEach((table) => {
      expect(allSql).toContain(`create table if not exists ${table}`);
    });
  });
});

describe('getAppliedMigrations', () => {
  it('bootstraps migrations table on a fresh DB and returns empty array', async () => {
    const calls: string[] = [];
    const mockDb: DbClient = {
      query: jest.fn().mockImplementation((sql: string) => {
        calls.push(sql.trim().toLowerCase());
        if (sql.toLowerCase().includes('select name')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const result = await getAppliedMigrations(mockDb);

    expect(result).toEqual([]);
    expect(calls[0]).toContain('create table if not exists migrations');
  });

  it('returns the names of previously-applied migrations', async () => {
    const applied = [
      '001_create_migrations_table.sql',
      '002_create_users.sql',
    ];
    const mockDb: DbClient = {
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.toLowerCase().includes('select name')) {
          return Promise.resolve({ rows: applied.map((name) => ({ name })) });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const result = await getAppliedMigrations(mockDb);
    expect(result).toEqual(applied);
  });
});

describe('runMigrations', () => {
  it('applies only pending migrations and records each in the migrations table', async () => {
    const alreadyApplied = new Set(['001_create_migrations_table.sql']);
    const recorded: string[] = [];

    const mockDb: DbClient = {
      query: jest.fn().mockImplementation((sql: string, params?: unknown[]) => {
        if (sql.toLowerCase().includes('select name')) {
          return Promise.resolve({
            rows: [...alreadyApplied].map((name) => ({ name })),
          });
        }
        if (sql.toLowerCase().includes('insert into migrations')) {
          const name = params![0] as string;
          recorded.push(name);
          alreadyApplied.add(name);
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const ran = await runMigrations(mockDb, MIGRATIONS_DIR);

    expect(ran.length).toBeGreaterThan(0);
    expect(ran).not.toContain('001_create_migrations_table.sql');
    ran.forEach((name) => expect(recorded).toContain(name));
  });

  it('is idempotent — returns empty array when all migrations are already applied — AC3', async () => {
    const allFiles = getMigrationFiles(MIGRATIONS_DIR);
    const mockDb: DbClient = {
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.toLowerCase().includes('select name')) {
          return Promise.resolve({ rows: allFiles.map((name) => ({ name })) });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const ran = await runMigrations(mockDb, MIGRATIONS_DIR);
    expect(ran).toEqual([]);
  });

  it('does not re-execute domain-table SQL for already-applied migrations', async () => {
    const allFiles = getMigrationFiles(MIGRATIONS_DIR);
    const domainSqlExecuted: string[] = [];

    const mockDb: DbClient = {
      query: jest.fn().mockImplementation((sql: string) => {
        const lower = sql.trim().toLowerCase();
        const isBookkeeping =
          lower.includes('select name') ||
          lower.startsWith('create table if not exists migrations') ||
          lower.startsWith('insert into migrations');
        if (!isBookkeeping) {
          domainSqlExecuted.push(sql);
        }
        return Promise.resolve({
          rows: allFiles.map((name) => ({ name })),
        });
      }),
    };

    await runMigrations(mockDb, MIGRATIONS_DIR);
    expect(domainSqlExecuted).toHaveLength(0);
  });

  it('executes migrations in ascending filename order', async () => {
    const executionOrder: string[] = [];
    const mockDb: DbClient = {
      query: jest.fn().mockImplementation((sql: string, params?: unknown[]) => {
        if (sql.toLowerCase().includes('select name')) {
          return Promise.resolve({ rows: [] });
        }
        if (sql.toLowerCase().includes('insert into migrations')) {
          executionOrder.push(params![0] as string);
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    await runMigrations(mockDb, MIGRATIONS_DIR);

    expect(executionOrder).toEqual([...executionOrder].sort());
    expect(executionOrder.length).toBeGreaterThan(0);
  });
});
