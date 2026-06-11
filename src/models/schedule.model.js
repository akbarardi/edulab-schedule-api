const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    class_code: DataTypes.STRING,
    class_name: DataTypes.STRING,
    subject_code: DataTypes.STRING,
    teacher_nik: DataTypes.STRING,
    teacher_name: DataTypes.STRING,
    date: DataTypes.DATEONLY,
    jam_ke: DataTypes.INTEGER,
    time_start: DataTypes.TIME,
    time_end: DataTypes.TIME,
}, {
    tableName: 'schedules',
    timestamps: false
});

module.exports = Schedule;