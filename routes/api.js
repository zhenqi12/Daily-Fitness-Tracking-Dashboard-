const express = require('express');
const { completeOrder, getDailyLog } = require('../controllers/dailyLogController');

const router = express.Router();

router.post('/orders/complete', completeOrder);
router.get('/daily-log', getDailyLog);

module.exports = router;
