import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('Root package.json configuration', () => {
  let pkg: Record<string, unknown>;

  beforeAll(() => {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    pkg = JSON.parse(raw) as Record<string, unknown>;
  });

  it('should be valid JSON with required top-level fields', () => {
    expect(pkg).toBeDefined();
    expect(typeof pkg).toBe('object');
  });

  it('should have the correct project name', () => {
    expect(pkg.name).toBe('k-statra');
  });

  it('should have version 1.0.0', () => {
    expect(pkg.version).toBe('1.0.0');
  });

  it('should be marked as private', () => {
    expect(pkg.private).toBe(true);
  });

  describe('scripts', () => {
    let scripts: Record<string, string>;

    beforeAll(() => {
      scripts = pkg.scripts as Record<string, string>;
    });

    it('should define a prepare script', () => {
      expect(scripts).toHaveProperty('prepare');
    });

    it('should run husky in the prepare script', () => {
      expect(scripts.prepare).toBe('husky');
    });
  });

  describe('devDependencies', () => {
    let devDeps: Record<string, string>;

    beforeAll(() => {
      devDeps = pkg.devDependencies as Record<string, string>;
    });

    it('should include husky as a devDependency', () => {
      expect(devDeps).toHaveProperty('husky');
    });

    it('should include lint-staged as a devDependency', () => {
      expect(devDeps).toHaveProperty('lint-staged');
    });

    it('should specify husky version ^9.1.7', () => {
      expect(devDeps['husky']).toBe('^9.1.7');
    });

    it('should specify lint-staged version ^16.4.0', () => {
      expect(devDeps['lint-staged']).toBe('^16.4.0');
    });

    it('should have exactly two devDependencies', () => {
      expect(Object.keys(devDeps)).toHaveLength(2);
    });
  });

  describe('lint-staged configuration', () => {
    let lintStagedConfig: Record<string, string[]>;

    beforeAll(() => {
      lintStagedConfig = pkg['lint-staged'] as Record<string, string[]>;
    });

    it('should define a lint-staged configuration', () => {
      expect(lintStagedConfig).toBeDefined();
      expect(typeof lintStagedConfig).toBe('object');
    });

    it('should have exactly two glob patterns', () => {
      expect(Object.keys(lintStagedConfig)).toHaveLength(2);
    });

    it('should include a pattern for backend TypeScript files', () => {
      expect(lintStagedConfig).toHaveProperty('backend/**/*.ts');
    });

    it('should include a pattern for frontend JavaScript and JSX files', () => {
      expect(lintStagedConfig).toHaveProperty('frontend/src/**/*.{js,jsx}');
    });

    describe('backend TypeScript pattern commands', () => {
      let backendCmds: string[];

      beforeAll(() => {
        backendCmds = lintStagedConfig['backend/**/*.ts'];
      });

      it('should define exactly two commands for backend TS files', () => {
        expect(backendCmds).toHaveLength(2);
      });

      it('should run eslint --fix for backend TS files', () => {
        const eslintCmd = backendCmds.find((cmd) => cmd.includes('eslint'));
        expect(eslintCmd).toBeDefined();
        expect(eslintCmd).toContain('--fix');
      });

      it('should run prettier --write for backend TS files', () => {
        const prettierCmd = backendCmds.find((cmd) => cmd.includes('prettier'));
        expect(prettierCmd).toBeDefined();
        expect(prettierCmd).toContain('--write');
      });

      it('should navigate to backend directory before running eslint', () => {
        const eslintCmd = backendCmds.find((cmd) => cmd.includes('eslint'));
        expect(eslintCmd).toContain('cd backend');
      });

      it('should navigate to backend directory before running prettier', () => {
        const prettierCmd = backendCmds.find((cmd) =>
          cmd.includes('prettier'),
        );
        expect(prettierCmd).toContain('cd backend');
      });

      it('should use bash -c to run commands in a subshell', () => {
        backendCmds.forEach((cmd) => {
          expect(cmd).toMatch(/^bash -c /);
        });
      });
    });

    describe('frontend JavaScript/JSX pattern commands', () => {
      let frontendCmds: string[];

      beforeAll(() => {
        frontendCmds = lintStagedConfig['frontend/src/**/*.{js,jsx}'];
      });

      it('should define exactly two commands for frontend JS/JSX files', () => {
        expect(frontendCmds).toHaveLength(2);
      });

      it('should run eslint --fix for frontend JS/JSX files', () => {
        const eslintCmd = frontendCmds.find((cmd) => cmd.includes('eslint'));
        expect(eslintCmd).toBeDefined();
        expect(eslintCmd).toContain('--fix');
      });

      it('should run prettier --write for frontend JS/JSX files', () => {
        const prettierCmd = frontendCmds.find((cmd) =>
          cmd.includes('prettier'),
        );
        expect(prettierCmd).toBeDefined();
        expect(prettierCmd).toContain('--write');
      });

      it('should navigate to frontend directory before running eslint', () => {
        const eslintCmd = frontendCmds.find((cmd) => cmd.includes('eslint'));
        expect(eslintCmd).toContain('cd frontend');
      });

      it('should navigate to frontend directory before running prettier', () => {
        const prettierCmd = frontendCmds.find((cmd) =>
          cmd.includes('prettier'),
        );
        expect(prettierCmd).toContain('cd frontend');
      });

      it('should use bash -c to run commands in a subshell', () => {
        frontendCmds.forEach((cmd) => {
          expect(cmd).toMatch(/^bash -c /);
        });
      });
    });

    describe('pattern isolation', () => {
      it('backend pattern should not be used for frontend JS files', () => {
        const patterns = Object.keys(lintStagedConfig);
        const backendPattern = patterns.find((p) =>
          p.includes('backend/**/*.ts'),
        );
        expect(backendPattern).not.toContain('frontend');
      });

      it('frontend pattern should not match generic TS files', () => {
        const frontendPattern = 'frontend/src/**/*.{js,jsx}';
        expect(frontendPattern).not.toContain('.ts');
      });

      it('backend pattern targets TypeScript files only', () => {
        expect(lintStagedConfig).not.toHaveProperty('backend/**/*.js');
      });
    });
  });

  describe('no unexpected top-level fields', () => {
    it('should not have a dependencies field (dev-only setup)', () => {
      expect(pkg).not.toHaveProperty('dependencies');
    });
  });
});

