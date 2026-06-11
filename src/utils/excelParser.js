const ExcelJS = require('exceljs');

async function parseScheduleExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.worksheets[0];
    const rows = [];
    let headers = [];

    sheet.eachRow((row, rowNumber) => {
        const values = row.values.slice(1);

        if (rowNumber === 1) {
            headers = values.map(h => String(h).trim().toLowerCase());
            return;
        }

        if (values.every(v => v == null || v === '')) return;

        const obj = {};
        headers.forEach((h, i) => {
            let val = values[i];

            if (h === 'date' && val instanceof Date) {
                val = val.toISOString().split('T')[0];
            }
            if ((h === 'time_start' || h === 'time_end') && val instanceof Date) {
                val = val.toISOString().split('T')[1].substring(0, 8);
            }

            obj[h] = val;
        });

        rows.push(obj);
    });

    return rows;
}

module.exports = { parseScheduleExcel };
