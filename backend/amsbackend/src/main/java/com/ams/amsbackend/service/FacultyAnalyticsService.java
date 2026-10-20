package com.ams.amsbackend.service;

import com.ams.amsbackend.dto.FacultyAnalyticsDTO.*;
import com.ams.amsbackend.model.Faculty;
import com.ams.amsbackend.model.Subject;
import com.ams.amsbackend.model.Timetable;
import com.ams.amsbackend.repository.AttendanceRepository;
import com.ams.amsbackend.repository.FacultyRepository;
import com.ams.amsbackend.repository.StudentSubjectProjection;
import com.ams.amsbackend.repository.TimetableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FacultyAnalyticsService {

    @Value("${ams.attendance.threshold:75}")
    private int threshold;

    @Autowired private FacultyRepository facultyRepository;
    @Autowired private TimetableRepository timetableRepository;
    @Autowired private AttendanceRepository attendanceRepository;

    public Optional<FacultySummary> getSummary(String userId) {
        Faculty faculty = facultyRepository.findByUserId(userId).orElse(null);
        if (faculty == null) return Optional.empty();

        // distinct subjects this faculty teaches (from the timetable)
        Map<Long, Subject> subjects = new LinkedHashMap<>();
        for (Timetable t : timetableRepository.findByFacultyId(faculty.getId())) {
            if (t.getSubject() != null) {
                subjects.putIfAbsent(t.getSubject().getId(), t.getSubject());
            }
        }

        List<SubjectSummary> result = new ArrayList<>();
        int totalLow = 0;

        for (Subject subject : subjects.values()) {
            List<StudentSubjectProjection> rows =
                    attendanceRepository.getStudentStatsForSubject(subject.getId());

            long allPresent = 0, allTotal = 0;
            List<LowStudent> low = new ArrayList<>();

            for (StudentSubjectProjection row : rows) {
                long present = row.getPresentCount() == null ? 0 : row.getPresentCount();
                long total = row.getTotalCount() == null ? 0 : row.getTotalCount();
                allPresent += present;
                allTotal += total;
                if (total == 0) continue;

                double pct = round1(100.0 * present / total);
                if (pct < threshold) {
                    low.add(new LowStudent(row.getStudentId(), row.getUserId(),
                            row.getStudentName(), present, total, pct));
                }
            }

            low.sort(Comparator.comparingDouble(LowStudent::percent));
            totalLow += low.size();

            Double avg = allTotal == 0 ? null : round1(100.0 * allPresent / allTotal);
            result.add(new SubjectSummary(subject.getId(), subject.getName(), subject.getCode(),
                    subject.getSemester(), rows.size(), avg, low.size(), low));
        }

        return Optional.of(new FacultySummary(faculty.getFullName(), threshold, totalLow, result));
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}