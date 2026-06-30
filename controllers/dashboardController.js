const db = require("../config/db");

// Display Daily Fitness Tracking Dashboard
exports.showDashboard = (req, res) => {

    // Temporary user ID
    // Change this after login is implemented
    const userId = 1;

    const sql = `
        SELECT
            u.username,
            u.target_calories,
            u.target_protein_g,
            u.target_carbs_g,
            u.target_fats_g,

            IFNULL(d.consumed_calories, 0) AS consumed_calories,
            IFNULL(d.consumed_protein_g, 0) AS consumed_protein_g,
            IFNULL(d.consumed_carbs_g, 0) AS consumed_carbs_g,
            IFNULL(d.consumed_fats_g, 0) AS consumed_fats_g

        FROM users u

        LEFT JOIN daily_logs d
            ON u.user_id = d.user_id
            AND d.log_date = CURDATE()

        WHERE u.user_id = ?;
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        if (results.length === 0) {
            return res.send("User not found");
        }

        const user = results[0];

        // Calculate percentages
        user.caloriePercent = Math.round((user.consumed_calories / user.target_calories) * 100) || 0;
        user.proteinPercent = Math.round((user.consumed_protein_g / user.target_protein_g) * 100) || 0;
        user.carbPercent = Math.round((user.consumed_carbs_g / user.target_carbs_g) * 100) || 0;
        user.fatPercent = Math.round((user.consumed_fats_g / user.target_fats_g) * 100) || 0;

        // Remaining values
        user.remainingCalories = user.target_calories - user.consumed_calories;
        user.remainingProtein = user.target_protein_g - user.consumed_protein_g;
        user.remainingCarbs = user.target_carbs_g - user.consumed_carbs_g;
        user.remainingFats = user.target_fats_g - user.consumed_fats_g;

        // Status
        if (
            user.remainingCalories < 0 ||
            user.remainingProtein < 0 ||
            user.remainingCarbs < 0 ||
            user.remainingFats < 0
        ) {
            user.status = "Exceeded";
        } else {
            user.status = "Within Target";
        }

        res.render("dashboard", { user });

    });

};