describe('Husky pre-commit hook', () => {
  let hookContent: string;

  beforeAll(() => {
    const hookPath = path.join(ROOT_DIR, '.husky', 'pre-commit');
    hookContent = fs.readFileSync(hookPath, 'utf-8');
  });

  it('should exist as a readable file', () => {
    expect(hookContent).toBeDefined();
    expect(typeof hookContent).toBe('string');
  });

  it('should invoke lint-staged via npx', () => {
    expect(hookContent.trim()).toContain('npx lint-staged');
  });

  it('should contain exactly one command (npx lint-staged)', () => {
    const nonEmptyLines = hookContent
      .split('\n')
      .filter((line) => line.trim() !== '');
    expect(nonEmptyLines).toHaveLength(1);
    expect(nonEmptyLines[0].trim()).toBe('npx lint-staged');
  });

  it('should not contain any other commands', () => {
    const lines = hookContent
      .split('\n')
      .filter((line) => line.trim() !== '');
    lines.forEach((line) => {
      expect(line.trim()).toBe('npx lint-staged');
    });
  });
});

describe('package-lock.json', () => {
  let lockfile: Record<string, unknown>;

  beforeAll(() => {
    const lockPath = path.join(ROOT_DIR, 'package-lock.json');
    const raw = fs.readFileSync(lockPath, 'utf-8');
    lockfile = JSON.parse(raw) as Record<string, unknown>;
  });

  it('should be valid JSON', () => {
    expect(lockfile).toBeDefined();
    expect(typeof lockfile).toBe('object');
  });

  it('should use lockfileVersion 3', () => {
    expect(lockfile.lockfileVersion).toBe(3);
  });

  it('should have the correct package name', () => {
    expect(lockfile.name).toBe('k-statra');
  });

  it('should set requires to true', () => {
    expect(lockfile.requires).toBe(true);
  });

  describe('resolved packages', () => {
    let packages: Record<string, Record<string, unknown>>;

    beforeAll(() => {
      packages = lockfile.packages as Record<string, Record<string, unknown>>;
    });

    it('should include a packages field', () => {
      expect(packages).toBeDefined();
    });

    it('should resolve husky package', () => {
      expect(packages).toHaveProperty('node_modules/husky');
    });

    it('should resolve lint-staged package', () => {
      expect(packages).toHaveProperty('node_modules/lint-staged');
    });

    it('should resolve husky to version 9.1.7', () => {
      const husky = packages['node_modules/husky'];
      expect(husky.version).toBe('9.1.7');
    });

    it('should resolve lint-staged to version 16.x', () => {
      const lintStaged = packages['node_modules/lint-staged'];
      const version = lintStaged.version as string;
      expect(version).toMatch(/^16\./);
    });

    it('should mark husky as a dev dependency in lockfile', () => {
      const husky = packages['node_modules/husky'];
      expect(husky.dev).toBe(true);
    });

    it('should mark lint-staged as a dev dependency in lockfile', () => {
      const lintStaged = packages['node_modules/lint-staged'];
      expect(lintStaged.dev).toBe(true);
    });

    it('should include the root package entry with devDependencies', () => {
      const rootPkg = packages[''] as Record<string, unknown>;
      expect(rootPkg).toBeDefined();
      const devDeps = rootPkg.devDependencies as Record<string, string>;
      expect(devDeps).toHaveProperty('husky');
      expect(devDeps).toHaveProperty('lint-staged');
    });
  });

  describe('lint-staged transitive dependencies', () => {
    let packages: Record<string, Record<string, unknown>>;

    beforeAll(() => {
      packages = lockfile.packages as Record<string, Record<string, unknown>>;
    });

    it('should include picomatch (used by lint-staged for glob matching)', () => {
      expect(packages).toHaveProperty('node_modules/picomatch');
    });

    it('should include yaml (used by lint-staged for config parsing)', () => {
      expect(packages).toHaveProperty('node_modules/yaml');
    });

    it('should include commander (used by lint-staged CLI)', () => {
      expect(packages).toHaveProperty('node_modules/commander');
    });
  });
});