process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  "postgresql://petcare:petcare@localhost:5433/petcare_test?schema=public";
process.env.WEB_ORIGIN = "http://localhost:5173";
process.env.LOG_LEVEL = "silent";
