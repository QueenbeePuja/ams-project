package com.ams.amsbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
public class AttendanceSession {
    @Id
    private String sessionId;
    private Long subjectId;
    private LocalDate date;
    private LocalTime expiryTime;

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getExpiryTime() {
        return expiryTime;
    }
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String secret;

    public String getSecret(){
        return secret;
    }
    public void setSecret(String secret){
        this.secret = secret;
    }

    public void setExpiryTime(LocalTime expiryTime) {
        this.expiryTime = expiryTime;
    }
}
