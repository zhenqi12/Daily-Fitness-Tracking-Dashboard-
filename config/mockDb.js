// Mock Database for Testing
// Returns sample data for the fitness dashboard

const mockData = {
    users: [
        {
            user_id: 1,
            username: 'John Doe',
            target_calories: 2500,
            target_protein_g: 150,
            target_carbs_g: 300,
            target_fats_g: 83
        }
    ],
    daily_logs: [
        {
            log_id: 1,
            user_id: 1,
            log_date: new Date().toISOString().split('T')[0],
            consumed_calories: 1800,
            consumed_protein_g: 120,
            consumed_carbs_g: 200,
            consumed_fats_g: 60
        }
    ]
};

// Mock query function
const query = (sql, params, callback) => {
    // Simulate database delay
    setTimeout(() => {
        try {
            if (sql.includes('SELECT') && sql.includes('FROM users')) {
                const userId = params[0];
                const user = mockData.users.find(u => u.user_id === userId);
                
                if (user) {
                    const log = mockData.daily_logs.find(
                        l => l.user_id === userId && 
                        l.log_date === new Date().toISOString().split('T')[0]
                    );
                    
                    const result = {
                        ...user,
                        consumed_calories: log?.consumed_calories || 0,
                        consumed_protein_g: log?.consumed_protein_g || 0,
                        consumed_carbs_g: log?.consumed_carbs_g || 0,
                        consumed_fats_g: log?.consumed_fats_g || 0
                    };
                    
                    callback(null, [result]);
                } else {
                    callback(null, []);
                }
            } else if (sql.includes('INSERT')) {
                callback(null, { insertId: 1 });
            } else {
                callback(null, []);
            }
        } catch (err) {
            callback(err);
        }
    }, 100);
};

const connect = (callback) => {
    console.log('Mock Database connected successfully');
    if (callback) callback();
};

module.exports = {
    query,
    connect
};
