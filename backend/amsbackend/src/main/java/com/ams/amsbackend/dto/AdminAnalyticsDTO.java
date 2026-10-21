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
    public record Filters(List<String> departments, List<Integer> semesters) {}

    public record StudentRow(String userId, String name, String department, int semester,
                             long attended, long total, Double percent, String status) {}

    public record StudentView(int count, Double avgPercent, int belowCount, int noDataCount,
                              int threshold, List<StudentRow> students) {}

    public record FacultyRow(String userId, String name, String department, int subjects,
                             List<String> subjectNames, Double avgPercent, int lowStudents) {}

    public record FacultyView(int count, Double avgPercent, int threshold, List<FacultyRow> faculty) {}
}