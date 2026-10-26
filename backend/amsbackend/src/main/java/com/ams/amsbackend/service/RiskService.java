package com.ams.amsbackend.service;

import com.ams.amsbackend.dto.RiskDTO.*;
import com.ams.amsbackend.model.Attendance;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.model.Timetable;
import com.ams.amsbackend.repository.AttendanceRepository;
import com.ams.amsbackend.repository.TimetableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class RiskService {

    private static final int MIN_RECORDS = 4;

    @Value("${ams.attendance.threshold:75}")
    private int threshold;

    @Value("${ams.semester.end-date:2026-12-15}")
    private String semesterEnd;

    @Value("${ams.risk.recent-window:6}")
    private int window;

    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private TimetableRepository timetableRepository;

    public RiskResult assess(Student student) {
        return assessOne(student, new HashMap<>());
    }

    public List<RiskResult> assessAll(List<Student> students) {
        Map<Integer, Integer> weeklyCache = new HashMap<>();
        List<RiskResult> out = new ArrayList<>();
        for (Student s : students) out.add(assessOne(s, weeklyCache));
        return out;
    }

    public RiskList buildList(List<RiskResult> results, boolean includeAll) {
        int high = 0, medium = 0, low = 0, insufficient = 0;
        List<RiskResult> shown = new ArrayList<>();

        for (RiskResult r : results) {
            switch (r.risk()) {
                case "HIGH" -> high++;
                case "MEDIUM" -> medium++;
                case "LOW" -> low++;
                default -> insufficient++;
            }
            boolean atRisk = r.risk().equals("HIGH") || r.risk().equals("MEDIUM");
            if (includeAll || atRisk) shown.add(r);
        }

        shown.sort(Comparator.comparingInt(RiskResult::score).reversed());
        return new RiskList(high, medium, low, insufficient, shown);
    }

    private RiskResult assessOne(Student s, Map<Integer, Integer> weeklyCache) {
        int semester = s.getCurrentSemester();

        List<Attendance> records = new ArrayList<>();
        for (Attendance a : attendanceRepository.findByStudentIdOrderByDateAsc(s.getId())) {
            if (a.getSubject() != null && a.getSubject().getSemester() == semester) {
                records.add(a);
            }
        }

        int total = records.size();
        if (total < MIN_RECORDS) {
            return new RiskResult(s.getUserId(), s.getFullName(), semester,
                    "INSUFFICIENT_DATA", 0, 0, 0, 0, 0, 0, true,
                    "Not enough classes recorded yet (at least " + MIN_RECORDS + " needed).");
        }

        long present = records.stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT).count();
        double overall = 100.0 * present / total;

        // recent window (last N classes)
        int n = Math.min(window, total);
        long recentPresent = records.subList(total - n, total).stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT).count();
        double recent = 100.0 * recentPresent / n;
        double trend = recent - overall;

        // expected future attendance rate: recent behaviour weighs more
        double rate = 0.6 * recent + 0.4 * overall;

        // estimate classes remaining until semester end
        int perWeek = weeklyCache.computeIfAbsent(semester, this::classesPerWeek);
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        long days = Math.max(0, ChronoUnit.DAYS.between(today, LocalDate.parse(semesterEnd)));
        int remaining = (int) Math.round(days / 7.0 * perWeek);

        double projected = 100.0 * (present + rate / 100.0 * remaining) / (total + remaining);

        int mustAttend = (int) Math.max(0,
                Math.ceil(threshold / 100.0 * (total + remaining) - present));
        boolean reachable = mustAttend <= remaining;

        // risk score: 50 at "projected exactly on threshold", rising as projection falls below
        double gap = threshold - projected;
        double score = 50 + 4 * gap + 0.5 * Math.max(0, -trend);
        if (!reachable) score = Math.max(score, 85);
        int sc = (int) Math.round(Math.max(0, Math.min(100, score)));

        String risk = sc >= 70 ? "HIGH" : sc >= 40 ? "MEDIUM" : "LOW";

        StringBuilder reason = new StringBuilder();
        reason.append(String.format(Locale.ENGLISH,
                "Projected %.1f%% by semester end", projected));
        reason.append(projected < threshold
                ? " (below " + threshold + "%)."
                : " (above " + threshold + "%).");
        if (Math.abs(trend) >= 10) {
            reason.append(String.format(Locale.ENGLISH,
                    " Recent attendance is %.0f%% vs %.0f%% overall.", recent, overall));
        }
        if (!reachable) {
            reason.append(" Even attending every remaining class cannot reach ")
                    .append(threshold).append("%.");
        } else if (mustAttend > 0) {
            reason.append(" Attend at least ").append(mustAttend)
                    .append(" of the next ").append(remaining)
                    .append(" classes to stay at ").append(threshold).append("%.");
        }

        return new RiskResult(s.getUserId(), s.getFullName(), semester, risk, sc,
                round1(overall), round1(recent), round1(projected),
                remaining, mustAttend, reachable, reason.toString());
    }

    private int classesPerWeek(int semester) {
        int count = 0;
        for (Timetable t : timetableRepository.findBySemester(semester)) {
            if ("CLASS".equalsIgnoreCase(t.getSlotType())) count++;
        }
        return count;
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}