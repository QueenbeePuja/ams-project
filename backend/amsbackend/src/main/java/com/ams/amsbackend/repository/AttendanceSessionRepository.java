package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, String> {

}
