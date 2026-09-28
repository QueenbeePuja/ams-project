package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.Attendance;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    boolean existsByStudentAndSubjectAndDate(Student student, Subject subject, LocalDate date);
    long countBySessionIdAndStatus(String sessionId,Attendance.AttendanceStatus status);
    long countBySessionId(String sessionId);

    @Query("""
SELECT 
    s.id as subjectId,
    s.name as subjectName,
    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as presentCount,
    COUNT(a.id) as totalCount
FROM Subject s
LEFT JOIN Attendance a 
    ON a.subject.id = s.id 
    AND a.student.id = :studentId
WHERE s.semester = :semester
GROUP BY s.id, s.name
""")
    List<AttendancePercentageProjection> getAttendanceStats(
            @Param("studentId") Long studentId,
            @Param("semester") int semester);
}

