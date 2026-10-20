package com.ams.amsbackend.dto;

import java.util.List;

public class FacultyAnalyticsDTO {

    public record LowStudent(Long studentId, String userId, String name,
                             long attended, long total, double percent) {}

    public record SubjectSummary(Long subjectId, String subject, String code, int semester,
                                 int students, Double avgPercent, int lowCount,
                                 List<LowStudent> lowStudents) {}

    public record FacultySummary(String facultyName, int threshold,
                                 int totalLowStudents, List<SubjectSummary> subjects) {}
}