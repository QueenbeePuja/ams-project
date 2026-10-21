package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.Faculty;
import com.ams.amsbackend.model.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    long countByDayIgnoreCaseAndSlotTypeIgnoreCase(String day, String slotType);
    boolean existsByFacultyAndDayAndTimeSlot(
            Faculty faculty,
            String day,
            String timeSlot
    );
    List<Timetable> findByDayAndTimeSlot(String day, String timeSlot);
    List<Timetable> findByFacultyId(Long facultyId);
    List<Timetable> findBySemester(int semester);
}

