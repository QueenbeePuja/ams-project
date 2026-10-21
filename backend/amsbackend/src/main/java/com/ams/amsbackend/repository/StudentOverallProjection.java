package com.ams.amsbackend.repository;

public interface StudentOverallProjection {
    Long getStudentId();
    String getUserId();
    String getStudentName();
    Integer getSemester();
    Long getPresentCount();
    Long getTotalCount();
}