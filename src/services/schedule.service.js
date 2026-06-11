const repo = require('../repositories/schedule.repository');
const { parseScheduleExcel } = require('../utils/excelParser');
const { generateRekapExcel } = require('../utils/excelExporter');

const ScheduleService = {
    getAll() {
        return repo.findAll();
    },

    async create(data) {
        const conflicts = await repo.findConflict(
            data.date, data.jam_ke, data.class_code, data.teacher_nik
        );
        if (conflicts.length) {
            const err = new Error('Jadwal bentrok: kelas atau guru sudah memiliki jadwal di jam dan tanggal yang sama');
            err.status = 409;
            throw err;
        }
        return repo.create(data);
    },

    async update(id, data) {
        if (data.date || data.jam_ke) {
            const existing = await repo.findById(id);
            if (!existing) {
                const err = new Error('Jadwal tidak ditemukan');
                err.status = 404;
                throw err;
            }
            const merged = { ...existing.toJSON(), ...data };
            const conflicts = await repo.findConflict(
                merged.date, merged.jam_ke, merged.class_code, merged.teacher_nik, id
            );
            if (conflicts.length) {
                const err = new Error('Jadwal bentrok: kelas atau guru sudah memiliki jadwal di jam dan tanggal yang sama');
                err.status = 409;
                throw err;
            }
        }
        const result = await repo.update(id, data);
        if (!result) {
            const err = new Error('Jadwal tidak ditemukan');
            err.status = 404;
            throw err;
        }
        return result;
    },

    async delete(id) {
        const result = await repo.delete(id);
        if (!result) {
            const err = new Error('Jadwal tidak ditemukan');
            err.status = 404;
            throw err;
        }
        return true;
    },

    async getStudentSchedule(class_code, date) {
        const rows = await repo.findByClassAndDate(class_code, date);
        if (!rows.length) return null;

        return {
            class_name: rows[0].class_name,
            date,
            jadwal: rows.map(r => ({
                jam_ke: r.jam_ke,
                subject_code: r.subject_code,
                teacher_name: r.teacher_name,
                time_start: r.time_start,
                time_end: r.time_end,
            })),
        };
    },

    async getTeacherSchedule(teacher_nik, start_date, end_date) {
        const rows = await repo.findByTeacherAndRange(teacher_nik, start_date, end_date);
        if (!rows.length) return null;

        return {
            teacher_name: rows[0].teacher_name,
            periode: { start_date, end_date },
            total_jp: rows.length,
            jadwal: rows.map(r => ({
                date: r.date,
                class_name: r.class_name,
                subject_code: r.subject_code,
                jam_ke: r.jam_ke,
                time_start: r.time_start,
                time_end: r.time_end,
            })),
        };
    },

    async getRekapJP(start_date, end_date) {
        const rows = await repo.findByDateRange(start_date, end_date);

        const getWeekLabel = (dateStr, rangeStart) => {
            const diff = (new Date(dateStr) - new Date(rangeStart)) / (1000 * 60 * 60 * 24);
            return `Pekan ${Math.floor(diff / 7) + 1}`;
        };

        const map = {};
        for (const r of rows) {
            if (!map[r.teacher_nik]) {
                map[r.teacher_nik] = {
                    teacher_nik: r.teacher_nik,
                    teacher_name: r.teacher_name,
                    total_jp: 0,
                    kelasMap: {},
                    weeklyJP: {},
                };
            }
            const t = map[r.teacher_nik];
            const week = getWeekLabel(r.date, start_date);
            t.total_jp++;
            t.kelasMap[r.class_name] = (t.kelasMap[r.class_name] || 0) + 1;
            t.weeklyJP[week] = (t.weeklyJP[week] || 0) + 1;
        }

        const rekap = Object.values(map).map(t => ({
            teacher_nik: t.teacher_nik,
            teacher_name: t.teacher_name,
            total_jp: t.total_jp,
            total_kelas: Object.keys(t.kelasMap).length,
            weeklyJP: t.weeklyJP,
            detail: Object.entries(t.kelasMap).map(([class_name, jumlah_jp]) => ({
                class_name, jumlah_jp,
            })),
        }));

        return {
            periode: { start_date, end_date },
            total_pengajar: rekap.length,
            rekap,
        };
    },

    async uploadFromExcel(filePath) {
        const rows = await parseScheduleExcel(filePath);
        if (!rows.length) {
            const err = new Error('File Excel kosong atau format tidak sesuai');
            err.status = 422;
            throw err;
        }
        await Promise.all(rows.map(r => repo.create(r).catch(() => null)));
        return rows.length;
    },

    async exportRekapExcel(start_date, end_date) {
        const rekapData = await this.getRekapJP(start_date, end_date);
        return generateRekapExcel(rekapData, start_date, end_date);
    },
};

module.exports = ScheduleService;