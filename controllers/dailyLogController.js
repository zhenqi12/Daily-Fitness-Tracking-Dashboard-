const db = require("../config/db");

/**
 * Get today's nutrition log for a user
 */
exports.getTodayLog = (userId, callback) => {

    const sql = `
        SELECT *
        FROM daily_logs
        WHERE user_id = ?
        AND date = CURDATE()
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            return callback(err);
        }

        if (results.length === 0) {
            return callback(null, null);
        }

        callback(null, results[0]);

    });

};

/**
 * Create today's nutrition log
 */
exports.createTodayLog = (userId, callback) => {

    const sql = `
        INSERT INTO daily_logs
        (
            user_id,
            date,
            consumed_calories,
            consumed_protein_g,
            consumed_carbs_g,
            consumed_fats_g
        )
        VALUES (?, CURDATE(), 0, 0, 0, 0)
    `;

    db.query(sql, [userId], callback);

};

/**
 * Update today's nutrition totals
 */
exports.updateTodayLog = (
    userId,
    calories,
    protein,
    carbs,
    fats,
    callback
) => {

    const sql = `
        UPDATE daily_logs
        SET
            consumed_calories = consumed_calories + ?,
            consumed_protein_g = consumed_protein_g + ?,
            consumed_carbs_g = consumed_carbs_g + ?,
            consumed_fats_g = consumed_fats_g + ?
        WHERE
            user_id = ?
            AND date = CURDATE()
    `;

    db.query(
        sql,
        [
            calories,
            protein,
            carbs,
            fats,
            userId
        ],
        callback
    );

};