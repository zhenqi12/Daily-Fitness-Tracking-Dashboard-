const request = require('supertest');
const fs = require('fs');
const path = require('path');

const TEST_DB = path.join(__dirname, '..', 'data', 'test.db');
process.env.SQLITE_DB = TEST_DB;

const { run, db, initDb } = require('../config/db');
const app = require('../app');
const { calculateMacroAlertStatus } = require('../controllers/dailyLogController');

beforeAll(async () => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.SQLITE_DB = TEST_DB;
  await initDb();
});

afterAll(() => {
  db.close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe('calculateMacroAlertStatus', () => {
  test('returns green below 75%', () => {
    expect(calculateMacroAlertStatus(74, 100)).toBe('green');
  });

  test('returns yellow at 75%', () => {
    expect(calculateMacroAlertStatus(75, 100)).toBe('yellow');
  });

  test('returns yellow at 99%', () => {
    expect(calculateMacroAlertStatus(99, 100)).toBe('yellow');
  });

  test('returns red at 100%', () => {
    expect(calculateMacroAlertStatus(100, 100)).toBe('red');
  });
});

describe('/api/orders/complete', () => {
  test('upserts daily log and accumulates totals for same day', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const firstResponse = await request(app)
      .post('/api/orders/complete')
      .send({ user_id: 1, calories: 200, protein_g: 20, carbs_g: 30, fats_g: 10 });

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.totals.calories.consumed).toBe(1400);

    const secondResponse = await request(app)
      .post('/api/orders/complete')
      .send({ user_id: 1, calories: 300, protein_g: 25, carbs_g: 40, fats_g: 5 });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.totals.calories.consumed).toBe(1700);
    expect(secondResponse.body.totals.protein.consumed).toBe(125);
    expect(secondResponse.body.totals.carbs.consumed).toBe(230);
    expect(secondResponse.body.totals.fats.consumed).toBe(60);

    const dashboardResponse = await request(app)
      .get('/api/daily-log')
      .query({ user_id: 1, date: today });

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.calories.consumed).toBe(1700);
  });

  test('returns new_alerts only on tier crossing', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await request(app)
      .post('/api/orders/complete')
      .send({ user_id: 2, calories: 1200, protein_g: 60, carbs_g: 80, fats_g: 20 });

    const crossingResponse = await request(app)
      .post('/api/orders/complete')
      .send({ user_id: 2, calories: 200, protein_g: 10, carbs_g: 10, fats_g: 5 });

    expect(crossingResponse.status).toBe(200);
    expect(crossingResponse.body.new_alerts.length).toBeGreaterThanOrEqual(1);

    const sameTierResponse = await request(app)
      .post('/api/orders/complete')
      .send({ user_id: 2, calories: 10, protein_g: 1, carbs_g: 2, fats_g: 1 });

    expect(sameTierResponse.status).toBe(200);
    expect(sameTierResponse.body.new_alerts.length).toBe(0);
  });
});
