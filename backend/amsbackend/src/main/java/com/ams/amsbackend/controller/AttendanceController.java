package com.ams.amsbackend.controller;

import com.ams.amsbackend.dto.AttendancePercentageDTO;
import com.ams.amsbackend.model.Attendance;
import com.ams.amsbackend.model.AttendanceSession;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.model.Subject;
import com.ams.amsbackend.repository.AttendanceRepository;
import com.ams.amsbackend.repository.AttendanceSessionRepository;
import com.ams.amsbackend.repository.StudentRepository;
import com.ams.amsbackend.repository.SubjectRepository;
import com.ams.amsbackend.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(@RequestBody List<Attendance> attendanceList){
        for (Attendance attendance : attendanceList){
            boolean exists = attendanceRepository
                    .existsByStudentAndSubjectAndDate(
                            attendance.getStudent(),
                            attendance.getSubject(),
                            attendance.getDate()
                    );
            if(exists){
                return ResponseEntity.badRequest()
                        .body("Attendance already marked for student ID: "
                        + attendance.getStudent().getId());
            }
        }
        attendanceRepository.saveAll(attendanceList);
        return ResponseEntity.ok("Attendance Saved");

    }
    @PostMapping("/start-session")
    public ResponseEntity<?> startSession(@RequestParam Long subjectId,
                                          org.springframework.security.core.Authentication authentication){

        String role = authentication.getAuthorities().iterator().next().getAuthority();
        if(!role.equals("ROLE_FACULTY")){
            return ResponseEntity.status(403).body("Only faculty can start session");
        }
        String sessionId = java.util.UUID.randomUUID().toString();
        AttendanceSession session = new AttendanceSession();
        session.setSessionId(sessionId);
        session.setSubjectId(subjectId);
        session.setDate(java.time.LocalDate.now());
        session.setExpiryTime(java.time.LocalTime.now().plusMinutes(2));

        attendanceSessionRepository.save(session);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/scan")
    public ResponseEntity<?> scanAttendance(@RequestParam String sessionId,
                                            org.springframework.security.core.Authentication authentication) {

        // Student identity comes from the JWT, never from the request
        Student student = studentRepository.findByUserId(authentication.getName()).orElse(null);
        if (student == null) {
            return ResponseEntity.status(403).body("Only students can mark attendance");
        }

        // find session
        AttendanceSession session = attendanceSessionRepository
                .findById(sessionId)
                .orElse(null);
        if (session == null) {
            return ResponseEntity.badRequest().body("Invalid session");
        }

        // check expiry
        if (session.getExpiryTime().isBefore(java.time.LocalTime.now())) {
            return ResponseEntity.badRequest().body("Session expired");
        }

        Subject subject = subjectRepository.findById(session.getSubjectId()).orElse(null);
        if (subject == null) {
            return ResponseEntity.badRequest().body("Invalid data");
        }

        // student must belong to the semester this subject is taught in
        if (student.getCurrentSemester() != subject.getSemester()) {
            return ResponseEntity.status(403).body("This class is not for your semester");
        }

        // check duplicates
        boolean exist = attendanceRepository
                .existsByStudentAndSubjectAndDate(student, subject, session.getDate());
        if (exist) {
            return ResponseEntity.badRequest().body("Already marked");
        }

        // save attendance
        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setSubject(subject);
        attendance.setDate(session.getDate());
        attendance.setStatus(Attendance.AttendanceStatus.PRESENT);
        attendance.setSessionId(sessionId);
        attendanceRepository.save(attendance);

        return ResponseEntity.ok("Attendance marked via QR");
    }

    @PostMapping("/end-session")
    public ResponseEntity<?> endSession(@RequestParam String sessionId ){
        AttendanceSession session = attendanceSessionRepository
                .findById(sessionId).orElse(null);

        if(session == null){
            return  ResponseEntity.badRequest().body("Invalid session");
        }
        Subject subject = subjectRepository
                .findById(session.getSubjectId()).orElse(null);
        if(subject == null){
            return ResponseEntity.badRequest().body("Invalid subject");
        }
        int semester = subject.getSemester();
        //geting all students
        List<Student> students = studentRepository.findByCurrentSemester(semester);



        for(Student student : students){
            boolean exist = attendanceRepository
                    .existsByStudentAndSubjectAndDate(
                            student,
                            subject,
                            session.getDate()
                    );
            if(!exist){
                Attendance attendance = new Attendance();
                attendance.setStudent(student);
                attendance.setSubject(subject);
                attendance.setDate(session.getDate());
                attendance.setStatus(Attendance.AttendanceStatus.ABSENT);
                attendance.setSessionId(sessionId);

                attendanceRepository.save(attendance);
            }
        }
        return ResponseEntity.ok("Session ended. Absentees marked.");
    }
@GetMapping("/count")
    public ResponseEntity<?> getAttendanceCount(@RequestParam String sessionId){
        long present = attendanceRepository
                .countBySessionIdAndStatus(sessionId,Attendance.AttendanceStatus.PRESENT);
        long total = attendanceRepository.countBySessionId(sessionId);

        return ResponseEntity.ok(
                Map.of(
                        "present",present,
                        "total", total
                )
        );

    }

    @GetMapping("/percentage")
    public List<AttendancePercentageDTO> getPercentage(@RequestParam Long studentId){

        return attendanceService.getPercentage(studentId);
    }

}
