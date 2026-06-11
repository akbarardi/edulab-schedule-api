const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();

app.use(express.json());

const scheduleRoutes = require('./routes/schedule.route');

app.use('/api/schedules', scheduleRoutes);
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.get('/', (_req, res) => {
    res.json({ status: 'ok', message: 'Edulab Schedule API' });
});


module.exports = app;