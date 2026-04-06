/**
 * Load .env and, when running scripts from host, use localhost for DB
 * so that DB_HOST=postgres (Docker) does not cause ENOTFOUND when not in Docker.
 */
import dotenv from 'dotenv'

dotenv.config()

if (process.env.DB_HOST === 'postgres') {
  process.env.DB_HOST = 'localhost'
}
