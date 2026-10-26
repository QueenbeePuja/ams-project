USE ams_db;

-- A. SIX PLACEHOLDER STUDENTS (ids 5-10). Run this once only.
INSERT INTO students (college_email, current_semester, department, full_name, user_id) VALUES
('aarav.demo@example.com',  4, 'MCA', 'Aarav Mehta',  '24223901'),
('diya.demo@example.com',   4, 'MCA', 'Diya Nair',    '24223902'),
('rohan.demo@example.com',  4, 'MCA', 'Rohan Verma',  '24223903'),
('kavya.demo@example.com',  4, 'MCA', 'Kavya Iyer',   '24223904'),
('ishaan.demo@example.com', 4, 'MCA', 'Ishaan Gupta', '24223905'),
('meera.demo@example.com',  4, 'MCA', 'Meera Joshi',  '24223906');

-- B. REAL CLASS DAYS: 6 Jan - 16 Apr 2026, Mon-Thu, minus holidays and exam/break weeks
DROP TEMPORARY TABLE IF EXISTS class_days;
CREATE TEMPORARY TABLE class_days (dt DATE PRIMARY KEY);

INSERT INTO class_days (dt)
WITH RECURSIVE d AS (
  SELECT DATE('2026-01-06') AS dt
  UNION ALL
  SELECT dt + INTERVAL 1 DAY FROM d WHERE dt < DATE('2026-04-16')
)
SELECT dt FROM d
WHERE WEEKDAY(dt) <= 3
  AND dt NOT IN ('2026-01-26', '2026-03-04', '2026-03-31')
  AND dt NOT BETWEEN '2026-02-23' AND '2026-02-27'
  AND dt NOT BETWEEN '2026-03-02' AND '2026-03-06';

SELECT COUNT(*) AS class_days FROM class_days;   -- expect 49

-- C. HOW MUCH EACH STUDENT ATTENDS (edit these numbers freely)
-- rn = student order by id, base_rate = % attended, late_drop = extra % lost from 16 Mar onwards
DROP TEMPORARY TABLE IF EXISTS student_rates;
CREATE TEMPORARY TABLE student_rates (rn INT, base_rate INT, late_drop INT);
INSERT INTO student_rates VALUES
 (1, 88,  0),   -- Puja: healthy
 (2, 82,  0),   -- Ankita: healthy
 (3, 80, 30),   -- Manprabh: was fine, dropped off recently (good for the AI demo)
 (4, 68,  0),   -- Susmita: below threshold all semester
 (5, 94,  0),   -- Aarav: excellent
 (6, 90,  0),   -- Diya: excellent
 (7, 78,  0),   -- Rohan: borderline
 (8, 72, 15),   -- Kavya: borderline and slipping
 (9, 60,  0),   -- Ishaan: at risk
 (10, 85, 0);   -- Meera: healthy

DROP TEMPORARY TABLE IF EXISTS rated_students;
CREATE TEMPORARY TABLE rated_students AS
SELECT s.id AS student_id, r.base_rate, r.late_drop
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
      FROM students WHERE current_semester = 4) s
JOIN student_rates r ON r.rn = s.rn;

-- D. WHICH SUBJECT MEETS ON WHICH WEEKDAY (from your timetable)
DROP TEMPORARY TABLE IF EXISTS subject_days;
CREATE TEMPORARY TABLE subject_days AS
SELECT DISTINCT UPPER(day) AS day_name, subject_id
FROM timetable
WHERE semester = 4 AND slot_type = 'CLASS' AND subject_id IS NOT NULL;

-- E. GENERATE THE ATTENDANCE. Run this once only.
INSERT INTO attendance (student_id, subject_id, `date`, status, session_id)
SELECT rs.student_id,
       sd.subject_id,
       c.dt,
       CASE WHEN (CRC32(CONCAT(rs.student_id, '-', sd.subject_id, '-', c.dt)) % 100)
                 < (rs.base_rate - CASE WHEN c.dt >= '2026-03-16' THEN rs.late_drop ELSE 0 END)
            THEN 'PRESENT' ELSE 'ABSENT' END,
       CONCAT('HIST-', sd.subject_id, '-', DATE_FORMAT(c.dt, '%Y%m%d'))
FROM class_days c
JOIN subject_days sd ON sd.day_name = UPPER(DAYNAME(c.dt))
CROSS JOIN rated_students rs;

-- F. CHECK THE RESULT
SELECT COUNT(*) AS total_rows FROM attendance;   -- expect 2170 (217 classes x 10 students)

SELECT s.user_id, s.full_name,
       COUNT(*) AS classes,
       SUM(a.status = 'PRESENT') AS present,
       ROUND(100 * SUM(a.status = 'PRESENT') / COUNT(*), 1) AS pct
FROM attendance a JOIN students s ON s.id = a.student_id
GROUP BY s.id, s.user_id, s.full_name
ORDER BY pct DESC;

-- 1. check first: should return 84
SELECT COUNT(*) FROM attendance WHERE session_id NOT LIKE 'HIST-%';

-- 2. delete just those (id > 0 keeps MySQL's safe-update mode happy)
DELETE FROM attendance WHERE id > 0 AND session_id NOT LIKE 'HIST-%';

-- 3. old live-session records are no longer needed
DELETE FROM attendance_session WHERE session_id <> '';

-- 4. recheck
SELECT COUNT(*) AS total_rows FROM attendance;   -- expect 2170

SELECT s.user_id, s.full_name,
       COUNT(*) AS classes,
       SUM(a.status = 'PRESENT') AS present,
       ROUND(100 * SUM(a.status = 'PRESENT') / COUNT(*), 1) AS pct
FROM attendance a JOIN students s ON s.id = a.student_id
GROUP BY s.id, s.user_id, s.full_name
ORDER BY pct DESC;

