package com.ams.amsbackend.dto;

import java.util.List;

public class AnalyticsDTO {

    public record SubjectStat(Long subjectId, String subject, String code,
                              long attended, long total, double percent,
                              String status, long canMiss, long needToAttend) {}

    public record StudentSummary(double overallPercent, long attended, long total,
                                 int threshold, String overallStatus,
                                 long overallCanMiss, long overallNeedToAttend,
                                 List<SubjectStat> subjects) {}
}