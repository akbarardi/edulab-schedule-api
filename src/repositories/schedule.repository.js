const Schedule = require('../models/schedule.model');
const { Op } = require('sequelize');

const ScheduleRepository = {
    findAll() {
        return Schedule.findAll({ order: [['date', 'ASC'], ['jam_ke', 'ASC']] });
    },

    findById(id) {
        return Schedule.findByPk(id);
    },

    create(data) {
        return Schedule.create(data);
    },

    async update(id, data) {
        const schedule = await Schedule.findByPk(id);
        if (!schedule) return null;
        return schedule.update(data);
    },

    async delete(id) {
        const schedule = await Schedule.findByPk(id);
        if (!schedule) return null;
        await schedule.destroy();
        return true;
    },

    findByClassAndDate(class_code, date) {
        return Schedule.findAll({
            where: { class_code, date },
            order: [['jam_ke', 'ASC']],
        });
    },

    findByTeacherAndRange(teacher_nik, start_date, end_date) {
        return Schedule.findAll({
            where: {
                teacher_nik,
                date: { [Op.between]: [start_date, end_date] },
            },
            order: [['date', 'ASC'], ['jam_ke', 'ASC']],
        });
    },

    findByDateRange(start_date, end_date) {
        return Schedule.findAll({
            where: {
                date: { [Op.between]: [start_date, end_date] },
            },
            order: [['teacher_nik', 'ASC'], ['date', 'ASC']],
        });
    },

    findConflict(date, jam_ke, class_code, teacher_nik, excludeId = null) {
        const where = {
            date,
            jam_ke,
            [Op.or]: [{ class_code }, { teacher_nik }],
        };
        if (excludeId) where.id = { [Op.ne]: excludeId };
        return Schedule.findAll({ where });
    },

};

module.exports = ScheduleRepository;
