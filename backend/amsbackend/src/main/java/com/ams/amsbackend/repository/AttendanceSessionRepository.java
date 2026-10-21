package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, String> {
    long countByDate(LocalDate date);
}
