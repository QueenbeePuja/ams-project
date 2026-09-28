package com.ams.amsbackend.repository;

public interface AttendancePercentageProjection {
    Long getSubjectId();
    String getSubjectName();
    Long getPresentCount();
    Long getTotalCount();
}
