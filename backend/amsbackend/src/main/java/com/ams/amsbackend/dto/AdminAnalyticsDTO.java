package com.ams.amsbackend.dto;

import java.util.List;

public class AdminAnalyticsDTO {

    public record LowStudent(String userId, String name, int semester,
                             long attended, long total, double percent) {}

    public record SemesterStat(int semester, int students, Double avgPercent, int lowCount) {}

    public record AdminSummary(long totalStudents, long totalFaculty, long totalSubjects,
                               long sessionsToday, Double overallPercent, int threshold,
                               int totalLowStudents, List<SemesterStat> semesters,
                               List<LowStudent> lowestStudents) {}
}