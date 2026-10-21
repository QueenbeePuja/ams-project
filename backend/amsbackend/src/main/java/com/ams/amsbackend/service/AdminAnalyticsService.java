package com.ams.amsbackend.service;

import com.ams.amsbackend.dto.AdminAnalyticsDTO.*;
import com.ams.amsbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
public class AdminAnalyticsService {

    @Value("${ams.attendance.threshold:75}")
    private int threshold;

    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private SubjectRepository subjectRepository;

    public AdminSummary getSummary() {
        List<StudentOverallProjection> rows = attendanceRepository.getOverallStudentStats();

        long allPresent = 0, allTotal = 0;
        List<LowStudent> low = new ArrayList<>();

        // per-semester accumulators: [students, present, total, low]
        Map<Integer, long[]> bySem = new TreeMap<>();

        for (StudentOverallProjection r : rows) {
            long present = r.getPresentCount() == null ? 0 : r.getPresentCount();
            long total = r.getTotalCount() == null ? 0 : r.getTotalCount();
            int sem = r.getSemester() == null ? 0 : r.getSemester();
            if (total == 0) continue;

            allPresent += present;
            allTotal += total;

            double pct = round1(100.0 * present / total);
            long[] acc = bySem.computeIfAbsent(sem, k -> new long[4]);
            acc[0]++;
            acc[1] += present;
            acc[2] += total;

            if (pct < threshold) {
                acc[3]++;
                low.add(new LowStudent(r.getUserId(), r.getStudentName(), sem, present, total, pct));
            }
        }

        low.sort(Comparator.comparingDouble(LowStudent::percent));
        int totalLow = low.size();
        List<LowStudent> lowest = low.size() > 10 ? new ArrayList<>(low.subList(0, 10)) : low;

        List<SemesterStat> semesters = new ArrayList<>();
        for (Map.Entry<Integer, long[]> e : bySem.entrySet()) {
            long[] a = e.getValue();
            Double avg = a[2] == 0 ? null : round1(100.0 * a[1] / a[2]);
            semesters.add(new SemesterStat(e.getKey(), (int) a[0], avg, (int) a[3]));
        }

        long sessionsToday = attendanceRepository.countSessionsOnDate(
                LocalDate.now(ZoneId.of("Asia/Kolkata")));

        Double overall = allTotal == 0 ? null : round1(100.0 * allPresent / allTotal);

        return new AdminSummary(studentRepository.count(), facultyRepository.count(),
                subjectRepository.count(), sessionsToday, overall, threshold,
                totalLow, semesters, lowest);
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}