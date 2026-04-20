const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'firstTimers.db'));

const sample = [
  ['Philip Okoro', '+2347011111111', 'Friend or Family', 'Yes', 'Yes', 'WhatsApp', 'Yes', 'Media, Creative Arts', 'Sunday 7:00 AM'],
  ['Adaeze Obi', '+2347022222222', 'Social Media', 'Yes', 'Yes', 'Call', 'No', '', 'Sunday 9:00 AM'],
  ['Daniel Eze', '+2347033333333', 'Walk In', 'Yes', 'No', '', 'Yes', 'Ushering', 'Midweek Service'],
  ['Blessing Nwaeze', '+2347044444444', 'WhatsApp Invite', 'Yes', 'Yes', 'WhatsApp', 'Yes', 'Welfare, Greeters', 'Sunday 7:00 AM'],
  ['Ifeanyi Umeh', '+2347055555555', 'Flyer or Banner', 'Yes', 'No', '', 'No', '', 'Special Program']
];

function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

(async () => {
  try {
    for (let i = 0; i < sample.length; i++) {
      const row = sample[i];
      await run(`
        INSERT OR IGNORE INTO first_timers (
          full_name, phone, how_you_heard, is_first_time, want_contact, contact_method,
          want_department, departments, service, date_of_visit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', ?))
      `, [...row, `-${i} day`]);
    }
    console.log('Sample data inserted.');
  } catch (e) {
    console.error(e);
  } finally {
    db.close();
  }
})();
