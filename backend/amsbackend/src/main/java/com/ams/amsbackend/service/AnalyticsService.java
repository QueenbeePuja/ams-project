package com.ams.amsbackend.service;

import com.ams.amsbackend.dto.AnalyticsDTO.StudentSummary;
import com.ams.amsbackend.dto.AnalyticsDTO.SubjectStat;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.repository.AttendanceRepository;
import com.ams.amsbackend.repository.StudentRepository;
import com.ams.amsbackend.repository.SubjectStatsProjection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AnalyticsService {

    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private StudentRepository studentRepository;

    @Value("${ams.attendance.threshold:75}")
    private int threshold;

    public Optional<StudentSummary> getStudentSummary(String userId) {
        Student student = studentRepository.findByUserId(userId).orElse(null);
        if (student == null) {
            return Optional.empty();
        }

        List<SubjectStatsProjection> rows =
                attendanceRepository.getSubjectStats(student.getId(), student.getCurrentSemester());

        List<SubjectStat> subjects = new ArrayList<>();
        long allPresent = 0;
        long allTotal = 0;

        for (SubjectStatsProjection row : rows) {
            long present = row.getPresentCount() != null ? row.getPresentCount() : 0;
            long total = row.getTotalCount() != null ? row.getTotalCount() : 0;
            allPresent += present;
            allTotal += total;

            subjects.add(new SubjectStat(
                    row.getSubjectId(), row.getSubjectName(), row.getSubjectCode(),
                    present, total, percent(present, total),
                    status(present, total), canMiss(present, total), needToAttend(present, total)));
        }

        return Optional.of(new StudentSummary(
                percent(allPresent, allTotal), allPresent, allTotal, threshold,
                status(allPresent, allTotal),
                canMiss(allPresent, allTotal), needToAttend(allPresent, allTotal),
                subjects));
    }

    private double percent(long present, long total) {
        if (total == 0) return 0;
        return Math.round(present * 1000.0 / total) / 10.0;
    }

    // how many future classes can be missed while staying at or above the threshold
    private long canMiss(long present, long total) {
        long surplus = 100 * present - (long) threshold * total;
        return surplus > 0 ? surplus / threshold : 0;
    }

    // how many classes must be attended in a row to reach the threshold
    private long needToAttend(long present, long total) {
        long gap = (long) threshold * total - 100 * present;
        if (gap <= 0 || threshold >= 100) return 0;
        long per = 100 - threshold;
        return (gap + per - 1) / per;
    }

    private String status(long present, long total) {
        if (total == 0) return "NO_DATA";
        if (100 * present < (long) threshold * total) return "AT_RISK";
        return canMiss(present, total) <= 2 ? "WARNING" : "SAFE";
    }
}