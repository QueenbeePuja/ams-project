package com.ams.amsbackend.dto;

public class AttendancePercentageDTO {
    private String subject;
    private int percentage;
    private String display;

    public AttendancePercentageDTO(String subject, int percentage, String display) {
        this.subject = subject;
        this.percentage = percentage;
        this.display = display;
    }

    public String getSubject() {
        return subject;
    }

    public int getPercentage() {
        return percentage;
    }

    public String getDisplay() {
        return display;
    }
}
