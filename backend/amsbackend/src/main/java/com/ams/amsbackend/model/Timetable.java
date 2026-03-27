package com.ams.amsbackend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "timetable")
public class Timetable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String day;
    private  String timeSlot;
    private int semester;
    private  String room;
    private  String slotType;

    @ManyToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    public Subject getSubject() {
        return subject;
    }

    public Faculty getFaculty() {
        return faculty;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public String getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(String timeSlot) {
        this.timeSlot = timeSlot;
    }

    public int getSemester() {
        return semester;
    }

    public void setSemester(int semester) {
        this.semester = semester;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getSlotType() {
        return slotType;
    }

    public void setSlotType(String slotType) {
        this.slotType = slotType;
    }


}
