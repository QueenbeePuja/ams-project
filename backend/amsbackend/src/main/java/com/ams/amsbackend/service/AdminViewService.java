package com.ams.amsbackend.service;

import com.ams.amsbackend.dto.AdminAnalyticsDTO.*;
import com.ams.amsbackend.dto.FacultyAnalyticsDTO.FacultySummary;
import com.ams.amsbackend.dto.FacultyAnalyticsDTO.SubjectSummary;
import com.ams.amsbackend.model.Faculty;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminViewService {

    @Value("${ams.attendance.threshold:75}")
    private int threshold;

    @Autowired private StudentRepository studentRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private FacultyAnalyticsService facultyAnalyticsService;

    public Filters getFilters() {
        TreeSet<String> departments = new TreeSet<>();
        TreeSet<Integer> semesters = new TreeSet<>();

        for (Student s : studentRepository.findAll()) {
            if (s.getDepartment() != null && !s.getDepartment().isBlank())
                departments.add(s.getDepartment().trim());
            semesters.add(s.getCurrentSemester());
        }
        for (Faculty f : facultyRepository.findAll()) {
            if (f.getDepartment() != null && !f.getDepartment().isBlank())
                departments.add(f.getDepartment().trim());
        }
        return new Filters(new ArrayList<>(departments), new ArrayList<>(semesters));
    }

    public StudentView getStudentView(String department, Integer semester) {
        Map<Long, StudentOverallProjection> stats = new HashMap<>();
        for (StudentOverallProjection r : attendanceRepository.getOverallStudentStats()) {
            stats.put(r.getStudentId(), r);
        }

        List<StudentRow> rows = new ArrayList<>();
        long allPresent = 0, allTotal = 0;
        int below = 0, noData = 0;

        for (Student s : studentRepository.findAll()) {
            if (!matches(s.getDepartment(), department)) continue;
            if (semester != null && s.getCurrentSemester() != semester) continue;

            StudentOverallProjection r = stats.get(s.getId());
            long present = (r == null || r.getPresentCount() == null) ? 0 : r.getPresentCount();
            long total = (r == null || r.getTotalCount() == null) ? 0 : r.getTotalCount();

            Double pct = null;
            String status = "NO_DATA";
            if (total > 0) {
                pct = round1(100.0 * present / total);
                status = pct < threshold ? "AT_RISK" : "SAFE";
                allPresent += present;
                allTotal += total;
                if (pct < threshold) below++;
            } else {
                noData++;
            }

            rows.add(new StudentRow(s.getUserId(), s.getFullName(), s.getDepartment(),
                    s.getCurrentSemester(), present, total, pct, status));
        }

        // lowest first, students with no data last
        rows.sort(Comparator.comparing(
                (StudentRow r) -> r.percent() == null ? Double.MAX_VALUE : r.percent()));

        Double avg = allTotal == 0 ? null : round1(100.0 * allPresent / allTotal);
        return new StudentView(rows.size(), avg, below, noData, threshold, rows);
    }

    public FacultyView getFacultyView(String department, Integer semester) {
        List<FacultyRow> rows = new ArrayList<>();

        for (Faculty f : facultyRepository.findAll()) {
            if (!matches(f.getDepartment(), department)) continue;

            FacultySummary summary = facultyAnalyticsService.getSummary(f.getUserId()).orElse(null);
            List<SubjectSummary> subjects = new ArrayList<>();
            if (summary != null) {
                for (SubjectSummary s : summary.subjects()) {
                    if (semester == null || s.semester() == semester) subjects.add(s);
                }
            }
            // when filtering by semester, only show faculty who teach in that semester
            if (semester != null && subjects.isEmpty()) continue;

            double sum = 0;
            int counted = 0, low = 0;
            List<String> names = new ArrayList<>();
            for (SubjectSummary s : subjects) {
                names.add(s.subject());
                low += s.lowCount();
                if (s.avgPercent() != null) { sum += s.avgPercent(); counted++; }
            }
            Double avg = counted == 0 ? null : round1(sum / counted);

            rows.add(new FacultyRow(f.getUserId(), f.getFullName(), f.getDepartment(),
                    subjects.size(), names, avg, low));
        }

        rows.sort(Comparator.comparing(
                (FacultyRow r) -> r.avgPercent() == null ? Double.MAX_VALUE : r.avgPercent()));

        double sum = 0;
        int counted = 0;
        for (FacultyRow r : rows) {
            if (r.avgPercent() != null) { sum += r.avgPercent(); counted++; }
        }
        Double avg = counted == 0 ? null : round1(sum / counted);

        return new FacultyView(rows.size(), avg, threshold, rows);
    }

    private boolean matches(String actual, String wanted) {
        if (wanted == null || wanted.isBlank() || wanted.equalsIgnoreCase("all")) return true;
        return actual != null && actual.trim().equalsIgnoreCase(wanted.trim());
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}