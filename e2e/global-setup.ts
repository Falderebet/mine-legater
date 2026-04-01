// The webServer is already running when this runs, so we must not touch the DB file.
// Data cleanup between tests is handled by the /api/test/reset endpoint in beforeEach.
export default async function globalSetup() {}
