package com.ams.amsbackend.repository;

public interface SubjectStatsProjection {
    Long getSubjectId();
    String getSubjectName();
    String getSubjectCode();
    Long getPresentCount();
    Long getTotalCount();
}
