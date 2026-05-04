import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = [
  resolve(__dirname, '../../.env'),
  resolve(__dirname, '../../../.env'),
  resolve(process.cwd(), 'backend/.env'),
  resolve(process.cwd(), '.env'),
].find((candidate) => existsSync(candidate));

config({
  path: envPath,
  override: true,
  quiet: true,
});
