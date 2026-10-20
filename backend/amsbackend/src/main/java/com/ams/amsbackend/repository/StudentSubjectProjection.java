package com.ams.amsbackend.repository;

public interface StudentSubjectProjection {
    Long getStudentId();
    String getUserId();
    String getStudentName();
    Long getPresentCount();
    Long getTotalCount();
}