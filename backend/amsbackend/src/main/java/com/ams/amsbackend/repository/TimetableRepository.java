package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    boolean existsByFacultyAndDayAndTimeSlot(
            String faculty,
            String day,
            String timeSlot
    );
}
