const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();

app.use(express.json());

let dbReady = false;
app.use(async (_req, _res, next) => {
    if (!dbReady) {
        await sequelize.sync();
        dbReady = true;
    }
    next();
});

const scheduleRoutes = require('./routes/schedule.route');

app.use('/api/schedules', scheduleRoutes);
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.get('/', (_req, res) => {
    res.json({ status: 'ok', message: 'Edulab Schedule API' });
});


module.exports = app;